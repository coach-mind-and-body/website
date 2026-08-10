/**
 * Publish / update: Patterns, Not the Belly — Unlocking Weight Loss Success After 40
 * Uploads cover + mid-article images to R2, then upserts blog post.
 *
 * Source draft: Not the Belly_ Are you a 1 percenter_.txt
 * Light polish for tone + SEO; message preserved.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
import { storagePut } from "../server/storage";

const slug = "why-am-i-gaining-weight-after-40-even-when-i-eat-less";
const videoId = "HKDt7qWLv3g";
const podcastSlug = "why-am-i-gaining-weight-after-40-even-when-i-eat-less";

// Search-intent question people actually type into Google
const title = "Why Am I Gaining Weight After 40 Even When I Eat Less?";
const seoTitle = "Why Am I Gaining Weight After 40 Even When I Eat Less?";

const seoDescription =
  "Why am I gaining weight after 40 even when I eat less? The menopause belly is often a symptom of autopilot patterns — not a broken body. Learn one-percenter habits that actually stick.";

const excerpt =
  "Why am I gaining weight after 40 even when I eat less and try harder? The menopause belly may not be the real issue — autopilot patterns often are. Here is how one-percenters rewrite them.";

const coverImageAlt =
  "Confident midlife woman in a bright kitchen choosing calm, intentional habits for weight loss after 40";

const walkImageAlt =
  "Midlife woman walking at golden hour — choosing healthy discomfort and new patterns over the old autopilot";

const pauseImageAlt =
  "Midlife woman pausing at the pantry, choosing intention over a craving after 40";

const victoryImageAlt =
  "Midlife woman writing a daily victory list — tracking wins for weight loss mindset after 40";

const schemaFaqJson = JSON.stringify([
  {
    question: "Why am I gaining weight after 40 even when I eat less?",
    answer:
      "After 40, hormonal shifts (including estrogen and insulin), stress, sleep, and long-running habit patterns all matter more. Eating less alone often does not rewrite the autopilot patterns that drive snacking, stress eating, and “I’ll start Monday” cycles.",
  },
  {
    question: "Is the menopause belly really the problem?",
    answer:
      "The midsection change is real and frustrating — but it is often a symptom. Patterns like mindless kitchen snacking, late-night grazing, stress eating, and all-or-nothing thinking shape results as much as any single meal plan.",
  },
  {
    question: "What does it mean to be a weight-loss “one percenter” after 40?",
    answer:
      "One-percenters are not women with perfect genetics or endless willpower. They are women who intentionally build new patterns, keep promises to themselves when motivation dips, and choose short-term growth discomfort over long-term stuckness.",
  },
  {
    question: "Should I still count calories after 40?",
    answer:
      "Awareness can help, but meticulous calorie counting rarely fixes mindless munching, emotional eating, or late-night patterns. Start with better questions, a daily victory list, and a pause before cravings — then build protein, water, and consistency from identity, not perfection.",
  },
  {
    question: "How do I change patterns without white-knuckling?",
    answer:
      "Ask what is interrupting progress, track wins instead of only failures, and practice a short pause when a craving hits: “Who is driving — future me or craving me?” Small consistent votes rebuild confidence and identity.",
  },
]);

const schemaHowToStepsJson = JSON.stringify([
  {
    name: "Ask better questions",
    text: "Replace “Why can’t I lose weight?” with “What is interrupting my progress?” and “Where am I handing over control?”",
  },
  {
    name: "Create a daily victory list",
    text: "End each day with three wins — effort, consistency, or tiny choices — so your brain keeps score of progress, not only mistakes.",
  },
  {
    name: "Embrace the pause",
    text: "When a craving hits, breathe and ask: “Who is driving? Future me or craving me?” That one beat can change the pattern.",
  },
  {
    name: "Vote for your future self",
    text: "Treat each choice — protein, a walk, a boundary — as evidence you are becoming the woman who follows through.",
  },
]);

const sessionImagesDir = path.join(
  process.env.USERPROFILE || "",
  ".grok",
  "sessions",
  "C%3A%5CUsers%5Ccarte%5CDownloads%5Cmind-body-reset-portal",
  "019fe47f-5324-7ad1-9199-5e4bcc00ed62",
  "images"
);

const publicBlogDir = path.join(process.cwd(), "public", "blog");

// Existing assets in public/blog (from prior publish)
const coverLocal = path.join(publicBlogDir, `${slug}.jpg`);
const walkLocal = path.join(publicBlogDir, `${slug}-walk.jpg`);
// New mid-article images from this session
const victoryLocal = path.join(sessionImagesDir, "1.jpg");
const pauseLocal = path.join(sessionImagesDir, "2.jpg");

function figure(src: string, alt: string, caption: string): string {
  return `
<figure style="margin:1.75rem 0;">
  <img src="${src}" alt="${alt}" style="width:100%;height:auto;border-radius:16px;display:block;" loading="lazy" />
  <figcaption style="margin-top:0.5rem;font-size:0.875rem;color:#6b7280;text-align:center;">${caption}</figcaption>
</figure>`.trim();
}

function buildContent(imgs: {
  walk: string;
  pause: string;
  victory: string;
}): string {
  return `
<p>If you are reading this, chances are you have asked yourself: <strong>“Where did this belly come from?”</strong></p>
<p>You are eating less, exercising more, and trying harder than ever — yet the scale stays stubborn and your jeans feel more snug than comfortable. Welcome to the mystery of the <strong>menopause belly</strong>, a frustration so many women over 40 know by heart.</p>
<p>But what if the belly is not the real issue? What if it is simply a <strong>symptom</strong> of the patterns your mind has been following on autopilot?</p>
<p><strong>Are you a one percenter?</strong> The women who unlock weight loss success after 40 are not lucky outliers. They learn to embrace a different kind of discomfort — and rewrite the patterns underneath the belly.</p>
<p><em>Coaching education only — not medical advice. Work with your clinician for personal health decisions.</em></p>

<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Watch / listen to the episode</p>
  <p style="margin:0 0 0.75rem;">Prefer Lee Anne&apos;s voice? Full show notes and player: <a href="/midlife-health-podcast/${podcastSlug}"><em>Why Am I Gaining Weight After 40 Even When I Eat Less?</em></a>.</p>
  <p style="margin:0;"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a> · also in the free <a href="/habit-tracker/podcasts">habit tracker podcast tab</a>.</p>
</div>

<h2>Understanding weight gain after 40</h2>
<p>Let us talk about why some women keep gaining weight after 40 while others become what I call <strong>the one percenters</strong>.</p>
<p>These are not women with superior genetics or boundless willpower. They are women who have mastered the art of <strong>creating new patterns</strong> — mindset shifts, simple frameworks, and daily habits that help curb cravings, support insulin resistance, and put them back in control of their bodies again.</p>
<p>If midlife metabolism has felt like a locked door, you may also want our guide on <a href="/insulin-resistance-after-40">insulin resistance after 40</a> and the free <a href="/food-quiz">food &amp; mindset quiz</a>.</p>

<h2>Redefining the menopause belly myth</h2>
<p>The notorious menopause belly seems to laugh in the face of salads and diet tricks. Here is a new perspective: <strong>your body is not broken</strong>. She is responding to patterns you have unconsciously set.</p>
<p>Think about driving the same route every day. After a while, it becomes second nature. Weight gain follows a similar path. Patterns like these slowly become your default:</p>
<ul>
  <li>Snacking while you prepare dinner</li>
  <li>Off-hours grazing when no one is watching</li>
  <li>Stress eating after a hectic day</li>
  <li>The continual “I’ll start Monday” mentality</li>
</ul>
<p>None of that makes you weak. It makes you human — and highly trainable. Patterns built you here. New patterns can take you somewhere else.</p>

${figure(imgs.walk, walkImageAlt, "Choosing the walk is choosing the right discomfort — the kind that builds the woman you want to be.")}

<h2>The hormonal influence after 40</h2>
<p>Women are not small men. As we age, hormonal shifts — especially in estrogen and insulin — mean every pattern plays a bigger role than it did at 25.</p>
<p>But there is an upside: your body is still listening. She is still waiting for the right instructions. That is the heart of becoming a one percenter — <strong>acting with intention and following through with your plans even when motivation dwindles</strong>.</p>
<p>For more on midlife identity and change, listen to <a href="/midlife-health-podcast/beyond-the-scale-building-new-weight-loss-patterns"><em>Beyond the Scale: Building New Weight Loss Patterns</em></a> and <a href="/midlife-health-podcast/reclaim-rewire-reset-transform-identity"><em>Reclaim, Rewire, Reset</em></a>.</p>

<h2>Choosing the right discomfort</h2>
<p>The journey to weight loss is not about evading discomfort. It is about <strong>selecting the right type</strong>.</p>
<p>Temporary discomfort can mean saying no to an immediate craving or choosing a walk instead of lounging. That short stretch usually costs less than the long-term discomfort of weight gain, inflammation, and clothes that no longer feel like you.</p>
<p>Every woman faces discomfort. One percenters pick the kind that fosters growth.</p>

${figure(imgs.pause, pauseImageAlt, "One pause at the pantry: “Who is driving — future me or craving me?”")}

<h2>Patterns over calorie counting</h2>
<p>Many women hold onto the belief that meticulous calorie counting will guarantee success. Then life happens — and the real leaks show up in patterns: mindless munching, emotional eating, and late-night snacking.</p>
<p>The key is awareness. Routinely ask yourself:</p>
<ul>
  <li>“What is interrupting my progress?”</li>
  <li>“Where am I relinquishing control?”</li>
</ul>
<p>Building a new identity also begins with acknowledging what you are getting right. Are you hitting your protein goals? Drinking enough water? Those are not small. They are votes.</p>
<p>If nighttime sugar is your biggest pattern battle, read <a href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works">how to stop sugar cravings at night</a> and grab the free <a href="/snack-hack">Snack Hack guide</a>.</p>

<h2>Shifting your mindset (change the scoreboard)</h2>
<p>Like a scoreboard, whatever you focus on will grow. Many women track only their missteps. If a basketball team only tallied missed shots, motivation would plummet.</p>
<p>Instead, celebrate your wins — effort, progress, and consistency. That builds a new scoreboard and alters your identity. Practice gratitude for the small victories. Did you delay a craving? Choose a healthier snack? Those are triumphs worth applauding.</p>
<p>Our free <a href="/habit-tracker">habit tracker</a> is a simple place to keep that score without turning your life into a spreadsheet.</p>

${figure(imgs.victory, victoryImageAlt, "End the day with three wins. Train your brain to see evidence — not only gaps.")}

<h2>Actionable steps to transform patterns</h2>
<ol>
  <li><strong>Ask better questions.</strong> Replace “Why can’t I lose weight?” with “What is interrupting my progress?” Direct your mind on purpose.</li>
  <li><strong>Create a victory list.</strong> Conclude each day by listing three successes. This trains your brain to see wins, not just areas for improvement.</li>
  <li><strong>Embrace the pause.</strong> When cravings strike, take a breath and ask: <em>“Who is driving — future me or craving me?”</em> This single moment can shift everything.</li>
</ol>
<p>Confidence does not just appear. It is cultivated through consistent evidence from each choice. Whether it is the protein on your plate or a walk over instant gratification, you are transforming into a new person.</p>

<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Related on the podcast</p>
  <p style="margin:0;">Patterns over perfection: <a href="/midlife-health-podcast/breaking-the-cycle-habits-not-plans">Breaking the Cycle: Focus on Habits, Not Plans</a> · <a href="/midlife-health-podcast/why-your-brain-resists-change">Why Your Brain Resists Change</a></p>
</div>

<h2>Conclusion: embrace the one-percenter mindset</h2>
<p>You are not failing. You are practicing.</p>
<p>Each decision is a vote for the woman you aspire to become. The menopause belly is not the core issue — <strong>patterns are</strong>. And the beauty is, patterns can evolve.</p>
<p>This week: focus on recognizing your wins, upholding promises to yourself, and consistently asking, <strong>“Who is driving?”</strong></p>
<p>If you are ready for a tailored strategy that fits your body after 40 — without another restriction guessing game — <a href="/book">book a free clarity call</a>. You do not need more restriction. You need better patterns. Consistency triumphs over perfection.</p>
<p>Keep striving. See you next week.</p>
`.trim();
}

async function uploadImage(localPath: string, key: string): Promise<string> {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Image not found: ${localPath}`);
  }
  const buf = fs.readFileSync(localPath);
  const { url } = await storagePut(key, buf, "image/jpeg");
  console.log("Uploaded", key, "->", url);
  const head = await fetch(url, { method: "HEAD" });
  console.log("CDN HEAD", head.status, url);
  return url;
}

async function main() {
  for (const p of [coverLocal, walkLocal, victoryLocal, pauseLocal]) {
    if (!fs.existsSync(p)) throw new Error(`Missing image: ${p}`);
  }

  const coverUrl = await uploadImage(coverLocal, `blog-images/${slug}.jpg`);
  const walkUrl = await uploadImage(walkLocal, `blog-images/${slug}-walk.jpg`);
  const victoryUrl = await uploadImage(
    victoryLocal,
    `blog-images/${slug}-victory-list.jpg`
  );
  const pauseUrl = await uploadImage(
    pauseLocal,
    `blog-images/${slug}-pause.jpg`
  );

  // Local copies for repo / fallbacks
  if (!fs.existsSync(publicBlogDir)) fs.mkdirSync(publicBlogDir, { recursive: true });
  fs.copyFileSync(victoryLocal, path.join(publicBlogDir, `${slug}-victory-list.jpg`));
  fs.copyFileSync(pauseLocal, path.join(publicBlogDir, `${slug}-pause.jpg`));
  console.log("Saved local mid-article copies under public/blog/");

  const content = buildContent({
    walk: walkUrl,
    pause: pauseUrl,
    victory: victoryUrl,
  });

  const db = await getDb();
  if (!db) throw new Error("No database connection");

  const [existing] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  // Should have published yesterday (user: 2026-08-08 today → 2026-08-07)
  const publishedAt = new Date("2026-08-07T15:00:00.000Z");

  const values = {
    slug,
    title,
    excerpt,
    content,
    category: "Mindset & Habits",
    coverImage: coverUrl,
    coverImageAlt,
    published: true,
    publishedAt,
    seoTitle,
    seoDescription,
    schemaTypes: "Article,FAQ,HowTo,VideoObject",
    schemaFaqJson,
    schemaHowToStepsJson,
    schemaVideoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    schemaVideoDescription:
      "Why am I gaining weight after 40 even when I eat less? Menopause belly as a pattern symptom, one-percenters, future you vs craving you, and the right discomfort.",
  };

  if (existing) {
    await db.update(blogPosts).set(values).where(eq(blogPosts.id, existing.id));
    console.log("Updated post id=", existing.id);
  } else {
    await db.insert(blogPosts).values(values);
    console.log("Inserted new post");
  }

  console.log(`https://mindandbodyresetcoach.com/health-wellness-blog/${slug}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
