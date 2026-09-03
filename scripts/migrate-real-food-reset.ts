/**
 * Idempotent production schema for the Real Food Reset challenge.
 * Usage: npx tsx scripts/migrate-real-food-reset.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("No DATABASE_URL");
  const c = await mysql.createConnection(url);

  async function run(sql: string, label: string) {
    try {
      await c.query(sql);
      console.log("OK", label);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        /Duplicate column|already exists|Duplicate key name/i.test(msg)
      ) {
        console.log("SKIP", label);
        return;
      }
      throw e;
    }
  }

  await run(
    "ALTER TABLE `email_newsletters` MODIFY COLUMN `audienceGroup` ENUM('finance','health','all','snack_hack','real_food_reset') NOT NULL DEFAULT 'health'",
    "audienceGroup enum"
  );
  await run("ALTER TABLE `challenges` ADD `meetUrl` varchar(1000)", "challenges.meetUrl");
  await run("ALTER TABLE `user_challenges` ADD `email` varchar(320)", "user_challenges.email");
  await run("ALTER TABLE `user_challenges` ADD `claimToken` varchar(64)", "user_challenges.claimToken");
  await run(
    `CREATE TABLE IF NOT EXISTS \`user_challenge_journals\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userChallengeId\` int NOT NULL,
      \`dateStr\` date NOT NULL,
      \`noticed\` text,
      \`glad\` text,
      \`hard\` text,
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`user_challenge_journals_id\` PRIMARY KEY(\`id\`)
    )`,
    "user_challenge_journals"
  );

  await c.end();
  console.log("Migration complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
