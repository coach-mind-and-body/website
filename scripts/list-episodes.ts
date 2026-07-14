import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { podcastEpisodes } from "../drizzle/schema";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");
  const rows = await db.select().from(podcastEpisodes);
  for (const r of rows) {
    console.log(JSON.stringify({ id: r.id, videoId: r.videoId, slug: r.slug, title: r.title, status: r.status }));
  }
}
main();
