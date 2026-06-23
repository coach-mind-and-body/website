import "dotenv/config";
import { getDb } from "./server/db";
import { programModules } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.log("no db"); return; }
  const e = await db.select().from(programModules).where(eq(programModules.order, 1));
  console.log(e[0].content);
  process.exit(0);
}
main();
