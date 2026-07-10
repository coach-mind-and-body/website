import "dotenv/config";
import fs from "fs";
import mysql from "mysql2/promise";

async function main() {
  const u = process.env.DATABASE_URL;
  if (!u) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }
  const c = await mysql.createConnection(u);
  const sql = fs.readFileSync("drizzle/0022_podcast_episodes.sql", "utf8");
  try {
    await c.query(sql);
    console.log("migration ok");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already exists")) console.log("table already exists");
    else {
      console.error(msg);
      process.exit(1);
    }
  }
  await c.end();
}

main();
