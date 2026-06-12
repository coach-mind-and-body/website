import { getDb } from "./server/db";

async function run() {
  const db = await getDb();
  if (!db) process.exit(1);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`user_daily_notes\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`dateStr\` varchar(10) NOT NULL,
      \`note\` text NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`user_daily_notes_id\` PRIMARY KEY(\`id\`)
    );
  `);
  console.log("Created user_daily_notes");
  process.exit(0);
}
run();
