/**
 * Upsert SEO pillar blog posts by slug.
 * Usage: pnpm exec tsx scripts/upsert-pillar-posts.ts
 * Requires DATABASE_URL.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
import { SUGAR_CRAVINGS_PILLAR } from "../content/pillars/sugar-cravings";
import { FOOD_NOISE_PILLAR } from "../content/pillars/food-noise";

const PILLARS = [SUGAR_CRAVINGS_PILLAR, FOOD_NOISE_PILLAR];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection (DATABASE_URL missing or getDb failed).");
    process.exit(1);
  }

  for (const p of PILLARS) {
    const [existing] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, p.slug))
      .limit(1);

    const values = {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category,
      coverImage: p.coverImage,
      coverImageAlt: p.coverImageAlt,
      published: true,
      publishedAt: new Date(),
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      schemaTypes: p.schemaTypes,
      schemaFaqJson: p.schemaFaqJson,
      schemaHowToStepsJson: "schemaHowToStepsJson" in p ? (p as { schemaHowToStepsJson?: string }).schemaHowToStepsJson ?? null : null,
    };

    if (existing) {
      await db.update(blogPosts).set(values).where(eq(blogPosts.id, existing.id));
      console.log(`Updated pillar: ${p.slug}`);
    } else {
      await db.insert(blogPosts).values(values);
      console.log(`Inserted pillar: ${p.slug}`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
