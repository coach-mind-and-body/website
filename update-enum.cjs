require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("Connected to DB, running ALTER TABLE...");
  await connection.query("ALTER TABLE calorie_logs MODIFY COLUMN mealType ENUM('breakfast', 'lunch', 'dinner', 'snack', 'drink') NOT NULL DEFAULT 'snack';");
  console.log("Successfully updated ENUM!");
  await connection.end();
}

main().catch(console.error);
