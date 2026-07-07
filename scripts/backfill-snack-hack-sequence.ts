/**
 * Enrolls all existing snack-hack leads in the nurture sequence and
 * immediately sends any overdue follow-up emails (Day 3 / Day 7).
 *
 * Usage: npx tsx scripts/backfill-snack-hack-sequence.ts
 */
import "dotenv/config";
import { like, and, eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { subscribers, sequenceEnrollments } from "../drizzle/schema";
import {
  enrollUserInSequence,
  processEmailSequences,
  SNACK_HACK_SEQUENCE_ID,
} from "../server/sequences";

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

  console.log(`Found ${leads.length} snack-hack leads to backfill`);

  for (const lead of leads) {
    const existing = await db
      .select()
      .from(sequenceEnrollments)
      .where(
        and(
          eq(sequenceEnrollments.userId, lead.id),
          eq(sequenceEnrollments.sequenceId, SNACK_HACK_SEQUENCE_ID)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await enrollUserInSequence(
        lead.email,
        lead.firstName,
        SNACK_HACK_SEQUENCE_ID,
        { anchorDate: lead.createdAt }
      );
      console.log(`  Enrolled: ${lead.email} (signed up ${lead.createdAt})`);
    } else {
      // Ensure timing anchor matches original signup (not enrollment insert time).
      await db
        .update(sequenceEnrollments)
        .set({
          createdAt: lead.createdAt,
          currentStepId: 0,
          status: "active",
        })
        .where(eq(sequenceEnrollments.id, existing[0].id));
      console.log(`  Reset anchor: ${lead.email} → ${lead.createdAt}`);
    }
  }

  console.log("\nProcessing overdue follow-up emails...");
  const result = await processEmailSequences();
  console.log("Result:", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});