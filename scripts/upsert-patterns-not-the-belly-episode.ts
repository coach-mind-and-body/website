/**
 * Upsert show notes for Menopause Belly / Patterns Not the Belly episode
 * YouTube: https://www.youtube.com/watch?v=HKDt7qWLv3g
 */
import "dotenv/config";
import { eq, or } from "drizzle-orm";
import { getDb } from "../server/db";
import { podcastEpisodes } from "../drizzle/schema";

const videoId = "HKDt7qWLv3g";
const slug = "why-am-i-gaining-weight-after-40-even-when-i-eat-less";
// Align with blog question title (search-friendly)
const title = "Why Am I Gaining Weight After 40 Even When I Eat Less?";

const blogSlug = "why-am-i-gaining-weight-after-40-even-when-i-eat-less";

const showNotesHtml = `
<p>Oh my heck — where did this belly come from? You’re eating less, exercising more, and trying harder than ever… yet the scale won’t move, your jeans feel tighter, and nighttime cravings feel stronger than willpower.</p>
<p>In this episode, Lee Anne asks a better question: <strong>what if the menopause belly isn’t the problem?</strong> What if it’s a <em>symptom</em> of patterns your brain is running on autopilot?</p>
<p>You’ll hear why some women keep gaining after 40 while others become what she calls <strong>the one percenters</strong> — not because of better genetics or more willpower, but because they learn how to build new patterns. Mindset shifts, a simple framework, and daily habits that help reduce cravings, support insulin resistance, and put you back in control of your body.</p>
<p>If you’re tired of fighting your body, this episode might change how you see weight loss after 40.</p>

<h2>Key takeaways</h2>
<ul>
  <li><strong>The menopause belly is often a symptom, not the root problem.</strong> Your body isn’t broken — she’s responding to patterns. The belly that seems to appear overnight and laugh at old diet tricks is feedback, not a life sentence.</li>
  <li><strong>Weight gain runs on autopilot routes.</strong> Same turns, same roads: a handful of crackers while cooking dinner, nightly chocolate, stress eating after a hard day, the weekend reward, the “I’ll start Monday” cycle. Eventually those patterns become the default route.</li>
  <li><strong>After 40, every pattern matters more.</strong> Hormones shift. Estrogen changes. Insulin becomes more dominant. Small defaults get louder than they did at 25 — but your body is still listening. She just needs better instructions.</li>
  <li><strong>One percenters keep promises to themselves.</strong> Not income. Not status. Behavior. They don’t wait for motivation. They do what they said they would do when nobody is watching — especially then. That evidence becomes identity: “I am someone who follows through.”</li>
  <li><strong>Ask: “Who is driving — future you or craving you?”</strong> Future you wants energy, confidence, hikes, travel, grandkids. Craving you wants chocolate at 9 p.m. and relief. Neither is bad — but somebody gets the keys.</li>
  <li><strong>Choose the right discomfort.</strong> Temporary: saying no to the snack, taking the walk, stopping when you’re satisfied. Long-term: weight gain, inflammation, brain fog, frustration. Every woman chooses discomfort. One percenters choose the kind that creates growth.</li>
  <li><strong>What interrupts progress is usually patterns, not calories.</strong> Mindless eating, stress eating, reward eating, nighttime eating. Awareness is the unlock: “What’s interrupting my progress? Where am I giving away my power?”</li>
  <li><strong>Track wins, not only misses.</strong> Your brain is a scoreboard. If you only count failures, motivation dies. Celebrate protein, fiber, walks, water, delayed cravings, kept promises — and identity starts to shift.</li>
</ul>

<h2>Three things to start today</h2>
<ol>
  <li><strong>Ask better questions.</strong> Instead of “Why can’t I lose weight?” ask “What is interrupting my progress?” or “What would the woman I’m becoming do next?” Questions direct your brain — use them wisely.</li>
  <li><strong>Create a daily victory list.</strong> Every night, write three things you did well — not what to fix. Train your brain to see success.</li>
  <li><strong>Practice one pause.</strong> When a craving hits, take one breath. Ask: “Who is driving? Future me or craving me?” That one question can change everything.</li>
</ol>

<h2>This week’s challenge</h2>
<p>Notice your wins. Keep one promise to yourself. Ask “Who is driving?” You are not failing — you are practicing. Every choice is a vote for the woman you are becoming. The menopause belly isn’t the problem. The pattern is — and patterns can change.</p>

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
  <li><a href="/health-wellness-blog/${blogSlug}">Blog: Why Am I Gaining Weight After 40 Even When I Eat Less?</a></li>
  <li><a href="/insulin-resistance-after-40">Insulin resistance after 40</a></li>
  <li><a href="/habit-tracker">Free habit tracker</a> — keep score of wins</li>
  <li><a href="/snack-hack">Free Snack Hack guide</a></li>
  <li><a href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works">How to stop sugar cravings at night</a></li>
  <li><a href="/midlife-health-podcast/beyond-the-scale-building-new-weight-loss-patterns">Related episode: Beyond the Scale</a></li>
  <li><a href="/midlife-health-podcast/breaking-the-cycle-habits-not-plans">Related episode: Habits, Not Plans</a></li>
</ul>

<p><strong>Next step:</strong> If you know what to do but struggle to do it consistently, <a href="/book">book a free clarity call</a>. We’ll identify what’s interrupting your progress and build a simple plan for your body after 40. You don’t need more restriction — you need better patterns. Consistency beats perfection.</p>

<p><em>For education and coaching context only — not medical advice.</em></p>
`.trim();

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  // Match by new videoId, old wrong videoId, or slug so we update the right row
  const [existing] = await db
    .select({ id: podcastEpisodes.id, videoId: podcastEpisodes.videoId })
    .from(podcastEpisodes)
    .where(
      or(
        eq(podcastEpisodes.videoId, videoId),
        eq(podcastEpisodes.videoId, "5Lnsf3gQLUc"),
        eq(podcastEpisodes.slug, slug),
        eq(
          podcastEpisodes.slug,
          "patterns-not-the-belly-weight-loss-after-40"
        )
      )
    )
    .limit(1);

  const values = {
    videoId,
    slug,
    title,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt: new Date("2026-08-07T16:00:00+00:00"),
    youtubeDescription:
      "Why am I gaining weight after 40 even when I eat less? What if the menopause belly is a symptom of autopilot patterns — not a broken body? Become a one percenter: future you vs craving you, the right discomfort, and a victory scoreboard.",
    showNotesHtml,
    transcript: null as string | null,
    seoTitle: "Why Am I Gaining Weight After 40? | Podcast Show Notes",
    seoDescription:
      "Show notes: why weight climbs after 40 even when you eat less — menopause belly as a pattern symptom, one-percenters, future you vs craving you, and three steps to start today.",
    status: "published" as const,
  };

  if (existing) {
    await db
      .update(podcastEpisodes)
      .set(values)
      .where(eq(podcastEpisodes.id, existing.id));
    console.log(
      "Updated episode",
      slug,
      "id=",
      existing.id,
      "oldVideo=",
      existing.videoId,
      "->",
      videoId
    );
  } else {
    await db.insert(podcastEpisodes).values(values);
    console.log("Inserted episode", slug);
  }

  console.log(
    `https://mindandbodyresetcoach.com/midlife-health-podcast/${slug}`
  );
  console.log(`https://www.youtube.com/watch?v=${videoId}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
