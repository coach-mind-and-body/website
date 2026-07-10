/**
 * Re-upload blog covers from local public/ files to Cloudflare R2
 * and set coverImage to https://cdn.mindandbodyresetcoach.com/...
 *
 * Usage: npx tsx scripts/reupload-covers-to-r2.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
import { storagePut } from "../server/storage";

/** Prefer these local files for known slugs */
const SLUG_LOCAL_FILE: Record<string, string> = {
  "how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works":
    "how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works_1780341585867.png",
  "calming-food-noise-drop-the-food-courtroom":
    "how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works_1780341585867.png", // fallback if no food-noise local; try cloudfront below
  "fuel-system-reset-switching-from-sugar-to-fat-burning":
    "fuel-system-reset-switching-from-sugar-to-fat-burning_1780341579953.jpg",
  "colon-health-after-40-diet-inflammation":
    "colon-health-after-40-diet-inflammation_1780341578870.jpg",
  "is-it-anxiety-or-is-it-perimenopause":
    "is-it-anxiety-or-is-it-perimenopause_1780341580726.jpg",
  "the-midlife-sleep-crisis": "the-midlife-sleep-crisis_1780341582693.jpg",
  "the-midlife-permission-slip-why-you-need-a-new-perimenopause-health-strategy":
    "the-midlife-permission-slip-why-you-need-a-new-perimenopause-health-strategy_1780341585171.jpg",
  "stop-chasing-plans-lasting-health-transformation":
    "stop-chasing-plans-lasting-health-transformation_1780341583637.jpg",
  "weight-loss-mindset-mind-the-gap-to-find-your-peace":
    "weight-loss-mindset-mind-the-gap-to-find-your-peace_1780341577441.webp",
  "mastering-insulin-fueling-fat-burning-and-energy-after-40":
    "metabolism_after_40_1780339113905.png",
  "reclaim-rewire-reset-become-a-different-decision-maker":
    "mindset_decision_maker_1780339085678.png",
  "rebuilding-your-body-after-baby-how-i-got-my-energy-and-confidence-back":
    "postpartum_energy_recovery_1780339071077.png",
  "when-your-body-stops-responding-finding-the-balance":
    "healing_balance_hormones_1780339100250.png",
  "stop-food-shame-healing-midlife-insulin-resistance":
    "metabolism_after_40_1780339113905.png",
  "the-power-of-your-hormone-reset-embrace-day-one-with-confidence":
    "healing_balance_hormones_1780339100250.png",
  "embracing-change-redefining-your-journey-through-menopause":
    "the-midlife-permission-slip-why-you-need-a-new-perimenopause-health-strategy_1780341585171.jpg",
  "patterns-not-the-belly-unlocking-weight-loss-success-after-40":
    "stop-chasing-plans-lasting-health-transformation_1780341583637.jpg",
  "beyond-willpower-how-to-stop-self-sabotaging-weight-loss-after-40":
    "mindset_decision_maker_1780339085678.png",
  "midlife-body-image-your-body-is-not-a-before-picture":
    "weight-loss-mindset-mind-the-gap-to-find-your-peace_1780341577441.webp",
  "embrace-reflection-shifting-from-fault-finding-to-self-awareness":
    "the-midlife-sleep-crisis_1780341582693.jpg",
};

/** Remote sources when no local file (CloudFront still works) */
const SLUG_REMOTE: Record<string, string> = {
  "calming-food-noise-drop-the-food-courtroom":
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/food-noise_ce014448.jpg",
  "midlife-body-image-your-body-is-not-a-before-picture":
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/midlife-body-image_60942928.jpg",
  "embrace-reflection-shifting-from-fault-finding-to-self-awareness":
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/reflection_bd3fd046.jpg",
};

function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  return "image/jpeg";
}

function findLocal(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), "public", filename),
    path.join(process.cwd(), "public", "blog", filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function loadBuffer(
  slug: string
): Promise<{ buffer: Buffer; ext: string } | null> {
  const localName = SLUG_LOCAL_FILE[slug];
  if (localName) {
    const localPath = findLocal(localName);
    if (localPath) {
      const ext = path.extname(localPath).replace(".", "") || "jpg";
      return { buffer: fs.readFileSync(localPath), ext };
    }
  }

  const remote = SLUG_REMOTE[slug];
  if (remote) {
    const res = await fetch(remote);
    if (!res.ok) {
      console.error(`  remote fetch failed ${res.status} ${remote}`);
      return null;
    }
    const ext =
      remote.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
    return { buffer: Buffer.from(await res.arrayBuffer()), ext };
  }

  return null;
}

async function main() {
  const publicBase =
    process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ||
    "https://cdn.mindandbodyresetcoach.com";

  console.log("R2 public base:", publicBase);

  const db = await getDb();
  if (!db) throw new Error("No DB");

  const posts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      cover: blogPosts.coverImage,
    })
    .from(blogPosts);

  for (const post of posts) {
    console.log(`\n→ ${post.slug}`);

    // Already on working CDN with a key that exists? still re-upload for consistency
    const loaded = await loadBuffer(post.slug);
    if (!loaded) {
      console.log("  SKIP: no local/remote source mapped");
      continue;
    }

    const key = `blog-images/${post.slug}.${loaded.ext}`;
    const contentType = mimeFromExt(loaded.ext);

    try {
      const { url } = await storagePut(key, loaded.buffer, contentType);
      // Prefer explicit public base (cdn.mindandbodyresetcoach.com)
      const finalUrl = url.includes("cdn.mindandbodyresetcoach.com")
        ? url
        : `${publicBase}/${key}`;

      await db
        .update(blogPosts)
        .set({ coverImage: finalUrl })
        .where(eq(blogPosts.id, post.id));

      // Verify
      const head = await fetch(finalUrl, { method: "HEAD" });
      console.log(`  uploaded ${finalUrl} → HEAD ${head.status}`);
    } catch (e) {
      console.error("  FAILED", e);
    }
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
