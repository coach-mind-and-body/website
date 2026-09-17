/**
 * Upserts Real Food Reset warmup / promo / daily emails as newsletter drafts
 * (or scheduled, if suggestedSendAt is in the future).
 *
 * Usage: npx tsx scripts/seed-real-food-reset-newsletters.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { emailNewsletters } from "../drizzle/schema";
import { REAL_FOOD_RESET_EMAILS } from "../server/emails/realFoodReset";
import { DEFAULT_GREETING, DEFAULT_SIGN_OFF_CLOSING, DEFAULT_SIGN_OFF_NAME, DEFAULT_SIGN_OFF_TITLE } from "../server/emails/newsletterShell";
import { enrollUserInSequence } from "../server/sequences";
import { subscribers } from "../drizzle/schema";
import { parseSegments } from "../server/emailMarketing";
import {
  REAL_FOOD_RESET_OFFER_SEQUENCE_ID,
  REAL_FOOD_RESET_SEQUENCE_ID,
} from "@shared/realFoodReset";

function mountainToUtc(local: string): Date {
  // Challenge window is MDT (UTC-6)
  return new Date(`${local}-06:00`);
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  let created = 0;
  let updated = 0;

  for (const email of REAL_FOOD_RESET_EMAILS) {
    const scheduledAt = mountainToUtc(email.suggestedSendAt);
    const existing = await db
      .select({ id: emailNewsletters.id, status: emailNewsletters.status })
      .from(emailNewsletters)
      .where(eq(emailNewsletters.subject, email.subject))
      .limit(1);

    const values = {
      subject: email.subject,
      previewText: email.previewText,
      headline: email.headline,
      subheadline: email.subheadline ?? null,
      greetingTemplate: DEFAULT_GREETING,
      signOffClosing: DEFAULT_SIGN_OFF_CLOSING,
      signOffName: DEFAULT_SIGN_OFF_NAME,
      signOffTitle: DEFAULT_SIGN_OFF_TITLE,
      bodyHtml: email.bodyHtml,
      ctaLabel: email.ctaLabel || null,
      ctaUrl: email.ctaUrl || null,
      audienceGroup: email.audienceGroup,
      excludeEnrolled: false,
      excludeEmails: "[]",
      scheduledAt,
    };

    if (existing.length > 0) {
      if (existing[0].status === "sent" || existing[0].status === "sending") {
        console.log(`skip sent: ${email.key}`);
        continue;
      }
      await db
        .update(emailNewsletters)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(emailNewsletters.id, existing[0].id));
      updated++;
      console.log(`updated draft: ${email.key} → ${email.subject}`);
    } else {
      await db.insert(emailNewsletters).values({
        ...values,
        status: "draft",
      });
      created++;
      console.log(`created draft: ${email.key} → ${email.subject}`);
    }
  }

  console.log(`Done. created=${created} updated=${updated}`);
  console.log("Open Admin → Newsletter, review, then Schedule warmup/promo only.");
  console.log("Reminder + daily + post-challenge emails send via sequence — do not also Schedule those.");

  const people = await db.select().from(subscribers);
  let enrolled = 0;
  for (const person of people) {
    const segs = parseSegments(person.segments);
    const isRfr = segs.some(
      (s) => s === "leadgen_real_food_reset" || s.includes("real_food_reset") || s.includes("real-food-reset")
    );
    if (!isRfr || !person.email) continue;
    await enrollUserInSequence(person.email, person.firstName, REAL_FOOD_RESET_SEQUENCE_ID);
    await enrollUserInSequence(person.email, person.firstName, REAL_FOOD_RESET_OFFER_SEQUENCE_ID);
    enrolled++;
  }
  console.log(`Offer/day sequences: enrolled or already in for ${enrolled} Real Food Reset subscribers.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
