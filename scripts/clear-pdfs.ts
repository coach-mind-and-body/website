import "dotenv/config";
import { getDb } from "../server/db";
import { programModules } from "../drizzle/schema";

async function run() {
  const db = await getDb();
  if (!db) return;
  await db.update(programModules).set({ pdfUrl: null });
  console.log("Updated modules!");
  process.exit(0);
}
run();
