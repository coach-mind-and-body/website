/**
 * Link the Patterns blog post to the matching podcast show notes + YouTube video.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";

const slug = "patterns-not-the-belly-unlocking-weight-loss-success-after-40";
const podcastSlug = "patterns-not-the-belly-weight-loss-after-40";
const videoId = "5Lnsf3gQLUc";

const watchBox = `
<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Watch / listen to the episode</p>
  <p style="margin:0 0 0.75rem;">Prefer Lee Anne&apos;s voice? Full show notes and player: <a href="/midlife-health-podcast/${podcastSlug}"><em>Patterns, Not the Belly: Unlocking Weight Loss Success After 40</em></a>.</p>
  <p style="margin:0;"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a> · also in the free <a href="/habit-tracker/podcasts">habit tracker podcast tab</a>.</p>
</div>
`.trim();

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  if (!post) throw new Error("post missing");

  let content = post.content || "";

  // Strip prior related-podcast callouts so we don't double-stack
  content = content.replace(
    /<div style="padding:1\.25rem 1\.5rem;border-radius:12px;background:oklch\(0\.96 0\.02 148\);[\s\S]*?<\/div>/g,
    ""
  );

  const disclaimer = "<p><em>Coaching education only";
  const dIdx = content.indexOf(disclaimer);
  if (dIdx !== -1) {
    const close = content.indexOf("</p>", dIdx);
    if (close !== -1) {
      content =
        content.slice(0, close + 4) + "\n" + watchBox + "\n" + content.slice(close + 4);
    } else {
      content = watchBox + "\n" + content;
    }
  } else {
    content = watchBox + "\n" + content;
  }

  // Clean excess blank lines from removals
  content = content.replace(/\n{3,}/g, "\n\n").trim();

  await db
    .update(blogPosts)
    .set({
      content,
      schemaTypes: "Article,FAQ,HowTo,VideoObject",
      schemaVideoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      schemaVideoDescription:
        "Patterns, Not the Belly: Unlocking Weight Loss Success After 40 — menopause belly as a pattern symptom, one-percenters, and the right discomfort after 40.",
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, post.id));

  console.log("Blog updated id=", post.id);
  console.log(`https://mindandbodyresetcoach.com/health-wellness-blog/${slug}`);
  console.log(
    `https://mindandbodyresetcoach.com/midlife-health-podcast/${podcastSlug}`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
