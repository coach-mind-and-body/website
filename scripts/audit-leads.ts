import "dotenv/config";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  const queries: [string, ReturnType<typeof sql>][] = [
    ["subscribers total", sql`SELECT COUNT(*) as c FROM subscribers`],
    [
      "subscribers snack_hack segment",
      sql`SELECT COUNT(*) as c FROM subscribers WHERE segments LIKE '%leadgen_snack_hack%'`,
    ],
    [
      "subscribers food_quiz segment",
      sql`SELECT COUNT(*) as c FROM subscribers WHERE segments LIKE '%leadgen_food_quiz%'`,
    ],
    [
      "subscribers join segment",
      sql`SELECT COUNT(*) as c FROM subscribers WHERE segments LIKE '%leadgen_join%'`,
    ],
    ["leads table total", sql`SELECT COUNT(*) as c FROM leads`],
    ["leads by source", sql`SELECT source, COUNT(*) as c FROM leads GROUP BY source`],
    ["leads by status", sql`SELECT status, COUNT(*) as c FROM leads GROUP BY status`],
    [
      "subscribers with snack_hack last 30 days",
      sql`SELECT COUNT(*) as c FROM subscribers WHERE segments LIKE '%leadgen_snack_hack%' AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
    ],
    [
      "snack_hack by day (last 14)",
      sql`SELECT DATE(createdAt) d, COUNT(*) c FROM subscribers WHERE segments LIKE '%leadgen_snack_hack%' AND createdAt >= DATE_SUB(NOW(), INTERVAL 14 DAY) GROUP BY DATE(createdAt) ORDER BY d DESC`,
    ],
    [
      "recent snack_hack (20)",
      sql`SELECT id, email, firstName, segments, createdAt FROM subscribers WHERE segments LIKE '%leadgen_snack_hack%' ORDER BY createdAt DESC LIMIT 20`,
    ],
    [
      "subscribers missing snack segment but email like recent?",
      sql`SELECT COUNT(*) c FROM subscribers WHERE (segments IS NULL OR segments = '' OR segments NOT LIKE '%leadgen_snack_hack%')`,
    ],
  ];

  for (const [label, q] of queries) {
    try {
      const rows = await db.execute(q);
      console.log("\n===", label, "===");
      console.log(JSON.stringify(rows, null, 2).slice(0, 2500));
    } catch (e) {
      console.log("\n===", label, "ERROR ===");
      console.log(String(e).slice(0, 300));
    }
  }

  // Also check table structure
  try {
    const cols = await db.execute(sql`DESCRIBE subscribers`);
    console.log("\n=== subscribers columns ===");
    console.log(JSON.stringify(cols, null, 2).slice(0, 2000));
  } catch (e) {
    console.log("describe err", e);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
