/**
 * Boost SEO for "how to calm food noise" (GSC query exists; avg position ~97).
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";

const slug = "calming-food-noise-drop-the-food-courtroom";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  const [post] = await db
    .select({ id: blogPosts.id, title: blogPosts.title })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!post) throw new Error(`missing post ${slug}`);

  await db
    .update(blogPosts)
    .set({
      // Keep H1-style title readable; SEO fields target the search query
      seoTitle: "How to Calm Food Noise After 40 (Without Another Diet)",
      seoDescription:
        "How to calm food noise after 40: what food noise is, why restriction makes it louder, and practical midlife strategies to quiet the mental food fight — without another diet.",
      excerpt:
        "How to calm food noise after 40 — why the mental food courtroom gets louder in midlife, and how to quiet it without more willpower or restriction.",
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, post.id));

  console.log("Updated food-noise SEO for id=", post.id);
  console.log(
    `https://mindandbodyresetcoach.com/health-wellness-blog/${slug}`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
