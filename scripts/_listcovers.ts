import "dotenv/config";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");
  const rows = await db.select({ slug: blogPosts.slug, cover: blogPosts.coverImage }).from(blogPosts);
  for (const r of rows) console.log((r.cover||"").slice(0,110), "|", r.slug.slice(0,40));
}
main();

