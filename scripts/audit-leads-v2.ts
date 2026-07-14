import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  const q = async (label: string, sql: string) => {
    const [rows] = await conn.query(sql);
    console.log(`\n=== ${label} ===`);
    console.table(rows as any[]);
  };

  await q("subscribers total", `SELECT COUNT(*) AS c FROM subscribers`);
  await q(
    "snack_hack count",
    `SELECT COUNT(*) AS c FROM subscribers WHERE segments LIKE '%leadgen_snack_hack%'`
  );
  await q(
    "duplicate emails?",
    `SELECT email, COUNT(*) c FROM subscribers GROUP BY email HAVING c > 1`
  );
  await q(
    "sequence enrollments snack (if table exists)",
    `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE '%sequence%'`
  );

  // Find sequence-related tables
  const [tables] = await conn.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND (table_name LIKE '%sequence%' OR table_name LIKE '%enroll%' OR table_name LIKE '%lead%' OR table_name LIKE '%subscr%')`
  );
  console.log("\n=== relevant tables ===");
  console.table(tables);

  for (const t of tables as { table_name: string }[]) {
    const name = t.table_name;
    try {
      const [cnt] = await conn.query(`SELECT COUNT(*) AS c FROM \`${name}\``);
      console.log(name, (cnt as any)[0]);
    } catch (e) {
      console.log(name, "err", e);
    }
  }

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
