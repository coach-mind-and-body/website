/**
 * Seed published show notes for top podcast episodes.
 * Usage: pnpm exec tsx scripts/seed-show-notes.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { podcastEpisodes } from "../drizzle/schema";
import { SHOW_NOTES_SEEDS } from "../content/podcast/show-notes-seed";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection.");
    process.exit(1);
  }

  for (const ep of SHOW_NOTES_SEEDS) {
    const [existing] = await db
      .select({ id: podcastEpisodes.id })
      .from(podcastEpisodes)
      .where(eq(podcastEpisodes.videoId, ep.videoId))
      .limit(1);

    const values = {
      videoId: ep.videoId,
      slug: ep.slug,
      title: ep.title,
      thumbnail: `https://i.ytimg.com/vi/${ep.videoId}/hqdefault.jpg`,
      publishedAt: new Date(ep.publishedAt),
      showNotesHtml: ep.showNotesHtml,
      seoTitle: ep.seoTitle,
      seoDescription: ep.seoDescription,
      status: "published" as const,
    };

    if (existing) {
      await db.update(podcastEpisodes).set(values).where(eq(podcastEpisodes.id, existing.id));
      console.log(`Updated show notes: ${ep.slug}`);
    } else {
      await db.insert(podcastEpisodes).values(values);
      console.log(`Inserted show notes: ${ep.slug}`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
