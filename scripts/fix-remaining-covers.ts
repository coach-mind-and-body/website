import "dotenv/config";
import { eq, like, or, isNull } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";

/** Fallback covers for posts still on Manus/broken CDN */
const EXTRA: Record<string, string> = {
  "embracing-change-redefining-your-journey-through-menopause":
    "/the-midlife-permission-slip-why-you-need-a-new-perimenopause-health-strategy_1780341585171.jpg",
  "stop-food-shame-healing-midlife-insulin-resistance":
    "/metabolism_after_40_1780339113905.png",
  "the-power-of-your-hormone-reset-embrace-day-one-with-confidence":
    "/healing_balance_hormones_1780339100250.png",
  "patterns-not-the-belly-unlocking-weight-loss-success-after-40":
    "/stop-chasing-plans-lasting-health-transformation_1780341583637.jpg",
  "beyond-willpower-how-to-stop-self-sabotaging-weight-loss-after-40":
    "/mindset_decision_maker_1780339085678.png",
};

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      cover: blogPosts.coverImage,
    })
    .from(blogPosts);

  for (const row of rows) {
    const cover = row.cover ?? "";
    const broken =
      !cover ||
      cover.includes("manuscdn") ||
      cover.includes("cdn.mindandbodyresetcoach.com") ||
      cover.startsWith("/blog/");

    if (!broken) {
      console.log("ok", row.slug.slice(0, 50));
      continue;
    }

    let next = EXTRA[row.slug];
    if (!next && cover.startsWith("/blog/")) {
      next = cover.replace(/^\/blog\//, "/");
    }
    if (!next) {
      console.log("SKIP (no map)", row.slug, cover.slice(0, 60));
      continue;
    }

    await db
      .update(blogPosts)
      .set({ coverImage: next })
      .where(eq(blogPosts.id, row.id));
    console.log("FIXED", row.slug, "→", next);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
