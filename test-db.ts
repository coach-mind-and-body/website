import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import "dotenv/config";

async function main() {
  console.log("Connecting to:", process.env.DATABASE_URL);
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
    const db = drizzle(connection);
    console.log("DB connected!");
    process.exit(0);
  } catch (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
}
main();
