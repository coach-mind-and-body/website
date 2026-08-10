/**
 * Update Patterns blog: question title + correct YouTube video (HKDt7qWLv3g)
 * Does not re-upload images — rewrites content video links + metadata.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";

const slug = "why-am-i-gaining-weight-after-40-even-when-i-eat-less";
const videoId = "HKDt7qWLv3g";
const podcastSlug = "why-am-i-gaining-weight-after-40-even-when-i-eat-less";

// Search-intent question (people type this into Google)
const title = "Why Am I Gaining Weight After 40 Even When I Eat Less?";
const seoTitle = "Why Am I Gaining Weight After 40 Even When I Eat Less?";
const seoDescription =
  "Why am I gaining weight after 40 even when I eat less? The menopause belly is often a symptom of autopilot patterns — not a broken body. Learn one-percenter habits that actually stick.";
const excerpt =
  "Why am I gaining weight after 40 even when I eat less and try harder? The menopause belly may not be the real issue — autopilot patterns often are. Here is how one-percenters rewrite them.";

const schemaVideoDescription =
  "Why am I gaining weight after 40 even when I eat less? Menopause belly as a pattern symptom, one-percenters, future you vs craving you, and the right discomfort.";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("No database connection");

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!post) throw new Error(`Post not found: ${slug}`);

  let content = post.content || "";

  // Fix any old YouTube IDs
  content = content.replace(/5Lnsf3gQLUc/g, videoId);
  content = content.replace(
    /https:\/\/youtu\.be\/[A-Za-z0-9_-]+/g,
    `https://youtu.be/${videoId}`
  );
  content = content.replace(
    /https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]+/g,
    `https://www.youtube.com/watch?v=${videoId}`
  );

  // Refresh watch box title to match question framing
  content = content.replace(
    /<em>Patterns, Not the Belly: Unlocking Weight Loss Success After 40<\/em>/g,
    `<em>${title}</em>`
  );

  // Ensure podcast slug links are correct
  content = content.replace(
    /\/midlife-health-podcast\/why-am-i-gaining-weight-after-40-even-when-i-eat-less/g,
    `/midlife-health-podcast/${podcastSlug}`
  );

  // If watch box is missing, inject after disclaimer
  if (!content.includes(`/midlife-health-podcast/${podcastSlug}`)) {
    const watchBox = `
<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Watch / listen to the episode</p>
  <p style="margin:0 0 0.75rem;">Prefer Lee Anne&apos;s voice? Full show notes and player: <a href="/midlife-health-podcast/${podcastSlug}"><em>${title}</em></a>.</p>
  <p style="margin:0;"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a> · also in the free <a href="/habit-tracker/podcasts">habit tracker podcast tab</a>.</p>
</div>`.trim();

    const disclaimer = "<p><em>Coaching education only";
    const dIdx = content.indexOf(disclaimer);
    if (dIdx !== -1) {
      const close = content.indexOf("</p>", dIdx);
      if (close !== -1) {
        content =
          content.slice(0, close + 4) +
          "\n" +
          watchBox +
          "\n" +
          content.slice(close + 4);
      } else {
        content = watchBox + "\n" + content;
      }
    } else {
      content = watchBox + "\n" + content;
    }
  }

  await db
    .update(blogPosts)
    .set({
      title,
      excerpt,
      content,
      seoTitle,
      seoDescription,
      schemaTypes: "Article,FAQ,HowTo,VideoObject",
      schemaVideoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      schemaVideoDescription,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, post.id));

  console.log("Updated blog id=", post.id);
  console.log("Title:", title);
  console.log(`https://mindandbodyresetcoach.com/health-wellness-blog/${slug}`);
  console.log(
    `https://mindandbodyresetcoach.com/midlife-health-podcast/${podcastSlug}`
  );
  console.log(`https://www.youtube.com/watch?v=${videoId}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
