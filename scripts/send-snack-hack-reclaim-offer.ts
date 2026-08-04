/**
 * Enroll snack-hack leads (+ optional extras) in RECLAIM offer sequence,
 * send Email 1 immediately, leave Email 2 for day+3 via sequence processor.
 *
 * Usage: npx tsx scripts/send-snack-hack-reclaim-offer.ts
 * Dry run: npx tsx scripts/send-snack-hack-reclaim-offer.ts --dry-run
 */
import "dotenv/config";
import { like, and, eq, or } from "drizzle-orm";
import { getDb } from "../server/db";
import { subscribers, sequenceEnrollments } from "../drizzle/schema";
import {
  enrollUserInSequence,
  SNACK_HACK_RECLAIM_OFFER_SEQUENCE_ID,
} from "../server/sequences";
import { getSnackHackReclaimOfferEmail1 } from "../server/emails/snackHackReclaimOffer";
import {
  sendMarketingEmail,
  isEmailOptedOut,
  parseSegments,
} from "../server/emailMarketing";

/** Always include (e.g. test inbox) even if not a snack-hack lead */
const EXTRA_EMAILS = ["carterseitz35@gmail.com"];

const dryRun = process.argv.includes("--dry-run");

async function ensureSubscriber(
  email: string,
  firstName: string | null
): Promise<{ id: number; email: string; firstName: string | null; segments: string | null }> {
  const db = await getDb();
  if (!db) throw new Error("No DB");
  const normalized = email.toLowerCase().trim();
  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, normalized))
    .limit(1);
  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      firstName: existing.firstName,
      segments: existing.segments,
    };
  }
  const [inserted] = await db
    .insert(subscribers)
    .values({
      email: normalized,
      firstName,
      segments: JSON.stringify(["leadgen_snack_hack", "manual_reclaim_offer"]),
    })
    .$returningId();
  return {
    id: inserted.id,
    email: normalized,
    firstName,
    segments: JSON.stringify(["leadgen_snack_hack", "manual_reclaim_offer"]),
  };
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  const leads = await db
    .select()
    .from(subscribers)
    .where(like(subscribers.segments, "%leadgen_snack_hack%"));

  console.log(`Found ${leads.length} snack-hack leads in DB`);

  const byEmail = new Map<
    string,
    { id: number; email: string; firstName: string | null; segments: string | null }
  >();

  for (const lead of leads) {
    byEmail.set(lead.email.toLowerCase().trim(), {
      id: lead.id,
      email: lead.email.toLowerCase().trim(),
      firstName: lead.firstName,
      segments: lead.segments,
    });
  }

  for (const extra of EXTRA_EMAILS) {
    const key = extra.toLowerCase().trim();
    if (!byEmail.has(key)) {
      if (dryRun) {
        console.log(`[dry-run] Would create subscriber for extra: ${key}`);
        byEmail.set(key, {
          id: -1,
          email: key,
          firstName: "Carter",
          segments: null,
        });
      } else {
        const sub = await ensureSubscriber(key, "Carter");
        byEmail.set(key, sub);
        console.log(`Added extra recipient: ${key}`);
      }
    } else {
      console.log(`Extra already on snack-hack list: ${key}`);
    }
  }

  const recipients = [...byEmail.values()];
  console.log(`Total unique recipients: ${recipients.length}`);
  if (dryRun) console.log("*** DRY RUN — no enrollments or sends ***\n");

  let enrolled = 0;
  let sent = 0;
  let skippedOptOut = 0;
  let skippedAlready = 0;
  let failed = 0;

  for (const person of recipients) {
    const email = person.email.toLowerCase().trim();

    if (isEmailOptedOut(person.segments)) {
      console.log(`  SKIP opt-out: ${email}`);
      skippedOptOut++;
      continue;
    }

    // Also skip if segments somehow include opt-out after re-fetch
    const segs = parseSegments(person.segments);
    if (segs.includes("email_opt_out")) {
      console.log(`  SKIP opt-out: ${email}`);
      skippedOptOut++;
      continue;
    }

    if (dryRun) {
      console.log(`  [dry-run] Would enroll + send E1: ${email}`);
      enrolled++;
      sent++;
      continue;
    }

    // Already active or completed this campaign?
    const [existing] = await db
      .select()
      .from(sequenceEnrollments)
      .where(
        and(
          eq(sequenceEnrollments.userId, person.id),
          eq(sequenceEnrollments.sequenceId, SNACK_HACK_RECLAIM_OFFER_SEQUENCE_ID)
        )
      )
      .limit(1);

    if (existing && (existing.status === "active" || existing.status === "completed")) {
      // If already past step 0, don't re-send email 1
      if (existing.currentStepId >= 1 || existing.status === "completed") {
        console.log(`  SKIP already in campaign: ${email} (step ${existing.currentStepId}, ${existing.status})`);
        skippedAlready++;
        continue;
      }
    }

    const ok = await enrollUserInSequence(
      email,
      person.firstName,
      SNACK_HACK_RECLAIM_OFFER_SEQUENCE_ID
    );
    if (!ok) {
      console.error(`  FAIL enroll: ${email}`);
      failed++;
      continue;
    }
    enrolled++;

    // Re-fetch enrollment (enroll uses userId = subscriber id)
    const [subRow] = await db
      .select({ id: subscribers.id })
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);
    if (!subRow) {
      console.error(`  FAIL no subscriber after enroll: ${email}`);
      failed++;
      continue;
    }

    const [enrollment] = await db
      .select()
      .from(sequenceEnrollments)
      .where(
        and(
          eq(sequenceEnrollments.userId, subRow.id),
          eq(sequenceEnrollments.sequenceId, SNACK_HACK_RECLAIM_OFFER_SEQUENCE_ID)
        )
      )
      .limit(1);

    if (!enrollment) {
      console.error(`  FAIL no enrollment row: ${email}`);
      failed++;
      continue;
    }

    // Anchor timing to now so Email 2 is due in 3 days from this send
    const anchor = new Date();
    const content = getSnackHackReclaimOfferEmail1(person.firstName || "Friend");
    const success = await sendMarketingEmail({
      to: email,
      toName: person.firstName || "Friend",
      subject: content.subject,
      htmlBody: content.html,
      reasonLine:
        "You're receiving this because you downloaded the Midlife Mindset Snack Hack.",
    });

    if (!success.ok) {
      console.error(`  FAIL send E1: ${email}`);
      failed++;
      continue;
    }

    // Advance to step 1 (Email 2). due = createdAt + 3 days
    await db
      .update(sequenceEnrollments)
      .set({
        currentStepId: 1,
        status: "active",
        createdAt: anchor,
        updatedAt: anchor,
      })
      .where(eq(sequenceEnrollments.id, enrollment.id));

    sent++;
    console.log(`  SENT E1 + queued E2 (+3d): ${email}`);
  }

  console.log("\n--- Summary ---");
  console.log(`Enrolled: ${enrolled}`);
  console.log(`Email 1 sent: ${sent}`);
  console.log(`Skipped opt-out: ${skippedOptOut}`);
  console.log(`Skipped already in campaign: ${skippedAlready}`);
  console.log(`Failed: ${failed}`);
  console.log(
    `\nEmail 2 goes out automatically ~3 days after each person's anchor via /api/cron/email-sequences (status=active, step 1).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
