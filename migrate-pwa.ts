import { getDb } from "./server/db";

async function run() {
  const db = await getDb();
  if (!db) process.exit(1);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`push_subscriptions\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int,
      \`endpoint\` text NOT NULL,
      \`p256dh\` text NOT NULL,
      \`auth\` text NOT NULL,
      \`deviceId\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`push_subscriptions_id\` PRIMARY KEY(\`id\`)
    );
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`challenges\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`title\` text NOT NULL,
      \`description\` text,
      \`durationDays\` int NOT NULL DEFAULT 7,
      \`isActive\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`challenges_id\` PRIMARY KEY(\`id\`)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`user_challenges\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int,
      \`deviceId\` text,
      \`challengeId\` int NOT NULL,
      \`startDate\` date NOT NULL,
      \`status\` varchar(50) NOT NULL DEFAULT 'active',
      CONSTRAINT \`user_challenges_id\` PRIMARY KEY(\`id\`)
    );
  `);

  console.log("Created PWA & Challenges tables successfully.");
  process.exit(0);
}
run();
