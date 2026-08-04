import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const c = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [result] = await c.query(
      `UPDATE email_newsletters
       SET signOffTitle = 'Certified Life & Health Coach · Mind and Body Reset Coaching'
       WHERE signOffTitle LIKE '%Mind & Body Reset Coaches%'
          OR signOffTitle LIKE '%Mind and Body Reset Coaches%'
          OR signOffTitle IS NULL
          OR signOffTitle = ''`
    );
    console.log("signOffTitle update:", result);
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
