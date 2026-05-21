import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { blogPosts } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const SITE_URL = "https://mindandbodyresetcoach.com";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Static pages with their change frequency and priority
const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.9" },
  { path: "/reclaim", changefreq: "monthly", priority: "0.9" },
  { path: "/book", changefreq: "monthly", priority: "0.8" },
  { path: "/midlife-health-podcast", changefreq: "weekly", priority: "0.8" },
  { path: "/health-wellness-blog", changefreq: "weekly", priority: "0.8" },
  { path: "/food-quiz", changefreq: "monthly", priority: "0.8" },
  { path: "/financial-peace", changefreq: "monthly", priority: "0.8" },
  { path: "/unicity", changefreq: "monthly", priority: "0.7" },
  { path: "/enroll", changefreq: "monthly", priority: "0.7" },
  { path: "/join", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.3" },
];

export function registerSitemapRoute(app: Express) {
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      // Static pages
      const staticUrls = STATIC_PAGES.map(
        (page) => `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
      ).join("");

      // Dynamic blog post pages
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
                : new Date().toISOString().split("T")[0];
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

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${blogUrls}
</urlset>`;

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1 hour
      res.send(xml);
    } catch (err) {
      console.error("[Sitemap] Error generating sitemap:", err);
      res.status(500).send("Error generating sitemap");
    }
  });
}
