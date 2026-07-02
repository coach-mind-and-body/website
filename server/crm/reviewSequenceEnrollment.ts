// @ts-nocheck
/**
 * Enrolls travelers into the Post-Trip Review Request sequence (2 touches max).
 * Sends step 1 immediately; step 2 fires 72h later via campaignJob cron.
 */

import { getDb } from "../db";
import {
  conversations,
  messages,
  reviewInvites,
  reviews,
  sequenceEnrollments,
  sequences,
  sequenceSteps,
  trips,
  users,
  vacationQuotes,
} from "../../drizzle/schema";
import { eq, and, asc, gt, gte, isNotNull, lte } from "drizzle-orm";
import { phoneColumnMatchSql } from "./contactResolver";
import { sendSms } from "./automations";
import { resolvePlaceholders } from "./templates";
import {
  enrollUserInSequence,
  advanceEnrollmentAfterStep,
  hasActiveEnrollmentInSequenceNames,
} from "./sequenceEnrollment";
import { QUOTE_NURTURE_SEQUENCE_NAMES } from "./sequenceRouter";
import crypto from "crypto";

export const REVIEW_SEQUENCE_NAME = "Post-Trip Review Request";

export const SEQUENCES_TO_CANCEL_ON_REPLY = [
  ...QUOTE_NURTURE_SEQUENCE_NAMES,
  REVIEW_SEQUENCE_NAME,
];

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type ReviewEnrollmentInput = {
  phone: string;
  name?: string | null;
  userId?: number | null;
  tripId?: number;
  destination?: string | null;
  sentVia: "sms" | "manual";
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z\s]/g, "").trim();
}

/** Fuzzy match user display name against a Google/Facebook reviewer name. */
export function reviewerNameMatchesUser(
  userName: string | null | undefined,
  authorName: string | null | undefined
): boolean {
  if (!userName?.trim() || !authorName?.trim()) return false;
  const u = normalizeName(userName);
  const a = normalizeName(authorName);
  if (u === a) return true;
  const uParts = u.split(/\s+/).filter(Boolean);
  const aParts = a.split(/\s+/).filter(Boolean);
  if (uParts.length === 0 || aParts.length === 0) return false;
  if (uParts[0] !== aParts[0]) return false;
  if (uParts.length === 1 || aParts.length === 1) return true;
  return uParts[uParts.length - 1] === aParts[aParts.length - 1];
}

export async function hasUserLeftReview(
  db: Db,
  userId: number,
  since?: Date
): Promise<boolean> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.name?.trim()) return false;

  const cutoff = since ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentReviews = await db
    .select({ authorName: reviews.authorName, reviewDate: reviews.reviewDate })
    .from(reviews)
    .where(gte(reviews.reviewDate, cutoff));

  return recentReviews.some((r) =>
    reviewerNameMatchesUser(user.name, r.authorName)
  );
}

async function resolveUserId(
  db: Db,
  input: ReviewEnrollmentInput
): Promise<number | null> {
  if (input.userId) return input.userId;

  const byPhone = await db.query.users.findFirst({
    where: phoneColumnMatchSql(users.phone, input.phone),
  });
  if (byPhone) return byPhone.id;

  if (!input.name?.trim()) return null;

  const placeholderOpenId = `review_${crypto.randomBytes(12).toString("hex")}`;
  const [result] = await db.insert(users).values({
    openId: placeholderOpenId,
    name: input.name,
    phone: input.phone,
    email: `review-${input.phone.replace(/\D/g, "")}@noemail.coachmindandbody.com`,
    role: "user",
    loginMethod: "password",
  });
  return result.insertId;
}

async function ensureConversation(
  db: Db,
  phone: string,
  userId: number
): Promise<number> {
  const existing = await db.query.conversations.findFirst({
    where: phoneColumnMatchSql(conversations.contactPhone, phone),
  });
  if (existing) {
    if (!existing.userId) {
      await db
        .update(conversations)
        .set({ userId })
        .where(eq(conversations.id, existing.id));
    }
    return existing.id;
  }

  const [inserted] = await db.insert(conversations).values({
    contactPhone: phone,
    userId,
    platform: "sms",
    status: "open",
    unreadCount: 0,
  });
  return inserted.insertId;
}

async function sendStepAndAdvance(
  db: Db,
  enrollmentId: number,
  userId: number,
  phone: string,
  step: { id: number; stepOrder: number; messageBody: string },
  sequenceId: number,
  placeholderData: { firstName?: string | null; destination?: string | null }
): Promise<void> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const firstName =
    placeholderData.firstName ||
    (user?.name ? user.name.split(" ")[0] : null);
  const body = resolvePlaceholders(step.messageBody, {
    firstName,
    destination: placeholderData.destination,
  });

  const twilioMsg = await sendSms(phone, body);
  const convId = await ensureConversation(db, phone, userId);

  await db.insert(messages).values({
    conversationId: convId,
    direction: "outbound",
    content: body,
    senderName: "Review Sequence",
    isAutomated: true,
    status: "sent",
    twilioSid: twilioMsg?.sid,
  });
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date(), status: "closed" })
    .where(eq(conversations.id, convId));

  await advanceEnrollmentAfterStep(
    db,
    enrollmentId,
    step.stepOrder,
    sequenceId
  );
}

/**
 * Enroll contact in Post-Trip Review Request and send step 1 immediately.
 */
export async function enrollInReviewSequence(
  input: ReviewEnrollmentInput
): Promise<{ enrolled: boolean; reason?: string }> {
  if (!input.phone?.trim()) {
    return { enrolled: false, reason: "no_phone" };
  }

  const db = await getDb();
  if (!db) return { enrolled: false, reason: "no_db" };

  if (input.tripId) {
    const [existingInvite] = await db
      .select({ id: reviewInvites.id })
      .from(reviewInvites)
      .where(eq(reviewInvites.tripId, input.tripId))
      .limit(1);
    if (existingInvite) {
      return { enrolled: false, reason: "already_invited" };
    }
  }

  const sequence = await db.query.sequences.findFirst({
    where: and(
      eq(sequences.name, REVIEW_SEQUENCE_NAME),
      eq(sequences.isActive, true)
    ),
  });
  if (!sequence) {
    console.warn(`[Review Sequence] No active sequence: "${REVIEW_SEQUENCE_NAME}"`);
    return { enrolled: false, reason: "sequence_not_found" };
  }

  const userId = await resolveUserId(db, input);
  if (!userId) {
    return { enrolled: false, reason: "no_user" };
  }

  if (await hasUserLeftReview(db, userId)) {
    return { enrolled: false, reason: "already_reviewed" };
  }

  const inQuoteNurture = await hasActiveEnrollmentInSequenceNames(
    db,
    userId,
    QUOTE_NURTURE_SEQUENCE_NAMES
  );
  if (inQuoteNurture) {
    return { enrolled: false, reason: "active_quote_nurture" };
  }

  const inReviewSeq = await hasActiveEnrollmentInSequenceNames(db, userId, [
    REVIEW_SEQUENCE_NAME,
  ]);
  if (inReviewSeq) {
    return { enrolled: false, reason: "already_enrolled" };
  }

  const firstStep = await db.query.sequenceSteps.findFirst({
    where: eq(sequenceSteps.sequenceId, sequence.id),
    orderBy: [asc(sequenceSteps.stepOrder)],
  });
  if (!firstStep) {
    return { enrolled: false, reason: "no_steps" };
  }

  const enrollResult = await enrollUserInSequence(db, userId, sequence.id);
  if (!enrollResult.success || !enrollResult.enrollmentId) {
    return { enrolled: false, reason: "enroll_failed" };
  }

  const firstName = input.name ? input.name.split(" ")[0] : null;

  try {
    await sendStepAndAdvance(
      db,
      enrollResult.enrollmentId,
      userId,
      input.phone,
      firstStep,
      sequence.id,
      { firstName, destination: input.destination }
    );
  } catch (err) {
    await db
      .update(sequenceEnrollments)
      .set({ status: "cancelled", currentStepId: null })
      .where(eq(sequenceEnrollments.id, enrollResult.enrollmentId));
    throw err;
  }

  await db.insert(reviewInvites).values({
    userId,
    tripId: input.tripId,
    phone: input.phone,
    sentVia: input.sentVia,
    status: "sent",
  });

  console.log(
    `[Review Sequence] Enrolled ${input.phone} (${input.name || "unknown"}) — step 1 sent`
  );

  return { enrolled: true };
}

/** Cancel active review sequence for a user (reply, click, or review left). */
export async function cancelReviewSequenceForUser(
  db: Db,
  userId: number
): Promise<void> {
  const { cancelActiveEnrollmentsForUser } = await import("./sequenceEnrollment");
  await cancelActiveEnrollmentsForUser(db, userId, [REVIEW_SEQUENCE_NAME]);
}

/** After a new synced review, cancel matching enrollments and mark invites converted. */
export async function handleNewReviewAuthor(
  db: Db,
  authorName: string
): Promise<void> {
  const recentInvites = await db
    .select({
      id: reviewInvites.id,
      userId: reviewInvites.userId,
      phone: reviewInvites.phone,
    })
    .from(reviewInvites)
    .where(gte(reviewInvites.sentAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)));

  for (const invite of recentInvites) {
    if (!invite.userId) continue;
    const user = await db.query.users.findFirst({
      where: eq(users.id, invite.userId),
    });
    if (!reviewerNameMatchesUser(user?.name, authorName)) continue;

    await cancelReviewSequenceForUser(db, invite.userId);
    await db
      .update(reviewInvites)
      .set({ status: "converted" })
      .where(eq(reviewInvites.id, invite.id));
  }
}

/**
 * Daily cron: enroll returning travelers into the review sequence.
 */
export async function processPostTravelReviewInvites(): Promise<{
  trips: number;
  quotes: number;
}> {
  const db = await getDb();
  if (!db) return { trips: 0, quotes: 0 };

  const now = new Date();
  const yesterdayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
  const yesterdayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    23,
    59,
    59
  );

  let tripsSent = 0;
  let quotesSent = 0;

  const completedTrips = await db
    .select()
    .from(trips)
    .where(
      and(
        isNotNull(trips.returnDate),
        gte(trips.returnDate, yesterdayStart),
        lte(trips.returnDate, yesterdayEnd)
      )
    );

  for (const trip of completedTrips) {
    try {
      let phone = "";
      if (trip.clientUserId) {
        const [user] = await db
          .select({ phone: users.phone })
          .from(users)
          .where(eq(users.id, trip.clientUserId));
        if (user?.phone) phone = user.phone;
      }
      if (!phone && trip.quoteId) {
        const [quote] = await db
          .select({ phone: vacationQuotes.phone })
          .from(vacationQuotes)
          .where(eq(vacationQuotes.id, trip.quoteId));
        if (quote?.phone) phone = quote.phone;
      }
      if (!phone) continue;

      const result = await enrollInReviewSequence({
        phone,
        name: trip.clientName,
        userId: trip.clientUserId,
        tripId: trip.id,
        destination: trip.destination,
        sentVia: "sms",
      });

      if (result.enrolled) tripsSent++;
      else if (result.reason !== "already_invited") {
        console.log(
          `[Review Cron] Skipped trip ${trip.id}: ${result.reason}`
        );
      }
    } catch (err: any) {
      console.error(`[Review Cron] Trip ${trip.id} failed:`, err.message);
    }
  }

  const completedQuotes = await db
    .select()
    .from(vacationQuotes)
    .where(
      and(
        isNotNull(vacationQuotes.tripEndDate),
        gte(vacationQuotes.tripEndDate, yesterdayStart),
        lte(vacationQuotes.tripEndDate, yesterdayEnd)
      )
    );

  for (const quote of completedQuotes) {
    if (!quote.phone) continue;
    try {
      const result = await enrollInReviewSequence({
        phone: quote.phone,
        name: quote.name,
        userId: quote.clientUserId ?? quote.userId,
        tripId: quote.id,
        destination: quote.destination,
        sentVia: "sms",
      });

      if (result.enrolled) quotesSent++;
      else if (result.reason !== "already_invited") {
        console.log(
          `[Review Cron] Skipped quote ${quote.id}: ${result.reason}`
        );
      }
    } catch (err: any) {
      console.error(`[Review Cron] Quote ${quote.id} failed:`, err.message);
    }
  }

  console.log(
    `[Review Cron] Complete — trips: ${tripsSent}, quotes: ${quotesSent}`
  );

  return { trips: tripsSent, quotes: quotesSent };
}