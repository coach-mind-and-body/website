/**
 * Upsert show notes for Menopause Belly / Patterns Not the Belly episode
 * YouTube: https://youtu.be/5Lnsf3gQLUc
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { podcastEpisodes } from "../drizzle/schema";

const videoId = "5Lnsf3gQLUc";
const slug = "patterns-not-the-belly-weight-loss-after-40";
const title =
  "Patterns, Not the Belly: Unlocking Weight Loss Success After 40";

const showNotesHtml = `
<p>Oh my heck — where did this belly come from? You’re eating less, exercising more, and trying harder than ever… yet the scale won’t move, your jeans feel tighter, and nighttime cravings feel stronger than willpower.</p>
<p>In this episode, Lee Anne asks a better question: <strong>what if the menopause belly isn’t the problem?</strong> What if it’s a <em>symptom</em> of patterns your brain is running on autopilot?</p>
<p>You’ll hear why some women keep gaining after 40 while others become what she calls <strong>the one percenters</strong> — not because of better genetics or more willpower, but because they learn how to build new patterns. Mindset shifts, a simple framework, and daily habits that help reduce cravings, support insulin resistance, and put you back in control of your body.</p>

<h2>Key takeaways</h2>
<ul>
  <li><strong>The menopause belly is often a symptom, not the root problem.</strong> Your body isn’t broken — she’s responding to patterns.</li>
  <li><strong>Weight gain runs on autopilot routes.</strong> Same turns, same roads: crackers while cooking, nightly chocolate, stress eating, weekend rewards, “I’ll start Monday.”</li>
  <li><strong>After 40, every pattern matters more.</strong> Hormones shift. Estrogen changes. Insulin becomes more dominant. Small defaults get louder — but your body is still listening.</li>
  <li><strong>One percenters keep promises to themselves.</strong> They don’t wait for motivation. They follow through when nobody is watching — especially then. That evidence becomes identity.</li>
  <li><strong>Ask: “Who is driving — future you or craving you?”</strong> Future you wants energy, confidence, travel, grandkids. Craving you wants relief at 9 p.m. Somebody gets the keys.</li>
  <li><strong>Choose the right discomfort.</strong> Temporary: saying no, taking the walk, stopping when satisfied. Long-term: weight gain, inflammation, brain fog, frustration. Every woman chooses discomfort. One percenters choose the kind that creates growth.</li>
  <li><strong>What interrupts progress is usually patterns, not calories.</strong> Mindless eating, stress eating, reward eating, nighttime eating. Awareness is the unlock.</li>
  <li><strong>Track wins, not only misses.</strong> Your brain is a scoreboard. If you only count failures, motivation dies. Celebrate protein, fiber, walks, water, delayed cravings, kept promises.</li>
</ul>

<h2>Three things to start today</h2>
<ol>
  <li><strong>Ask better questions.</strong> Instead of “Why can’t I lose weight?” ask “What is interrupting my progress?” or “What would the woman I’m becoming do next?”</li>
  <li><strong>Create a daily victory list.</strong> Every night, write three things you did well — not what to fix. Train your brain to see success.</li>
  <li><strong>Practice one pause.</strong> When a craving hits, take one breath. Ask: “Who is driving? Future me or craving me?” That one question can change everything.</li>
</ol>

<h2>Chapters</h2>
<ul>
  <li><strong>Menopause belly mystery</strong> — scale stuck, jeans tight, cravings loud</li>
  <li><strong>Your body follows patterns</strong> — the autopilot route metaphor</li>
  <li><strong>Hormones shift after 40</strong> — why every pattern matters more now</li>
  <li><strong>Become a one percenter</strong> — keep promises; build identity evidence</li>
  <li><strong>Future you vs craving you</strong> — who gets the keys?</li>
  <li><strong>Choose the right discomfort</strong> — temporary stretch vs long-term stuck</li>
  <li><strong>Spot the patterns</strong> — beyond calorie counting</li>
  <li><strong>Track wins, build identity</strong> — change the scoreboard</li>
  <li><strong>Three steps + clarity call</strong> — start today, stop guessing</li>
</ul>

<h2>Related resources</h2>
<ul>
  <li><a href="/health-wellness-blog/patterns-not-the-belly-unlocking-weight-loss-success-after-40">Blog: Patterns, Not the Belly — full article</a></li>
  <li><a href="/insulin-resistance-after-40">Insulin resistance after 40</a></li>
  <li><a href="/habit-tracker">Free habit tracker</a> — keep score of wins</li>
  <li><a href="/snack-hack">Free Snack Hack guide</a></li>
  <li><a href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works">How to stop sugar cravings at night</a></li>
  <li><a href="/midlife-health-podcast/beyond-the-scale-building-new-weight-loss-patterns">Related episode: Beyond the Scale</a></li>
  <li><a href="/midlife-health-podcast/breaking-the-cycle-habits-not-plans">Related episode: Habits, Not Plans</a></li>
</ul>

<p><strong>This week:</strong> Notice your wins. Keep one promise to yourself. Ask “Who is driving?” You are not failing — you are practicing. Every choice is a vote for the woman you are becoming.</p>

<p><strong>Next step:</strong> If you know what to do but struggle to do it consistently, <a href="/book">book a free clarity call</a>. We’ll identify what’s interrupting your progress and build a simple plan for your body after 40. You don’t need more restriction — you need better patterns. Consistency beats perfection.</p>

<p><em>For education and coaching context only — not medical advice.</em></p>
`.trim();

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: podcastEpisodes.id })
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.videoId, videoId))
    .limit(1);

  const values = {
    videoId,
    slug,
    title,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt: new Date("2026-07-28T16:00:00+00:00"),
    youtubeDescription:
      "Where did this menopause belly come from? What if it’s a symptom of autopilot patterns — not a broken body? Become a one percenter: future you vs craving you, the right discomfort, and a victory scoreboard after 40.",
    showNotesHtml,
    transcript: null as string | null,
    seoTitle: "Patterns Not the Belly | Menopause Weight Loss Podcast",
    seoDescription:
      "Show notes: menopause belly as a pattern symptom, one-percenter habits, future you vs craving you, and three steps to rewrite weight-loss patterns after 40.",
    status: "published" as const,
  };

  if (existing) {
    await db
      .update(podcastEpisodes)
      .set(values)
      .where(eq(podcastEpisodes.id, existing.id));
    console.log("Updated episode", slug, "id=", existing.id);
  } else {
    await db.insert(podcastEpisodes).values(values);
    console.log("Inserted episode", slug);
  }

  console.log(
    `https://mindandbodyresetcoach.com/midlife-health-podcast/${slug}`
  );
  console.log(`https://youtu.be/${videoId}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
