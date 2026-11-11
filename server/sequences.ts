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
import {
  REAL_FOOD_RESET_DAY_DATES,
  REAL_FOOD_RESET_DAY_EMAILS,
} from "./emails/realFoodReset";
import {
  REAL_FOOD_RESET_OFFER_DATES,
  REAL_FOOD_RESET_OFFER_EMAILS,
} from "./emails/realFoodResetOffer";
import {
  REAL_FOOD_RESET_OFFER_SEQUENCE_ID,
  REAL_FOOD_RESET_SEQUENCE_ID,
} from "@shared/realFoodReset";
import { todayMountainDateStr } from "../lib/mountainTime";
import {
  HOLIDAY_ONBOARDING_DAY_OFFSETS,
  HOLIDAY_ONBOARDING_EMAILS,
} from "./emails/holidayOnboarding";
import {
  METABOLIC_ONBOARDING_DAY_OFFSETS,
  METABOLIC_ONBOARDING_EMAILS,
} from "./emails/metabolicOnboarding";
import {
  HOLIDAY_ONBOARDING_SEQUENCE_ID,
  METABOLIC_ONBOARDING_SEQUENCE_ID,
} from "@shared/programs";

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

interface CalendarSequenceConfig {
  type: "calendar_dates";
  emails: EmailGenerator[];
  /** America/Denver YYYY-MM-DD send dates */
  dates: readonly string[];
}

type SequenceConfig =
  | IntervalSequenceConfig
  | AbsoluteDaySequenceConfig
  | CalendarSequenceConfig;

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
  [REAL_FOOD_RESET_SEQUENCE_ID]: {
    type: "calendar_dates",
    emails: [...REAL_FOOD_RESET_DAY_EMAILS],
    dates: REAL_FOOD_RESET_DAY_DATES,
  },
  [REAL_FOOD_RESET_OFFER_SEQUENCE_ID]: {
    type: "calendar_dates",
    emails: [...REAL_FOOD_RESET_OFFER_EMAILS],
    dates: REAL_FOOD_RESET_OFFER_DATES,
  },
  [METABOLIC_ONBOARDING_SEQUENCE_ID]: {
    type: "absolute_days",
    emails: METABOLIC_ONBOARDING_EMAILS,
    dayOffsets: METABOLIC_ONBOARDING_DAY_OFFSETS,
  },
  [HOLIDAY_ONBOARDING_SEQUENCE_ID]: {
    type: "absolute_days",
    emails: HOLIDAY_ONBOARDING_EMAILS,
    dayOffsets: HOLIDAY_ONBOARDING_DAY_OFFSETS,
  },
};

export function getSequenceConfig(sequenceId: string): SequenceConfig | null {
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

  if (config.type === "calendar_dates") {
    const date = config.dates[stepIndex];
    if (!date) return false;
    return todayMountainDateStr() >= date;
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
    [REAL_FOOD_RESET_SEQUENCE_ID]:
      "You're receiving this because you registered for the 5-Day No Processed Food Challenge.",
    [REAL_FOOD_RESET_OFFER_SEQUENCE_ID]:
      "You're receiving this because you registered for the 5-Day No Processed Food Challenge.",
    [METABOLIC_ONBOARDING_SEQUENCE_ID]:
      "You're receiving this because you're enrolled in Metabolic Coaching.",
    [HOLIDAY_ONBOARDING_SEQUENCE_ID]:
      "You're receiving this because you're enrolled in the holiday program.",
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

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** mysql2 hands back `[ResultSetHeader, fields]`. A plain header is accepted too. */
function affectedRows(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result;
  if (header && typeof header === "object" && "affectedRows" in header) {
    const count = (header as { affectedRows?: unknown }).affectedRows;
    return typeof count === "number" ? count : 0;
  }
  return 0;
}

/**
 * Advance one step only if it is still the step we just decided to send.
 * A second caller (the poller, or a repeated enroll) loses the swap and
 * does not send that step again.
 */
async function claimEnrollmentStep(
  db: Database,
  enrollmentId: number,
  fromStep: number,
  toStep: number,
  status: "active" | "completed"
): Promise<boolean> {
  const result = await db
    .update(sequenceEnrollments)
    .set({
      currentStepId: toStep,
      status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sequenceEnrollments.id, enrollmentId),
        eq(sequenceEnrollments.currentStepId, fromStep),
        eq(sequenceEnrollments.status, "active")
      )
    );
  return affectedRows(result) > 0;
}

/** Put a step back so a later poller pass can retry a failed send. */
async function restoreEnrollmentStep(
  db: Database,
  enrollmentId: number,
  claimedStep: number,
  restoreStep: number,
  updatedAt: Date
): Promise<void> {
  await db
    .update(sequenceEnrollments)
    .set({
      currentStepId: restoreStep,
      status: "active",
      updatedAt,
    })
    .where(
      and(
        eq(sequenceEnrollments.id, enrollmentId),
        eq(sequenceEnrollments.currentStepId, claimedStep)
      )
    );
}

/**
 * Send every step that is already due for one enrollment, then advance it.
 * The 4-hour poller calls this for each active enrollment. A new enrollment
 * calls it once so a day-0 note (absolute offset 0) does not wait.
 */
export async function sendDueStepsForEnrollment(
  enrollmentId: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  let emailsSent = 0;
  let passes = 0;

  // One pass per step, plus a spare. Stops a stuck row from spinning.
  while (passes < 25) {
    passes += 1;
    const [enrollment] = await db
      .select()
      .from(sequenceEnrollments)
      .where(eq(sequenceEnrollments.id, enrollmentId))
      .limit(1);

    if (!enrollment || enrollment.status !== "active") break;

    const config = getSequenceConfig(enrollment.sequenceId);
    if (!config) {
      console.warn(`[Sequences] Unknown sequence: ${enrollment.sequenceId}`);
      break;
    }

    if (enrollment.currentStepId >= config.emails.length) break;

    if (enrollment.userId == null) break;

    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.id, enrollment.userId))
      .limit(1);

    if (!subscriber) break;

    if (isEmailOptedOut(subscriber.segments)) {
      await db
        .update(sequenceEnrollments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(sequenceEnrollments.id, enrollment.id),
            eq(sequenceEnrollments.status, "active")
          )
        );
      break;
    }

    const fromStep = enrollment.currentStepId;
    const nextStep = fromStep + 1;
    const nextStatus: "active" | "completed" =
      nextStep >= config.emails.length ? "completed" : "active";

    if (config.type === "calendar_dates") {
      const sendDate = config.dates[fromStep];
      const today = todayMountainDateStr();
      if (!sendDate || today < sendDate) break;
      if (today > sendDate) {
        const skipped = await claimEnrollmentStep(
          db,
          enrollment.id,
          fromStep,
          nextStep,
          nextStatus
        );
        if (!skipped) break;
        continue;
      }
    } else if (!isEnrollmentDue(enrollment, config)) {
      break;
    }

    const previousUpdatedAt =
      enrollment.updatedAt != null
        ? new Date(enrollment.updatedAt)
        : new Date();

    const claimed = await claimEnrollmentStep(
      db,
      enrollment.id,
      fromStep,
      nextStep,
      nextStatus
    );
    if (!claimed) break;

    let success = false;
    let failure: unknown;
    try {
      success = await sendSequenceStep(
        { ...enrollment, currentStepId: fromStep },
        subscriber,
        config
      );
    } catch (err) {
      failure = err;
    }

    if (!success) {
      console.error(
        `[Sequences] Enrollment ${enrollmentId} step ${fromStep + 1} did not send; the poller will retry.`,
        ...(failure === undefined ? [] : [failure])
      );
      try {
        await restoreEnrollmentStep(
          db,
          enrollment.id,
          nextStep,
          fromStep,
          previousUpdatedAt
        );
      } catch (restoreErr) {
        console.error(
          `[Sequences] Could not rewind enrollment ${enrollmentId} after a failed send:`,
          restoreErr
        );
      }
      break;
    }

    emailsSent++;
  }

  return emailsSent;
}

export async function processEmailSequences() {
  console.log("[Sequences] Starting sequence processor...");
  let emailsSent = 0;

  const db = await getDb();
  if (!db) return { success: false, error: "DB unavailable" };

  const activeEnrollments = await db
    .select({ id: sequenceEnrollments.id })
    .from(sequenceEnrollments)
    .where(eq(sequenceEnrollments.status, "active"));

  for (const { id } of activeEnrollments) {
    try {
      emailsSent += await sendDueStepsForEnrollment(id);
    } catch (err) {
      console.error(`[Sequences] Enrollment ${id} failed:`, err);
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
    const config = getSequenceConfig(sequenceId);
    let currentStepId = 0;
    let status: "active" | "completed" = "active";
    if (config?.type === "calendar_dates") {
      const today = todayMountainDateStr();
      const idx = config.dates.findIndex((d) => d >= today);
      if (idx < 0) {
        currentStepId = config.dates.length;
        status = "completed";
      } else {
        currentStepId = idx;
      }
    }
    const inserted = await db
      .insert(sequenceEnrollments)
      .values({
        userId,
        sequenceId,
        status,
        currentStepId,
        // App clock, so an offset of 0 is already due on this request.
        createdAt: opts?.anchorDate ?? new Date(),
      })
      .$returningId();
    console.log(`[Sequences] Enrolled ${email} in sequence: ${sequenceId}`);

    const enrollmentId = inserted[0]?.id;
    if (enrollmentId != null && status === "active") {
      // Due steps only (day 0 for absolute-day series). Later days stay on the poller.
      try {
        await sendDueStepsForEnrollment(enrollmentId);
      } catch (err) {
        console.error(
          `[Sequences] Immediate send failed for ${email} (${sequenceId}); the poller will retry:`,
          err
        );
      }
    }
  }

  return true;
}
