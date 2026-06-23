import "dotenv/config";
import { getDb } from "./server/db";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No DB connection");
    process.exit(1);
  }

  const queries = [
    `ALTER TABLE habit_templates ADD COLUMN type ENUM('boolean', 'numeric') NOT NULL DEFAULT 'boolean'`,
    `ALTER TABLE habit_templates ADD COLUMN targetValue INT`,
    `ALTER TABLE habit_templates ADD COLUMN unit VARCHAR(50)`,
    `ALTER TABLE user_habits ADD COLUMN type ENUM('boolean', 'numeric') NOT NULL DEFAULT 'boolean'`,
    `ALTER TABLE user_habits ADD COLUMN targetValue INT`,
    `ALTER TABLE user_habits ADD COLUMN unit VARCHAR(50)`,
    `ALTER TABLE user_habit_logs ADD COLUMN numericValue INT`,
  ];

  for (const q of queries) {
    try {
      console.log(`Executing: ${q}`);
      await db.execute(q);
      console.log("Success");
    } catch (e: any) {
      console.log(`Failed (might already exist):`, e.message);
    }
  }
  
  process.exit(0);
}

main();
