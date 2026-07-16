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

/**
 * Public pages we want discovered and indexed.
 * Omit pure legal + thin checkout shells so crawl budget goes to content/product.
 * lastmod = real content-change date (never "always today").
 */
const STATIC_PAGES: Array<{
  path: string;
  changefreq: string;
  priority: string;
  lastmod: string;
}> = [
  { path: "/", changefreq: "weekly", priority: "1.0", lastmod: "2026-07-14" },
  { path: "/about", changefreq: "monthly", priority: "0.9", lastmod: "2026-07-10" },
  { path: "/reclaim", changefreq: "monthly", priority: "0.9", lastmod: "2026-07-10" },
  { path: "/book", changefreq: "monthly", priority: "0.85", lastmod: "2026-07-01" },
  { path: "/midlife-health-podcast", changefreq: "weekly", priority: "0.85", lastmod: "2026-07-10" },
  { path: "/health-wellness-blog", changefreq: "weekly", priority: "0.9", lastmod: "2026-07-10" },
  { path: "/food-quiz", changefreq: "monthly", priority: "0.8", lastmod: "2026-06-15" },
  { path: "/snack-hack", changefreq: "monthly", priority: "0.8", lastmod: "2026-06-20" },
  // Free product pages — worth indexing (habits / macros / midlife keywords)
  { path: "/habit-tracker-invite", changefreq: "monthly", priority: "0.8", lastmod: "2026-07-01" },
  { path: "/habit-tracker", changefreq: "weekly", priority: "0.85", lastmod: "2026-07-15" },
  { path: "/holistic-health-and-wellness", changefreq: "monthly", priority: "0.85", lastmod: "2026-07-01" },
  { path: "/life-after-glp-1", changefreq: "monthly", priority: "0.85", lastmod: "2026-07-01" },
  { path: "/insulin-resistance-after-40", changefreq: "monthly", priority: "0.9", lastmod: "2026-07-01" },
  { path: "/financial-peace", changefreq: "monthly", priority: "0.75", lastmod: "2026-06-01" },
  { path: "/unicity", changefreq: "monthly", priority: "0.75", lastmod: "2026-06-01" },
  // Still omitted: /enroll, /join (thin conversion), /terms, /privacy, /disclaimer (legal + noindex)
  // Note: /feel-great-system redirects to /unicity — not listed
  // Note: /fpu-may-12 is a dated event landing — omit from sitemap after event
];

export async function GET() {
  try {
    const staticUrls = STATIC_PAGES.map(
      (page) => `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    ).join("");

    const fallbackDay = "2026-07-01";
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
              : fallbackDay;
          return `
  <url>
    <loc>${SITE_URL}/health-wellness-blog/${escapeXml(post.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
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
              : fallbackDay;
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
