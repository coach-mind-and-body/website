import "dotenv/config";
import { getDb } from "./server/db";
import { users } from "./drizzle/schema";

async function main() {
  const db = await getDb();
  if (!db) return;
  const u = await db.select().from(users);
  console.log(u.map(x => ({ id: x.id, email: x.email, name: x.name, loginMethod: x.loginMethod })));
  process.exit(0);
}
main();
