import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const c = await mysql.createConnection(process.env.DATABASE_URL!);
  await c.query(`
    CREATE TABLE IF NOT EXISTS common_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fileName VARCHAR(500) NOT NULL,
      fileKey VARCHAR(1000) NOT NULL,
      fileUrl VARCHAR(2000) NOT NULL,
      mimeType VARCHAR(255) NULL,
      uploadedByUserId INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("common_files table ready");
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
