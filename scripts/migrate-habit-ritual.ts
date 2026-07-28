import "dotenv/config";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function tryExec(db: any, label: string, q: string) {
  try {
    await db.execute(sql.raw(q));
    console.log("OK", label);
  } catch (e: any) {
    console.log("SKIP", label, String(e.message || e).slice(0, 120));
  }
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  for (const col of [
    "ADD COLUMN startDate date",
    "ADD COLUMN endDate date",
    "ADD COLUMN linkedPodcastSlug varchar(255)",
    "ADD COLUMN linkedBlogSlug varchar(255)",
    "ADD COLUMN themeTag varchar(100)",
    "ADD COLUMN featuredOrder int NOT NULL DEFAULT 0",
    "ADD COLUMN isFeatured boolean NOT NULL DEFAULT false",
  ]) {
    await tryExec(db, "challenges " + col, "ALTER TABLE challenges " + col);
  }

  for (const col of [
    "ADD COLUMN habitActionsJson text",
    "ADD COLUMN linkedChallengeId int",
    "ADD COLUMN linkedBlogSlug varchar(255)",
  ]) {
    await tryExec(db, "podcast " + col, "ALTER TABLE podcast_episodes " + col);
  }

  await tryExec(
    db,
    "user_victory_lists",
    `CREATE TABLE IF NOT EXISTS user_victory_lists (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    userId int, deviceId varchar(64), dateStr varchar(10) NOT NULL,
    win1 varchar(280) NOT NULL DEFAULT '', win2 varchar(280) NOT NULL DEFAULT '', win3 varchar(280) NOT NULL DEFAULT '',
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY user_victory_lists_userId_dateStr (userId, dateStr),
    KEY user_victory_lists_deviceId_dateStr (deviceId, dateStr)
  )`
  );

  await tryExec(
    db,
    "habit_notification_prefs",
    `CREATE TABLE IF NOT EXISTS habit_notification_prefs (
    userId int NOT NULL PRIMARY KEY,
    eveningNudgeEnabled boolean NOT NULL DEFAULT true,
    victoryPromptEnabled boolean NOT NULL DEFAULT true,
    challengePushEnabled boolean NOT NULL DEFAULT true,
    day1Day3Enabled boolean NOT NULL DEFAULT true,
    weeklyInsightEmailEnabled boolean NOT NULL DEFAULT true,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
  );

  await tryExec(
    db,
    "habit_funnel_events",
    `CREATE TABLE IF NOT EXISTS habit_funnel_events (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    userId int, deviceId varchar(64), eventType varchar(64) NOT NULL,
    dateStr varchar(10) NOT NULL, meta text,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY habit_funnel_events_userId (userId),
    KEY habit_funnel_events_type_date (eventType, dateStr)
  )`
  );

  await tryExec(
    db,
    "habit_packs",
    `CREATE TABLE IF NOT EXISTS habit_packs (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    slug varchar(100) NOT NULL UNIQUE,
    title varchar(255) NOT NULL,
    description text,
    isActive boolean NOT NULL DEFAULT true,
    isDefault boolean NOT NULL DEFAULT false,
    sortOrder int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
  );

  await tryExec(
    db,
    "habit_pack_items",
    `CREATE TABLE IF NOT EXISTS habit_pack_items (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    packId int NOT NULL,
    title varchar(255) NOT NULL,
    description text,
    type enum('boolean','numeric') NOT NULL DEFAULT 'boolean',
    targetValue int, unit varchar(50),
    sortOrder int NOT NULL DEFAULT 0,
    KEY habit_pack_items_packId (packId)
  )`
  );

  await tryExec(
    db,
    "habit_cron_runs",
    `CREATE TABLE IF NOT EXISTS habit_cron_runs (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    kind varchar(64) NOT NULL,
    dateStr varchar(10) NOT NULL,
    sentCount int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY habit_cron_runs_kind_date (kind, dateStr)
  )`
  );

  console.log("migration pass complete");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
