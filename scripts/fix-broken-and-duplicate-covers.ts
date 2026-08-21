/**
 * Unique hero images for:
 * - 3 broken 404 covers (SEO cluster reused timestamped filenames that aren't on CDN)
 * - 2 duplicate heroes (shared with an older post)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
import { storagePut } from "../server/storage";

const sessionImagesDir = path.join(
  process.env.USERPROFILE || "",
  ".grok",
  "sessions",
  "C%3A%5CUsers%5Ccarte%5CDownloads%5Cmind-body-reset-portal",
  "01a0251b-03ad-7810-aec8-ceaa0a585350",
  "images"
);

const publicBlogDir = path.join(process.cwd(), "public", "blog");

const updates: Array<{
  slug: string;
  file: string;
  alt: string;
}> = [
  {
    slug: "how-to-stop-starting-over-every-monday-after-40",
    file: "7.jpg",
    alt: "Midlife woman eating a weekday lunch instead of waiting for Monday to start over",
  },
  {
    slug: "why-you-wake-up-at-3am-in-midlife",
    file: "9.jpg",
    alt: "Woman awake at 3 a.m. sitting on the edge of the bed in moonlight — midlife sleep disruption",
  },
  {
    slug: "how-to-stop-emotional-eating-after-40-without-shame",
    file: "5.jpg",
    alt: "Midlife woman pausing at an open fridge at night, choosing awareness over shame",
  },
  {
    slug: "food-noise-after-stopping-ozempic-or-wegovy",
    file: "10.jpg",
    alt: "Woman at a cafe looking at her plate as food noise returns after stopping a GLP-1",
  },
  {
    slug: "menopause-belly-why-it-shows-up-and-what-actually-helps",
    file: "6.jpg",
    alt: "Woman in midlife looking at her midsection in a bedroom mirror — menopause belly without shame",
  },
];

async function uploadImage(localPath: string, key: string): Promise<string> {
  if (!fs.existsSync(localPath)) throw new Error(`Missing: ${localPath}`);
  const buf = fs.readFileSync(localPath);
  const { url } = await storagePut(key, buf, "image/jpeg");
  const head = await fetch(url, { method: "HEAD" });
  console.log("CDN", head.status, url);
  if (head.status !== 200) throw new Error(`CDN HEAD ${head.status} for ${url}`);
  return url;
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");
  if (!fs.existsSync(publicBlogDir)) fs.mkdirSync(publicBlogDir, { recursive: true });

  for (const u of updates) {
    const local = path.join(sessionImagesDir, u.file);
    const destName = `${u.slug}.jpg`;
    fs.copyFileSync(local, path.join(publicBlogDir, destName));
    const url = await uploadImage(local, `blog-images/${destName}`);

    const [row] = await db
      .select({ id: blogPosts.id, cover: blogPosts.coverImage })
      .from(blogPosts)
      .where(eq(blogPosts.slug, u.slug))
      .limit(1);
    if (!row) throw new Error(`Post not found: ${u.slug}`);

    await db
      .update(blogPosts)
      .set({
        coverImage: url,
        coverImageAlt: u.alt,
      })
      .where(eq(blogPosts.id, row.id));

    console.log("Updated", u.slug, "id=", row.id);
    console.log("  was", row.cover);
    console.log("  now", url);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
