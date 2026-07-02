/**
 * Auto-enrolls vacation quote submitters into destination-based nurture sequences.
 */

import { getDb } from "../db";
import {
  conversations,
  sequences,
  users,
  vacationQuotes,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { phoneColumnMatchSql } from "./contactResolver";
import { resolveSequenceNameForQuote } from "./sequenceRouter";
import { enrollUserInSequence } from "./sequenceEnrollment";
import crypto from "crypto";

export type QuoteEnrollmentInput = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  destination?: string | null;
  vacationType?: string | null;
};

async function resolveOrCreateUserForQuote(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  quote: QuoteEnrollmentInput
): Promise<number | null> {
  if (quote.phone) {
    const byPhone = await db.query.users.findFirst({
      where: phoneColumnMatchSql(users.phone, quote.phone),
    });
    if (byPhone) {
      if (!byPhone.name && quote.name) {
        await db.update(users).set({ name: quote.name }).where(eq(users.id, byPhone.id));
      }
      return byPhone.id;
    }
  }

  const byEmail = await db.query.users.findFirst({
    where: eq(users.email, quote.email),
  });
  if (byEmail) {
    if (quote.phone && !byEmail.phone) {
      await db.update(users).set({ phone: quote.phone }).where(eq(users.id, byEmail.id));
    }
    return byEmail.id;
  }

  const placeholderOpenId = `quote_${crypto.randomBytes(12).toString("hex")}`;
  const [result] = await db.insert(users).values({
    openId: placeholderOpenId,
    email: quote.email,
    name: quote.name,
    phone: quote.phone || null,
    role: "user",
    loginMethod: "password",
  });

  return result.insertId;
}

async function ensureConversation(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  phone: string,
  userId: number,
  email?: string
): Promise<void> {
  const existing = await db.query.conversations.findFirst({
    where: phoneColumnMatchSql(conversations.contactPhone, phone),
  });

  if (existing) {
    const updates: Partial<{
      userId: number;
      contactEmail: string;
      botActive: boolean;
    }> = {};
    if (!existing.userId) updates.userId = userId;
    if (email && !existing.contactEmail) updates.contactEmail = email;
    if (!existing.botActive) updates.botActive = true;
    if (Object.keys(updates).length > 0) {
      await db.update(conversations).set(updates).where(eq(conversations.id, existing.id));
    }
    return;
  }

  await db.insert(conversations).values({
    contactPhone: phone,
    contactEmail: email || null,
    userId,
    platform: "sms",
    status: "open",
    unreadCount: 0,
    botActive: true,
  });
}

/**
 * Enroll a new quote submitter into the matching nurture sequence.
 * Skips lead-magnet submissions and quotes without a phone number.
 */
export async function enrollQuoteInNurtureSequence(
  quote: QuoteEnrollmentInput
): Promise<{ enrolled: boolean; sequenceName?: string; reason?: string }> {
  if (!quote.phone?.trim()) {
    return { enrolled: false, reason: "no_phone" };
  }

  if (quote.vacationType === "lead-magnet") {
    return { enrolled: false, reason: "lead_magnet" };
  }

  const db = await getDb();
  if (!db) return { enrolled: false, reason: "no_db" };

  const sequenceName = resolveSequenceNameForQuote(quote);

  const sequence = await db.query.sequences.findFirst({
    where: and(eq(sequences.name, sequenceName), eq(sequences.isActive, true)),
  });

  if (!sequence) {
    console.warn(`[Quote Sequence] No active sequence found: "${sequenceName}"`);
    return { enrolled: false, reason: "sequence_not_found", sequenceName };
  }

  const userId = await resolveOrCreateUserForQuote(db, quote);
  if (!userId) {
    return { enrolled: false, reason: "no_user", sequenceName };
  }

  await ensureConversation(db, quote.phone, userId, quote.email);

  const result = await enrollUserInSequence(db, userId, sequence.id);
  if (!result.success) {
    return { enrolled: false, reason: "already_enrolled", sequenceName };
  }

  await db
    .update(vacationQuotes)
    .set({ status: "contacted", userId })
    .where(eq(vacationQuotes.id, quote.id));

  console.log(
    `[Quote Sequence] Enrolled quote #${quote.id} (${quote.name}) → "${sequenceName}"`
  );

  return { enrolled: true, sequenceName };
}

/** Fetch the most recent quote for a user (for template placeholders in cron). */
export async function getLatestQuoteForUser(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number
): Promise<{ destination: string | null; vacationType: string | null } | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;

  const [quote] = await db
    .select({
      destination: vacationQuotes.destination,
      vacationType: vacationQuotes.vacationType,
    })
    .from(vacationQuotes)
    .where(eq(vacationQuotes.userId, userId))
    .orderBy(desc(vacationQuotes.createdAt))
    .limit(1);

  if (quote) return quote;

  if (user.email) {
    const [byEmail] = await db
      .select({
        destination: vacationQuotes.destination,
        vacationType: vacationQuotes.vacationType,
      })
      .from(vacationQuotes)
      .where(eq(vacationQuotes.email, user.email))
      .orderBy(desc(vacationQuotes.createdAt))
      .limit(1);
    if (byEmail) return byEmail;
  }

  return null;
}