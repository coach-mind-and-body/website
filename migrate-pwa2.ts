import { getDb } from "./server/db";

async function run() {
  const db = await getDb();
  if (!db) process.exit(1);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`user_challenge_logs\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userChallengeId\` int NOT NULL,
      \`dateStr\` date NOT NULL,
      CONSTRAINT \`user_challenge_logs_id\` PRIMARY KEY(\`id\`)
    );
  `);

  console.log("Created user_challenge_logs table successfully.");
  process.exit(0);
}
run();
