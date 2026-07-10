import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
import { storagePut } from "../server/storage";

const slug = "what-if-you-did-an-exercise-snack-instead";

// Generated featured image path (session images folder)
const candidates = [
  path.join(
    process.env.USERPROFILE || "",
    ".grok",
    "sessions",
    "C%3A%5CUsers%5Ccarte%5CDownloads%5Cmind-body-reset-portal",
    "019f4d12-ac40-7fe3-b127-05421e0de5ed",
    "images",
    "1.jpg"
  ),
  path.join(
    "C:\\Users\\carte\\.grok\\sessions\\C%3A%5CUsers%5Ccarte%5CDownloads%5Cmind-body-reset-portal\\019f4d12-ac40-7fe3-b127-05421e0de5ed\\images\\1.jpg"
  ),
];

async function main() {
  const localPath = candidates.find((p) => fs.existsSync(p));
  if (!localPath) {
    console.error("Generated image not found. Tried:", candidates);
    process.exit(1);
  }

  const buf = fs.readFileSync(localPath);
  const key = `blog-images/${slug}.jpg`;
  const { url } = await storagePut(key, buf, "image/jpeg");
  console.log("Uploaded:", url);

  const head = await fetch(url, { method: "HEAD" });
  console.log("CDN HEAD", head.status);

  const db = await getDb();
  if (!db) throw new Error("no db");

  const [existing] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!existing) {
    console.error("Post not found:", slug);
    process.exit(1);
  }

  await db
    .update(blogPosts)
    .set({
      coverImage: url,
      coverImageAlt:
        "Woman in midlife doing a simple exercise snack at home — squat movement for energy instead of snacking",
    })
    .where(eq(blogPosts.id, existing.id));

  // Also copy into public for local/static fallback
  const publicDir = path.join(process.cwd(), "public", "blog");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(localPath, path.join(publicDir, `${slug}.jpg`));
  console.log("Saved local copy: public/blog/" + slug + ".jpg");
  console.log(`https://mindandbodyresetcoach.com/health-wellness-blog/${slug}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
