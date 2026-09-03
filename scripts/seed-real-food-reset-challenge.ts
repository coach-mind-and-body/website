/**
 * Upserts the Real Food Reset challenge row (featured, 5 days, Sept 28–Oct 2).
 * Paste the Google Meet URL in Admin → Challenges after this runs.
 *
 * Usage: npx tsx scripts/seed-real-food-reset-challenge.ts
 */
import "dotenv/config";
import { ensureRealFoodResetChallenge } from "../server/realFoodResetChallenge";

async function main() {
  const id = await ensureRealFoodResetChallenge();
  console.log("Real Food Reset challenge id:", id);
  console.log("Paste the Google Meet URL in Admin → Challenges (enrolled people only).");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
