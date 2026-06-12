import { getDb } from "./server/db";

async function run() {
  const db = await getDb();
  if (!db) process.exit(1);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`app_updates\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`message\` text NOT NULL,
      \`videoUrl\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \`app_updates_id\` PRIMARY KEY(\`id\`)
    );
  `);

  console.log("Created app_updates table successfully.");
  process.exit(0);
}
run();
