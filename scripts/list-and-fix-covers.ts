import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";

/** Map known slugs → stable public paths (on-site files that 200) */
const SLUG_COVERS: Record<string, string> = {
  "how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works":
    "/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works_1780341585867.png",
  "calming-food-noise-drop-the-food-courtroom":
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/food-noise_ce014448.jpg",
  "fuel-system-reset-switching-from-sugar-to-fat-burning":
    "/fuel-system-reset-switching-from-sugar-to-fat-burning_1780341579953.jpg",
  "colon-health-after-40-diet-inflammation":
    "/colon-health-after-40-diet-inflammation_1780341578870.jpg",
  "is-it-anxiety-or-is-it-perimenopause":
    "/is-it-anxiety-or-is-it-perimenopause_1780341580726.jpg",
  "the-midlife-sleep-crisis": "/the-midlife-sleep-crisis_1780341582693.jpg",
  "the-midlife-permission-slip-why-you-need-a-new-perimenopause-health-strategy":
    "/the-midlife-permission-slip-why-you-need-a-new-perimenopause-health-strategy_1780341585171.jpg",
  "stop-chasing-plans-lasting-health-transformation":
    "/stop-chasing-plans-lasting-health-transformation_1780341583637.jpg",
  "weight-loss-mindset-mind-the-gap-to-find-your-peace":
    "/weight-loss-mindset-mind-the-gap-to-find-your-peace_1780341577441.webp",
  "mastering-insulin-fueling-fat-burning-and-energy-after-40":
    "/metabolism_after_40_1780339113905.png",
  "reclaim-rewire-reset-become-a-different-decision-maker":
    "/mindset_decision_maker_1780339085678.png",
  "rebuilding-your-body-after-baby-how-i-got-my-energy-and-confidence-back":
    "/postpartum_energy_recovery_1780339071077.png",
  "when-your-body-stops-responding-finding-the-balance":
    "/healing_balance_hormones_1780339100250.png",
  "midlife-body-image-your-body-is-not-a-before-picture":
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/midlife-body-image_60942928.jpg",
  "embrace-reflection-shifting-from-fault-finding-to-self-awareness":
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/reflection_bd3fd046.jpg",
};

function needsFix(cover: string | null): boolean {
  if (!cover) return true;
  if (cover.includes("manuscdn.com")) return true;
  if (cover.startsWith("/blog/")) return true; // broken by /blog/:slug redirect
  if (cover.includes("/blog/") && cover.includes("mindandbodyresetcoach")) return true;
  return false;
}

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

  console.log(`Found ${rows.length} posts\n`);

  for (const row of rows) {
    const current = row.cover ?? "(none)";
    const mapped = SLUG_COVERS[row.slug];
    let next: string | null = null;

    if (mapped) {
      next = mapped;
    } else if (row.cover?.startsWith("/blog/")) {
      // Prefer root path if file was duplicated at public root
      next = row.cover.replace(/^\/blog\//, "/");
    } else if (row.cover?.includes("manuscdn.com")) {
      console.log(`MANUS (no map): ${row.slug}`);
      continue;
    }

    if (!next || next === row.cover) {
      if (needsFix(row.cover)) {
        console.log(`STILL BROKEN?: ${row.slug} → ${current.slice(0, 90)}`);
      } else {
        console.log(`ok: ${row.slug}`);
      }
      continue;
    }

    await db
      .update(blogPosts)
      .set({ coverImage: next })
      .where(eq(blogPosts.id, row.id));
    console.log(`FIXED: ${row.slug}`);
    console.log(`  was: ${current.slice(0, 90)}`);
    console.log(`  now: ${next}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
