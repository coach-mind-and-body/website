/**
 * Publish / update: Patterns, Not the Belly — Unlocking Weight Loss Success After 40
 * Uploads new cover + mid-article image to R2, then upserts blog post.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
import { storagePut } from "../server/storage";

const slug = "patterns-not-the-belly-unlocking-weight-loss-success-after-40";

const title = "Patterns, Not the Belly: Unlocking Weight Loss Success After 40";

const seoTitle = "Patterns Not the Belly: Weight Loss After 40";

const seoDescription =
  "The menopause belly is often a symptom — not the root. Learn how midlife weight loss success after 40 comes from new patterns, better questions, and choosing the right discomfort.";

const excerpt =
  "Where did this belly come from? If you are eating less and trying harder after 40, the real issue may not be your body — it may be the autopilot patterns you have been following. Here is how one-percenters rewrite them.";

const coverImageAlt =
  "Confident midlife woman in a bright kitchen choosing calm, intentional habits for weight loss after 40";

const midImageAlt =
  "Midlife woman walking at golden hour — choosing healthy discomfort and new patterns over the old autopilot";

const schemaFaqJson = JSON.stringify([
  {
    question: "Why am I gaining weight after 40 even when I eat less?",
    answer:
      "After 40, hormonal shifts (including estrogen and insulin sensitivity), stress load, sleep, and long-running habit patterns all matter more. Eating less alone often does not rewrite the autopilot patterns that drive snacking, stress eating, and “I’ll start Monday” cycles.",
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
  "019fa933-9e16-7e82-afeb-4d40a3d2c085",
  "images"
);

// 2.jpg = kitchen cover; 1.jpg = walking mid-article
const coverLocal = path.join(sessionImagesDir, "2.jpg");
const midLocal = path.join(sessionImagesDir, "1.jpg");

function contentWithMidImage(midImageUrl: string): string {
  return `
<p>If you are reading this, chances are you have asked yourself: <strong>“Where did this belly come from?”</strong></p>
<p>You are eating less, moving more, and trying harder than ever — yet the scale stays stubborn and your jeans feel snugger than comfortable. Welcome to the mystery of the <strong>menopause belly</strong>, a frustration so many women over 40 know by heart.</p>
<p>But what if the belly is not the real issue? What if it is simply a <strong>symptom</strong> of patterns your mind has been running on autopilot?</p>
<p><em>Coaching education only — not medical advice. Work with your clinician for personal health decisions.</em></p>

<h2>Why weight gain after 40 feels different</h2>
<p>Let us talk about why some women keep gaining after 40 while others become what I call <strong>the one percenters</strong>.</p>
<p>These are not women with superior genetics or superhuman willpower. They are women who have learned how to <strong>create new patterns</strong> — mindset shifts, simple frameworks, and daily habits that help curb cravings, support insulin sensitivity, and put them back in the driver’s seat with their body.</p>
<p>If midlife metabolism has felt like a locked door, you may also want our guide on <a href="/insulin-resistance-after-40">insulin resistance after 40</a> and the free <a href="/food-quiz">food &amp; mindset quiz</a>.</p>

<h2>The menopause belly myth (and what is really going on)</h2>
<p>The notorious menopause belly seems to laugh at salads and diet tricks. Here is a new perspective: <strong>your body is not broken</strong>. She is responding to patterns you may not even notice anymore.</p>
<p>Think about driving the same route every day. After a while, you arrive without thinking. Weight gain can follow the same autopilot path:</p>
<ul>
  <li>Snacking while you cook dinner</li>
  <li>Off-hours grazing when no one is watching</li>
  <li>Stress eating after a hard day</li>
  <li>The endless “I’ll start Monday” loop</li>
</ul>
<p>None of that makes you weak. It makes you human — and highly trainable. Patterns built you here. New patterns can take you somewhere else.</p>

<h2>Hormones raise the stakes — they do not write you off</h2>
<p>Women are not small men. As we age, shifts in estrogen, insulin, sleep, and stress mean every pattern matters more than it did at 25.</p>
<p>The upside? Your body is still listening. She is still waiting for clearer instructions. That is the heart of becoming a one percenter: <strong>acting with intention and following through when motivation dips</strong> — not waiting to “feel ready.”</p>
<p>For more on midlife identity and change, listen to <a href="/midlife-health-podcast/beyond-the-scale-building-new-weight-loss-patterns"><em>Beyond the Scale: Building New Weight Loss Patterns</em></a> and <a href="/midlife-health-podcast/reclaim-rewire-reset-transform-identity"><em>Reclaim, Rewire, Reset</em></a>.</p>

<figure style="margin:1.75rem 0;">
  <img src="${midImageUrl}" alt="${midImageAlt}" style="width:100%;height:auto;border-radius:16px;display:block;" loading="lazy" />
  <figcaption style="margin-top:0.5rem;font-size:0.875rem;color:#6b7280;text-align:center;">Choosing the walk is choosing the right discomfort — the kind that builds the woman you want to be.</figcaption>
</figure>

<h2>Choose the right discomfort</h2>
<p>Weight loss after 40 is not about avoiding discomfort. It is about <strong>picking which discomfort you will live with</strong>.</p>
<p>Temporary discomfort might look like saying no to an urge, taking a walk instead of collapsing into the couch, or pausing before the pantry. That short-term stretch often costs less than the long-term discomfort of inflammation, stalled energy, and clothes that no longer feel like you.</p>
<p>Every woman faces discomfort. One percenters choose the kind that grows them.</p>

<h2>Patterns beat perfect calorie counting</h2>
<p>Many women still believe meticulous calorie counting guarantees success. Then life happens — and the real leaks show up in patterns: mindless munching, emotional eating, late-night snacking.</p>
<p>Awareness is the key. Start asking:</p>
<ul>
  <li>“What is interrupting my progress?”</li>
  <li>“Where am I handing over control?”</li>
</ul>
<p>Building a new identity also means noticing what you are already getting right. Hitting protein? Drinking water? Moving after dinner? Those are not small. They are votes.</p>
<p>If nighttime sugar is your biggest pattern battle, read <a href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works">how to stop sugar cravings at night</a> and grab the free <a href="/snack-hack">Snack Hack guide</a>.</p>

<h2>Change the scoreboard in your mind</h2>
<p>Whatever you focus on tends to grow. Many women only track misses — like a basketball team that only tallies missed shots. Motivation dies.</p>
<p>One percenters build a different scoreboard: <strong>effort, progress, consistency</strong>. Celebrate the win of delaying a craving, choosing a walk, or keeping a promise you made to yourself at breakfast. Gratitude for small victories rewires identity faster than shame ever will.</p>
<p>Our free <a href="/habit-tracker">habit tracker</a> is a simple place to keep that score without turning your life into a spreadsheet.</p>

<h2>Three practices that rewrite patterns this week</h2>
<ol>
  <li><strong>Ask better questions.</strong> Swap “Why can’t I lose weight?” for “What is interrupting my progress?” Direct your mind on purpose.</li>
  <li><strong>Create a victory list.</strong> End each day with three wins. Train your brain to see evidence, not only gaps.</li>
  <li><strong>Embrace the pause.</strong> When a craving hits, breathe and ask: <em>“Who is driving — future me or craving me?”</em> One pause can change the whole night.</li>
</ol>
<p>Confidence does not arrive as a gift. It is built from consistent evidence — protein on the plate, a walk instead of white-knuckling, a boundary you keep. Every choice is practice for the woman you are becoming.</p>

<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Related on the podcast</p>
  <p style="margin:0;">Patterns over perfection: <a href="/midlife-health-podcast/breaking-the-cycle-habits-not-plans">Breaking the Cycle: Focus on Habits, Not Plans</a> · <a href="/midlife-health-podcast/why-your-brain-resists-change">Why Your Brain Resists Change</a></p>
</div>

<h2>Embrace the one-percenter mindset</h2>
<p>You are not failing. You are practicing.</p>
<p>Each decision is a vote for the woman you want to become. The menopause belly is not the core problem — <strong>patterns are</strong>. And the beautiful part? Patterns can change.</p>
<p>This week: notice your wins, keep the promises you make to yourself, and keep asking, <strong>“Who is driving?”</strong></p>
<p>If you want a simple strategy built for your body after 40 — without another restriction guessing game — <a href="/book">book a free clarity call</a>. Consistency beats perfection. Always.</p>
<p>Keep going. I will see you next week.</p>
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
  const coverUrl = await uploadImage(
    coverLocal,
    `blog-images/${slug}.jpg`
  );
  const midUrl = await uploadImage(
    midLocal,
    `blog-images/${slug}-walk.jpg`
  );

  // Local fallbacks
  const publicDir = path.join(process.cwd(), "public", "blog");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(coverLocal, path.join(publicDir, `${slug}.jpg`));
  fs.copyFileSync(midLocal, path.join(publicDir, `${slug}-walk.jpg`));
  console.log("Saved local copies under public/blog/");

  const content = contentWithMidImage(midUrl);

  const db = await getDb();
  if (!db) throw new Error("No database connection");

  const [existing] = await db
    .select({ id: blogPosts.id, publishedAt: blogPosts.publishedAt })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  const values = {
    slug,
    title,
    excerpt,
    content,
    category: "Mindset & Habits",
    coverImage: coverUrl,
    coverImageAlt,
    published: true,
    publishedAt: existing?.publishedAt ?? new Date(),
    seoTitle,
    seoDescription,
    schemaTypes: "Article,FAQ,HowTo",
    schemaFaqJson,
    schemaHowToStepsJson,
    schemaVideoUrl: null as string | null,
    schemaVideoDescription: null as string | null,
  };

  if (existing) {
    await db.update(blogPosts).set(values).where(eq(blogPosts.id, existing.id));
    console.log("Updated post id=", existing.id);
  } else {
    await db.insert(blogPosts).values({
      ...values,
      publishedAt: new Date(),
    });
    console.log("Inserted new post");
  }

  console.log(`https://mindandbodyresetcoach.com/health-wellness-blog/${slug}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
