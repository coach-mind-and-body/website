import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("No DATABASE_URL");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);

  const [rows] = await conn.query(
    "SELECT id, email, firstName, segments, createdAt FROM subscribers WHERE segments LIKE ? ORDER BY createdAt DESC",
    ["%leadgen_snack_hack%"]
  );

  const leads = rows as Array<{
    id: number;
    email: string;
    firstName: string | null;
    segments: string | null;
    createdAt: Date;
  }>;

  console.log("=== SNACK HACK LEADS (/snack-hack landing page) ===");
  console.log("Total count:", leads.length);
  console.log("");

  for (const row of leads) {
    console.log(
      JSON.stringify({
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        createdAt: row.createdAt,
      })
    );
  }

  const [byDay] = await conn.query(
    "SELECT DATE(createdAt) as day, COUNT(*) as c FROM subscribers WHERE segments LIKE ? GROUP BY DATE(createdAt) ORDER BY day",
    ["%leadgen_snack_hack%"]
  );
  console.log("");
  console.log("By day:");
  for (const row of byDay as Array<{ day: string; c: number }>) {
    console.log(`  ${row.day}: ${row.c}`);
  }

  const [totalRows] = await conn.query("SELECT COUNT(*) as c FROM subscribers");
  console.log("");
  console.log(
    "Total subscribers (all sources):",
    (totalRows as Array<{ c: number }>)[0].c
  );

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});