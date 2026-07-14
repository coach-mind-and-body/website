import "dotenv/config";
import { getDb } from "../server/db";
import { clientFiles, commonFiles } from "../drizzle/schema";

async function run() {
  const db = await getDb();
  if (!db) return;
  const common = await db.select().from(commonFiles);
  console.log("commonFiles:");
  common.forEach(c => console.log(c.id, c.fileName));
  const client = await db.select().from(clientFiles);
  console.log("clientFiles:");
  client.forEach(c => console.log(c.id, c.fileName, "Enrollment:", c.enrollmentId));
  process.exit(0);
}
run();
