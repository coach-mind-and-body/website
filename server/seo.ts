import { type Express } from "express";
import { getDb } from "./db";
import { blogPosts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const DOMAIN = process.env.BASE_URL || "https://mindandbodyresetcoach.com";

export function registerSEORoutes(app: Express) {
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /portal
Disallow: /my-program

Sitemap: ${DOMAIN}/sitemap.xml`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const db = await getDb();
      let dynamicUrls = "";

      if (db) {
        const posts = await db
          .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
          .from(blogPosts)
          .where(eq(blogPosts.published, true));

        dynamicUrls = posts
          .map(
            (post) => `
  <url>
    <loc>${DOMAIN}/health-wellness-blog/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
          )
          .join("");
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${DOMAIN}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${DOMAIN}/reclaim</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${DOMAIN}/book</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${DOMAIN}/health-wellness-blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${DOMAIN}/food-quiz</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${DOMAIN}/feel-great-system</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${DOMAIN}/join</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>${dynamicUrls}
</urlset>`;

      res.type("application/xml");
      res.send(sitemap.trim());
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).end();
    }
  });
}
