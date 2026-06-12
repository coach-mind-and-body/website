import { getDb } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function checkUser() {
  const db = await getDb();
  if (!db) return console.log("No DB");
  const userList = await db.select().from(users).where(eq(users.email, "Carterseitz35@gmail.com"));
  console.log("Found user:", userList);
  process.exit(0);
}
checkUser();
