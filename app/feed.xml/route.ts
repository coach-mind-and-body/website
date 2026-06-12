import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { blogPosts } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

const SITE_URL = "https://mindandbodyresetcoach.com";
const BLOG_URL = `${SITE_URL}/health-wellness-blog`;

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    const db = await getDb();
    const posts = db ? await db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.publishedAt)).limit(20) : [];

    const now = new Date().toUTCString();
    const items = posts.map(post => {
      const postUrl = `${BLOG_URL}/${escapeXml(post.slug)}`;
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : now;
      const description = post.excerpt ? escapeXml(post.excerpt) : escapeXml(stripHtml(post.content).slice(0, 300) + "…");
      const title = escapeXml(post.title);
      const category = post.category ? `<category>${escapeXml(post.category)}</category>` : "";
      const enclosure = post.coverImage ? `<enclosure url="${escapeXml(post.coverImage)}" type="image/jpeg" length="0" />` : "";
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
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
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

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (err) {
    console.error("[RSS] Error generating feed:", err);
    return new NextResponse("Error generating RSS feed", { status: 500 });
  }
}
