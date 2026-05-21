import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { blogPosts } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { parseStringPromise } from "xml2js";

const SITE_URL = "https://mindandbodyresetcoach.com";
const BLOG_URL = `${SITE_URL}/health-wellness-blog`;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const YOUTUBE_RSS = "https://www.youtube.com/feeds/videos.xml?playlist_id=PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H";

// Cache the latest YouTube episode data for 30 minutes
let ytCache: { thumbnail: string; description: string; title: string; url: string; fetchedAt: number } | null = null;

async function fetchLatestYouTubeEpisode() {
  const now = Date.now();
  if (ytCache && now - ytCache.fetchedAt < 30 * 60 * 1000) return ytCache;

  const res = await fetch(YOUTUBE_RSS);
  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false });

  const entry = parsed?.feed?.entry;
  const latest = Array.isArray(entry) ? entry[0] : entry;

  const thumbnail = latest?.["media:group"]?.["media:thumbnail"]?.["$"]?.url ?? "";
  const description = latest?.["media:group"]?.["media:description"] ?? "";
  const title = latest?.title ?? "";
  const url = latest?.link?.["$"]?.href ?? latest?.link ?? "";

  ytCache = { thumbnail, description, title, url, fetchedAt: now };
  return ytCache;
}

export function registerRssRoute(app: Express) {
  // Redirect to the latest YouTube episode thumbnail (for Mailchimp email img src)
  app.get("/api/youtube-thumbnail", async (_req: Request, res: Response) => {
    try {
      const ep = await fetchLatestYouTubeEpisode();
      if (ep.thumbnail) {
        res.redirect(302, ep.thumbnail);
      } else {
        res.status(404).send("No thumbnail found");
      }
    } catch (err) {
      console.error("[YouTube RSS] thumbnail error:", err);
      res.status(500).send("Error fetching thumbnail");
    }
  });

  // Return the latest YouTube episode description as plain text
  app.get("/api/youtube-description", async (_req: Request, res: Response) => {
    try {
      const ep = await fetchLatestYouTubeEpisode();
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send(ep.description || "No description available.");
    } catch (err) {
      console.error("[YouTube RSS] description error:", err);
      res.status(500).send("Error fetching description");
    }
  });

  // Return latest episode data as JSON (for debugging/testing)
  app.get("/api/youtube-latest", async (_req: Request, res: Response) => {
    try {
      const ep = await fetchLatestYouTubeEpisode();
      res.json(ep);
    } catch (err) {
      console.error("[YouTube RSS] latest error:", err);
      res.status(500).json({ error: "Error fetching episode" });
    }
  });
  app.get("/feed.xml", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      const posts = db
        ? await db
            .select()
            .from(blogPosts)
            .where(eq(blogPosts.published, true))
            .orderBy(desc(blogPosts.publishedAt))
            .limit(20)
        : [];

      const now = new Date().toUTCString();

      const items = posts
        .map((post) => {
          const postUrl = `${BLOG_URL}/${escapeXml(post.slug)}`;
          const pubDate = post.publishedAt
            ? new Date(post.publishedAt).toUTCString()
            : now;
          const description = post.excerpt
            ? escapeXml(post.excerpt)
            : escapeXml(stripHtml(post.content).slice(0, 300) + "…");
          const title = escapeXml(post.title);
          const category = post.category ? `<category>${escapeXml(post.category)}</category>` : "";
          const enclosure = post.coverImage
            ? `<enclosure url="${escapeXml(post.coverImage)}" type="image/jpeg" length="0" />`
            : "";

          return `
    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      ${category}
      ${enclosure}
    </item>`;
        })
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Mind &amp; Body Reset — Blog</title>
    <link>${BLOG_URL}</link>
    <description>Wellness, mindset, and nutrition coaching for women in midlife. Articles by Lee Anne on body image, hormones, food freedom, and transformation.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>Mind &amp; Body Reset</title>
      <link>${SITE_URL}</link>
    </image>
    ${items}
  </channel>
</rss>`;

      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1 hour
      res.send(xml);
    } catch (err) {
      console.error("[RSS] Error generating feed:", err);
      res.status(500).send("Error generating RSS feed");
    }
  });
}
