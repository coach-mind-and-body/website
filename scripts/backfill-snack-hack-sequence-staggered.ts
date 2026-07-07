/**
 * Enrolls snack-hack leads who missed the nurture sequence and staggers
 * their anchor dates so follow-ups send on the normal Day 2/4/7/10 cadence
 * (not all at once).
 *
 * Usage:
 *   npx tsx scripts/backfill-snack-hack-sequence-staggered.ts --dry-run
 *   npx tsx scripts/backfill-snack-hack-sequence-staggered.ts
 */
import "dotenv/config";
import { like, and, eq, notInArray } from "drizzle-orm";
import { getDb } from "../server/db";
import { subscribers, sequenceEnrollments } from "../drizzle/schema";
import {
  enrollUserInSequence,
  SNACK_HACK_SEQUENCE_ID,
} from "../server/sequences";
import { SNACK_HACK_DAY_OFFSETS } from "../server/emails/snackHackSequence";

const DAY_OFFSETS = [...SNACK_HACK_DAY_OFFSETS];
const LEADS_PER_WAVE = 6;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const db = await getDb();
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  const enrolledRows = await db
    .select({ userId: sequenceEnrollments.userId })
    .from(sequenceEnrollments)
    .where(eq(sequenceEnrollments.sequenceId, SNACK_HACK_SEQUENCE_ID));

  const enrolledIds = enrolledRows
    .map((row) => row.userId)
    .filter((id): id is number => id != null);

  const leads = await db
    .select()
    .from(subscribers)
    .where(
      enrolledIds.length > 0
        ? and(
            like(subscribers.segments, "%leadgen_snack_hack%"),
            notInArray(subscribers.id, enrolledIds)
          )
        : like(subscribers.segments, "%leadgen_snack_hack%")
    )
    .orderBy(subscribers.createdAt);

  if (leads.length === 0) {
    console.log("No snack-hack leads need backfill.");
    return;
  }

  const today = startOfDay(new Date());
  const waveCount = Math.ceil(leads.length / LEADS_PER_WAVE);

  console.log(
    `${dryRun ? "[DRY RUN] " : ""}Backfilling ${leads.length} leads across ${waveCount} waves (${LEADS_PER_WAVE}/wave)`
  );
  console.log(`Sequence cadence: Day ${DAY_OFFSETS.join(", Day ")}\n`);

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const wave = Math.floor(i / LEADS_PER_WAVE);
    const anchorDate = startOfDay(today);
    anchorDate.setDate(anchorDate.getDate() + wave);

    const firstEmailDate = new Date(anchorDate);
    firstEmailDate.setDate(firstEmailDate.getDate() + DAY_OFFSETS[0]);

    const schedule = DAY_OFFSETS.map((offset) => {
      const due = new Date(anchorDate);
      due.setDate(due.getDate() + offset);
      return formatDate(due);
    });

    console.log(
      `  [wave ${wave + 1}] ${lead.email} (${lead.firstName ?? "Friend"})`
    );
    console.log(`           signed up: ${formatDate(new Date(lead.createdAt))}`);
    console.log(`           anchor:  ${formatDate(anchorDate)}`);
    console.log(
      `           emails:  Day2 ${schedule[0]} | Day4 ${schedule[1]} | Day7 ${schedule[2]} | Day10 ${schedule[3]}`
    );

    if (!dryRun) {
      await enrollUserInSequence(
        lead.email,
        lead.firstName,
        SNACK_HACK_SEQUENCE_ID,
        { anchorDate }
      );
    }
  }

  console.log(
    dryRun
      ? "\nDry run complete. Re-run without --dry-run to enroll."
      : "\nBackfill complete. The sequence poller will send emails when each step is due."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});