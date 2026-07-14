import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  const [byDay] = await conn.query(`
    SELECT DATE(createdAt) as day, COUNT(*) as c
    FROM subscribers
    WHERE segments LIKE '%leadgen_snack_hack%'
    GROUP BY DATE(createdAt)
    ORDER BY day DESC
    LIMIT 30
  `);
  console.log("BY DAY:");
  console.table(byDay);

  const [recent] = await conn.query(`
    SELECT id, email, firstName, createdAt
    FROM subscribers
    WHERE segments LIKE '%leadgen_snack_hack%'
    ORDER BY createdAt DESC
    LIMIT 12
  `);
  console.log("MOST RECENT:");
  console.table(recent);

  const [oldest] = await conn.query(`
    SELECT id, email, firstName, createdAt
    FROM subscribers
    WHERE segments LIKE '%leadgen_snack_hack%'
    ORDER BY createdAt ASC
    LIMIT 5
  `);
  console.log("OLDEST:");
  console.table(oldest);

  const [seq] = await conn.query(`
    SELECT sequenceId, status, COUNT(*) as c
    FROM sequence_enrollments
    GROUP BY sequenceId, status
  `);
  console.log("SEQUENCE ENROLLMENTS:");
  console.table(seq);

  const [leadsTbl] = await conn.query(`SELECT COUNT(*) as c FROM leads`);
  const [fpu] = await conn.query(`SELECT COUNT(*) as c FROM fpu_leads`);
  console.log("leads table:", leadsTbl);
  console.log("fpu_leads:", fpu);

  // Any subscribers WITHOUT snack hack segment?
  const [other] = await conn.query(`
    SELECT COUNT(*) as c FROM subscribers
    WHERE segments NOT LIKE '%leadgen_snack_hack%' OR segments IS NULL
  `);
  console.log("non-snack-hack subscribers:", other);

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
