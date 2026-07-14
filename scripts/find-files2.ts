import "dotenv/config";
import { getDb } from "../server/db";
import { programModules } from "../drizzle/schema";

async function run() {
  const db = await getDb();
  if (!db) return;
  const mods = await db.select().from(programModules);
  console.log("Modules:");
  mods.forEach(m => console.log(m.id, m.title, m.pdfUrl));
  process.exit(0);
}
run();
