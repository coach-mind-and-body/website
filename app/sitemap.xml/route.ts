import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { blogPosts, podcastEpisodes } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { SITE_URL } from "@shared/brand";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Public, indexable marketing pages only (no thank-yous, no private apps). */
const STATIC_PAGES: Array<{
  path: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.9" },
  { path: "/reclaim", changefreq: "monthly", priority: "0.9" },
  { path: "/book", changefreq: "monthly", priority: "0.85" },
  { path: "/midlife-health-podcast", changefreq: "weekly", priority: "0.85" },
  { path: "/health-wellness-blog", changefreq: "weekly", priority: "0.85" },
  { path: "/food-quiz", changefreq: "monthly", priority: "0.8" },
  { path: "/snack-hack", changefreq: "monthly", priority: "0.8" },
  { path: "/holistic-health-and-wellness", changefreq: "monthly", priority: "0.8" },
  { path: "/life-after-glp-1", changefreq: "monthly", priority: "0.85" },
  { path: "/insulin-resistance-after-40", changefreq: "monthly", priority: "0.9" },
  { path: "/financial-peace", changefreq: "monthly", priority: "0.75" },
  { path: "/unicity", changefreq: "monthly", priority: "0.75" },
  { path: "/habit-tracker", changefreq: "monthly", priority: "0.6" },
  { path: "/enroll", changefreq: "monthly", priority: "0.7" },
  { path: "/join", changefreq: "monthly", priority: "0.55" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.2" },
  // Note: /feel-great-system redirects to /unicity — not listed
  // Note: /fpu-may-12 is a dated event landing — omit from sitemap after event
];

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const staticUrls = STATIC_PAGES.map(
      (page) => `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    ).join("");

    let blogUrls = "";
    const db = await getDb();
    if (db) {
      const posts = await db
        .select({
          slug: blogPosts.slug,
          publishedAt: blogPosts.publishedAt,
          updatedAt: blogPosts.updatedAt,
        })
        .from(blogPosts)
        .where(eq(blogPosts.published, true))
        .orderBy(desc(blogPosts.publishedAt));

      blogUrls = posts
        .map((post) => {
          const lastmod = post.updatedAt
            ? new Date(post.updatedAt).toISOString().split("T")[0]
            : post.publishedAt
              ? new Date(post.publishedAt).toISOString().split("T")[0]
              : today;
          return `
  <url>
    <loc>${SITE_URL}/health-wellness-blog/${escapeXml(post.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
        })
        .join("");
    }

    let episodeUrls = "";
    if (db) {
      const episodes = await db
        .select({
          slug: podcastEpisodes.slug,
          publishedAt: podcastEpisodes.publishedAt,
          updatedAt: podcastEpisodes.updatedAt,
        })
        .from(podcastEpisodes)
        .where(eq(podcastEpisodes.status, "published"));

      episodeUrls = episodes
        .map((ep) => {
          const lastmod = ep.updatedAt
            ? new Date(ep.updatedAt).toISOString().split("T")[0]
            : ep.publishedAt
              ? new Date(ep.publishedAt).toISOString().split("T")[0]
              : today;
          return `
  <url>
    <loc>${SITE_URL}/midlife-health-podcast/${escapeXml(ep.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.65</priority>
  </url>`;
        })
        .join("");
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${blogUrls}
  ${episodeUrls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[Sitemap] Error generating sitemap:", err);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
