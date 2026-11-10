/**
 * Apply the multi-program enrollment schema.
 * Safe to run more than once. Does not connect unless DATABASE_URL is set.
 *
 *   npx tsx scripts/migrate-program-enrollments.ts
 */
import "dotenv/config";
import { getDb } from "../server/db";
import { applyProgramEnrollmentSchema } from "../server/ensureProgramSchema";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL is not set. Nothing was changed.");
    process.exit(1);
  }
  await applyProgramEnrollmentSchema(db);
  console.log("Program enrollment schema is ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
