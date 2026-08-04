import { getDb } from "./db";
import { subscribers, sequenceEnrollments } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { FPU_EMAILS } from "./emails/fpuNewsletters";
import { RECLAIM_EMAILS } from "./emails/reclaimSequence";
import {
  SNACK_HACK_EMAILS,
  SNACK_HACK_DAY_OFFSETS,
} from "./emails/snackHackSequence";
import { FOOD_QUIZ_NURTURE_EMAILS } from "./emails/foodQuizNurture";
import {
  SNACK_HACK_RECLAIM_OFFER_EMAILS,
  SNACK_HACK_RECLAIM_OFFER_DAY_OFFSETS,
  SNACK_HACK_RECLAIM_OFFER_SEQUENCE_ID,
} from "./emails/snackHackReclaimOffer";
import { sendMarketingEmail, isEmailOptedOut } from "./emailMarketing";

export const SNACK_HACK_SEQUENCE_ID = "snack_hack_nurture";
export const FOOD_QUIZ_SEQUENCE_ID = "food_quiz_nurture";
export { SNACK_HACK_RECLAIM_OFFER_SEQUENCE_ID };

type EmailGenerator = (name: string) => { subject: string; html: string };

interface IntervalSequenceConfig {
  type: "interval";
  emails: EmailGenerator[];
  /** Days to wait after the previous email before sending the next step. */
  delayDays: number;
}

interface AbsoluteDaySequenceConfig {
  type: "absolute_days";
  emails: EmailGenerator[];
  /** Days after enrollment when each email should send. */
  dayOffsets: readonly number[];
}

type SequenceConfig = IntervalSequenceConfig | AbsoluteDaySequenceConfig;

const SEQUENCE_CONFIG: Record<string, SequenceConfig> = {
  reclaim_6_week: { type: "interval", emails: RECLAIM_EMAILS, delayDays: 7 },
  fpu_babystep_1: { type: "interval", emails: FPU_EMAILS, delayDays: 7 },
  [SNACK_HACK_SEQUENCE_ID]: {
    type: "absolute_days",
    emails: SNACK_HACK_EMAILS,
    dayOffsets: SNACK_HACK_DAY_OFFSETS,
  },
  // 6-email food quiz nurture — every 2 days after enrollment
  [FOOD_QUIZ_SEQUENCE_ID]: {
    type: "interval",
    emails: FOOD_QUIZ_NURTURE_EMAILS,
    delayDays: 2,
  },
  // Manual/batch enroll only — Snack Hack list → RECLAIM offer (not auto on leadgen)
  [SNACK_HACK_RECLAIM_OFFER_SEQUENCE_ID]: {
    type: "absolute_days",
    emails: [...SNACK_HACK_RECLAIM_OFFER_EMAILS],
    dayOffsets: SNACK_HACK_RECLAIM_OFFER_DAY_OFFSETS,
  },
};

function getSequenceConfig(sequenceId: string): SequenceConfig | null {
  return SEQUENCE_CONFIG[sequenceId] ?? null;
}

function isEnrollmentDue(
  enrollment: typeof sequenceEnrollments.$inferSelect,
  config: SequenceConfig
): boolean {
  const stepIndex = enrollment.currentStepId;
  const now = new Date();

  if (config.type === "absolute_days") {
    const offsetDays = config.dayOffsets[stepIndex];
    if (offsetDays === undefined) return false;
    const dueAt = new Date(enrollment.createdAt);
    dueAt.setDate(dueAt.getDate() + offsetDays);
    return now >= dueAt;
  }

  if (!enrollment.updatedAt) return true;
  const dueAt = new Date(enrollment.updatedAt);
  dueAt.setDate(dueAt.getDate() + config.delayDays);
  return now >= dueAt;
}

async function sendSequenceStep(
  enrollment: typeof sequenceEnrollments.$inferSelect,
  subscriber: typeof subscribers.$inferSelect,
  config: SequenceConfig
): Promise<boolean> {
  const stepIndex = enrollment.currentStepId;
  const getEmailContent = config.emails[stepIndex];
  if (!getEmailContent) return false;

  const emailContent = getEmailContent(subscriber.firstName || "Friend");

  if (isEmailOptedOut(subscriber.segments)) {
    console.log(
      `[Sequences] Skip ${enrollment.sequenceId} — opted out: ${subscriber.email}`
    );
    return false;
  }

  console.log(
    `[Sequences] Sending ${enrollment.sequenceId} step ${stepIndex + 1} to ${subscriber.email}`
  );

  const reasonBySequence: Record<string, string> = {
    [SNACK_HACK_SEQUENCE_ID]:
      "You're receiving this because you downloaded the Midlife Mindset Snack Hack.",
    [SNACK_HACK_RECLAIM_OFFER_SEQUENCE_ID]:
      "You're receiving this because you downloaded the Midlife Mindset Snack Hack.",
    [FOOD_QUIZ_SEQUENCE_ID]:
      "You're receiving this because you took the Food Freedom Quiz.",
    reclaim_6_week: "You're receiving this as part of your R.E.C.L.A.I.M. program.",
    fpu_babystep_1: "You're receiving this as part of your Financial Peace journey.",
  };

  const result = await sendMarketingEmail({
    to: subscriber.email,
    toName:
      `${subscriber.firstName || ""} ${subscriber.lastName || ""}`.trim() ||
      "Friend",
    subject: emailContent.subject,
    htmlBody: emailContent.html,
    textBody: "Please view this email in an HTML-compatible client.",
    reasonLine: reasonBySequence[enrollment.sequenceId],
    tags: [
      { name: "type", value: "sequence" },
      {
        name: "sequence_id",
        value: String(enrollment.sequenceId).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50),
      },
    ],
  });
  return result.ok;
}

export async function processEmailSequences() {
  console.log("[Sequences] Starting sequence processor...");
  let emailsSent = 0;

  const db = await getDb();
  if (!db) return { success: false, error: "DB unavailable" };

  const activeEnrollments = await db
    .select({
      enrollment: sequenceEnrollments,
      subscriber: subscribers,
    })
    .from(sequenceEnrollments)
    .innerJoin(subscribers, eq(sequenceEnrollments.userId, subscribers.id))
    .where(eq(sequenceEnrollments.status, "active"));

  for (const { enrollment, subscriber } of activeEnrollments) {
    const config = getSequenceConfig(enrollment.sequenceId);
    if (!config) {
      console.warn(`[Sequences] Unknown sequence: ${enrollment.sequenceId}`);
      continue;
    }

    // Honor marketing opt-out (Resend + local segment)
    if (isEmailOptedOut(subscriber.segments)) {
      await db
        .update(sequenceEnrollments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(sequenceEnrollments.id, enrollment.id));
      continue;
    }

    let currentEnrollment = enrollment;

    // Catch up on any overdue steps (e.g. backfilled leads who missed Day 3 and Day 7).
    while (currentEnrollment.currentStepId < config.emails.length) {
      if (!isEnrollmentDue(currentEnrollment, config)) break;

      const success = await sendSequenceStep(
        currentEnrollment,
        subscriber,
        config
      );
      if (!success) break;

      emailsSent++;
      const nextStep = currentEnrollment.currentStepId + 1;
      const isComplete = nextStep >= config.emails.length;

      await db
        .update(sequenceEnrollments)
        .set({
          currentStepId: nextStep,
          status: isComplete ? "completed" : "active",
          updatedAt: new Date(),
        })
        .where(eq(sequenceEnrollments.id, currentEnrollment.id));

      currentEnrollment = {
        ...currentEnrollment,
        currentStepId: nextStep,
        status: isComplete ? "completed" : "active",
      };
    }
  }

  console.log(`[Sequences] Processor finished. Sent ${emailsSent} emails.`);
  return { success: true, emailsSent };
}

export async function enrollUserInSequence(
  email: string,
  firstName: string | null,
  sequenceId: string,
  opts?: { anchorDate?: Date }
) {
  const db = await getDb();
  if (!db) return false;

  let userId: number;
  const existingSub = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1);

  if (existingSub.length > 0) {
    userId = existingSub[0].id;
  } else {
    const [newSub] = await db
      .insert(subscribers)
      .values({
        email,
        firstName: firstName ?? null,
        segments: JSON.stringify([sequenceId]),
      })
      .$returningId();
    userId = newSub.id;
  }

  const existingEnrollment = await db
    .select()
    .from(sequenceEnrollments)
    .where(
      and(
        eq(sequenceEnrollments.userId, userId),
        eq(sequenceEnrollments.sequenceId, sequenceId)
      )
    )
    .limit(1);

  if (existingEnrollment.length === 0) {
    await db.insert(sequenceEnrollments).values({
      userId,
      sequenceId,
      status: "active",
      currentStepId: 0,
      ...(opts?.anchorDate ? { createdAt: opts.anchorDate } : {}),
    });
    console.log(`[Sequences] Enrolled ${email} in sequence: ${sequenceId}`);
  }

  return true;
}
