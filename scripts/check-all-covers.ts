import "dotenv/config";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");
  const rows = await db
    .select({ slug: blogPosts.slug, cover: blogPosts.coverImage })
    .from(blogPosts);
  for (const r of rows) {
    const cover = r.cover || "";
    let url = cover;
    if (cover.startsWith("/")) url = "https://mindandbodyresetcoach.com" + cover;
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      console.log(res.status, r.slug.slice(0, 55), "|", cover.slice(0, 75));
    } catch (e) {
      console.log("ERR", r.slug, String(e).slice(0, 80));
    }
  }
}

main().catch(console.error);
