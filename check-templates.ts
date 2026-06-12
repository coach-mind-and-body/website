import { getDb } from "./server/db";
import { habitTemplates } from "./drizzle/schema";

async function checkTemplates() {
  const db = await getDb();
  if (!db) {
    console.log("No DB connection");
    process.exit(1);
  }
  const templates = await db.select().from(habitTemplates);
  console.log("Templates:", templates);
  process.exit(0);
}
checkTemplates();
