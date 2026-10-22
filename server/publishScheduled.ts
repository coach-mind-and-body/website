import { and, eq, lte, ne, sql } from "drizzle-orm";
import { getDb } from "./db";
import { blogPosts, podcastEpisodes } from "../drizzle/schema";

/**
 * Publish content whose scheduled time has arrived.
 * Runs on the website server (Railway), same as newsletters and reminders.
 * A draft episode is included only when it is tied to a blog post and its
 * publishedAt time has arrived. Other unfinished episodes stay drafts.
 */
export async function publishDueScheduledContent(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = new Date();

  const duePosts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      scheduledAt: blogPosts.scheduledAt,
    })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.published, false),
        lte(blogPosts.scheduledAt, now),
        sql`${blogPosts.scheduledAt} IS NOT NULL`
      )
    );

  for (const post of duePosts) {
    await db
      .update(blogPosts)
      .set({
        published: true,
        publishedAt: post.scheduledAt ?? now,
        scheduledAt: null,
      })
      .where(eq(blogPosts.id, post.id));
    console.log("[Schedule] Published article", post.slug);
  }

  const dueEpisodes = await db
    .select({
      id: podcastEpisodes.id,
      slug: podcastEpisodes.slug,
      publishedAt: podcastEpisodes.publishedAt,
    })
    .from(podcastEpisodes)
    .where(
      and(
        eq(podcastEpisodes.status, "draft"),
        lte(podcastEpisodes.publishedAt, now),
        sql`${podcastEpisodes.publishedAt} IS NOT NULL`,
        sql`${podcastEpisodes.linkedBlogSlug} IS NOT NULL`,
        ne(podcastEpisodes.linkedBlogSlug, "")
      )
    );

  for (const episode of dueEpisodes) {
    await db
      .update(podcastEpisodes)
      .set({ status: "published" })
      .where(eq(podcastEpisodes.id, episode.id));
    console.log("[Schedule] Published episode", episode.slug);
  }
}
