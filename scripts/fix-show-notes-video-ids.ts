/**
 * Correct show-notes videoId mismatches (RSS field-order bug when seeding).
 * Tiny Movements / Exercise Snacks = FLoXn9oZP8A (2026-07-10)
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { podcastEpisodes } from "../drizzle/schema";

const showNotesHtml = `
<p>Have you ever opened the fridge, stared inside, closed it… then opened it again 30 seconds later like new food might magically appear? Or hit 2:37 p.m. and thought “I need a snack” when you weren’t actually starving?</p>
<p>In this episode — <strong>Could Tiny Movements Transform Your Energy Levels?</strong> — Lee Anne shares one of the simplest health habits she’s seen: the <strong>exercise snack</strong> — tiny bursts of movement that might be what your body is asking for when you think you need pretzels, trail mix, or a cookie.</p>

<h2>Key takeaways</h2>
<ul>
  <li><strong>Most snack runs aren’t true hunger.</strong> Boredom, stress, procrastination, overwhelm, fatigue, irritation, and scroll eating often drive the kitchen trip.</li>
  <li><strong>Social media and snacks become best friends.</strong> Five minutes of scrolling can turn into 45 minutes of dog videos and trail mix straight from the bag.</li>
  <li><strong>We’ve trained ourselves like a toddler with cookies.</strong> Restless? Cookie. Sad? Cookie. Tired? Cookie. Discomfort gets fed instead of moved through.</li>
  <li><strong>Some cravings are movement signals.</strong> Circulation, oxygen, and energy can feel like hunger when you’ve been sitting too long.</li>
  <li><strong>Movement is like charging a phone at 10%.</strong> You wouldn’t feed the phone a cookie — you’d plug it in. Food often masks fatigue; movement often fixes it.</li>
  <li><strong>Exercise snacks are ridiculously simple.</strong> Not workouts — 10 squats, 20 calf raises, walk on a call, stairs, march while coffee brews — two or three minutes.</li>
  <li><strong>Beat the 3 p.m. slump</strong> with stairs or squats before the vending machine.</li>
  <li><strong>After 40, this matters more</strong> for energy, mood, muscle, circulation, and metabolic support — collected all day, not only in a perfect hour-long workout.</li>
  <li><strong>Identity:</strong> become <em>someone who moves</em>, not “I’m not an exerciser.”</li>
</ul>

<h2>Three simple tips</h2>
<ol>
  <li><strong>Before a snack, ask:</strong> “Am I hungry, or do I need movement?” Take a two-minute walk first, then decide.</li>
  <li><strong>Create three daily exercise snacks</strong> — morning, afternoon, evening.</li>
  <li><strong>Keep score.</strong> “How many movement snacks did I take?” — not calories burned.</li>
</ol>

<h2>This week’s challenge</h2>
<p>Before reaching for a snack, take an exercise snack first: walk, squat, stretch, calf raises, jumping jacks, dance — move. Then decide what you need. Your body isn’t asking for perfection. She’s asking for movement.</p>

<h2>Related resources</h2>
<ul>
  <li><a href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works">How to stop sugar cravings at night</a></li>
  <li><a href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom">How to calm food noise</a></li>
  <li><a href="/habit-tracker">Free habit tracker</a></li>
  <li><a href="/snack-hack">Free Snack Hack guide</a></li>
</ul>

<p><strong>Next step:</strong> Want help creating simple habits after 40? <a href="/book">Book a free discovery call</a> — consistency beats perfection. Or take the <a href="/food-quiz">free food &amp; mindset quiz</a>.</p>

<p><em>For education and coaching context only — not medical advice. Check with your clinician before starting new exercise if you have health conditions.</em></p>
`.trim();

/** Correct YouTube video IDs (verified via oembed) */
const CORRECT: Array<{
  videoId: string;
  slug: string;
  title: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  showNotesHtml?: string;
}> = [
  {
    videoId: "FLoXn9oZP8A",
    slug: "could-tiny-movements-transform-your-energy-levels",
    title: "Could Tiny Movements Transform Your Energy Levels?",
    publishedAt: "2026-07-10T16:00:13+00:00",
    seoTitle: "Exercise Snacks: Tiny Movements After 40 | Show Notes",
    seoDescription:
      "Could tiny movements transform your energy? Exercise snacks — 2-minute habits that crush cravings and boost energy after 40.",
    showNotesHtml,
  },
  {
    videoId: "GXiY8p1iuz8",
    slug: "why-your-brain-resists-change",
    title: "Why Does Your Brain Resist Change Even When You Want to Transform?",
    publishedAt: "2026-06-29T19:59:05+00:00",
    seoTitle: "Why Your Brain Resists Change | Podcast Show Notes",
    seoDescription:
      "Why your brain resists change even when you want transformation — and how to work with your wiring in midlife health.",
  },
  {
    videoId: "LDL5KJvEuoE",
    slug: "beyond-the-scale-building-new-weight-loss-patterns",
    title: "Beyond the Scale: Building New Weight Loss Patterns",
    publishedAt: "2026-06-12T16:55:01+00:00",
    seoTitle: "Beyond the Scale: New Weight Loss Patterns | Show Notes",
    seoDescription:
      "Building weight-loss patterns that last — identity, habits, and midlife reality beyond the scale.",
  },
  {
    videoId: "rK9ePYUX2TU",
    slug: "navigating-midlife-changes-hormones-weight",
    title: "Navigating Midlife Changes: Hormones, Weight, and New Beginnings",
    publishedAt: "2026-06-12T16:53:53+00:00",
    seoTitle: "Midlife Hormones, Weight & New Beginnings | Show Notes",
    seoDescription:
      "Hormones, weight, and midlife transitions — navigate change without shame or another crash diet.",
  },
  {
    videoId: "gZ9azorTTJU",
    slug: "fuel-fat-loss-over-40-balance-insulin",
    title: "Fuel Fat Loss Over 40: Balance Insulin and Boost Energy",
    publishedAt: "2026-06-05T17:41:48+00:00",
    seoTitle: "Balance Insulin & Energy After 40 | Podcast Show Notes",
    seoDescription:
      "How insulin balance, energy, and midlife habits connect — without another crash diet.",
  },
  {
    videoId: "TmOsGg7hzXk",
    slug: "reclaim-rewire-reset-transform-identity",
    title: "Reclaim, Rewire, Reset: Transform Your Identity, Transform Your Weight",
    publishedAt: "2026-06-05T17:36:44+00:00",
    seoTitle: "Reclaim, Rewire, Reset Identity Work | Show Notes",
    seoDescription:
      "Identity-level change: reclaim, rewire, reset — how who you believe you are shapes midlife health habits.",
  },
  {
    videoId: "AG2Wy57bozk",
    slug: "overcoming-nighttime-sugar-battles",
    title: "Overcoming Nighttime Sugar Battles: A New Approach",
    publishedAt: "2026-05-01T14:00:15+00:00",
    seoTitle: "Nighttime Sugar Battles in Midlife | Podcast Show Notes",
    seoDescription:
      "Why nighttime sugar battles intensify after 40 and a midlife approach that reduces the mental fight.",
  },
  {
    videoId: "-lkhOm9WsoQ",
    slug: "breaking-the-cycle-habits-not-plans",
    title: "Breaking the Cycle: Focus on Habits, Not Plans",
    publishedAt: "2026-04-17T22:28:40+00:00",
    seoTitle: "Habits Not Plans: Break the Diet Cycle | Show Notes",
    seoDescription:
      "Breaking the start-over cycle by focusing on habits instead of rigid diet plans.",
  },
  {
    videoId: "gWHx3roujsA",
    slug: "bridging-the-divide-body-journey-to-peace",
    title: "Bridging the Divide: Your Body’s Journey to Peace",
    publishedAt: "2026-04-03T14:01:07+00:00",
    seoTitle: "Body’s Journey to Peace | Podcast Show Notes",
    seoDescription:
      "Stop living in the weight-loss gap — two paths to peace with your body in midlife.",
  },
  {
    videoId: "TNAsEkNpBRU",
    slug: "fuel-system-reset-sugar-to-fat-burn",
    title: "Unlocking Your Body's Fuel System: The Switch from Sugar to Fat Burn",
    publishedAt: "2026-03-27T21:50:37+00:00",
    seoTitle: "Sugar-to-Fat Fuel System Reset | Podcast Show Notes",
    seoDescription:
      "Metabolic fuel flexibility — understanding the switch from sugar burning to fat burning in midlife.",
  },
];

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  // Wipe incorrect rows and re-seed cleanly
  for (const row of await db.select({ id: podcastEpisodes.id }).from(podcastEpisodes)) {
    await db.delete(podcastEpisodes).where(eq(podcastEpisodes.id, row.id));
  }
  console.log("Cleared old episode rows");

  for (const ep of CORRECT) {
    // Keep existing notes HTML if we had content for that slug before, except tiny movements uses full notes
    let notes = ep.showNotesHtml;
    if (!notes) {
      notes = `
<p>Show notes for <strong>${ep.title}</strong>.</p>
<p>Watch the full episode below, then explore related resources for midlife health, food freedom, and lasting habits.</p>
<ul>
  <li><a href="/reclaim">R.E.C.L.A.I.M. coaching</a></li>
  <li><a href="/book">Book a free discovery call</a></li>
  <li><a href="/food-quiz">Free food &amp; mindset quiz</a></li>
  <li><a href="/midlife-health-podcast">All podcast episodes</a></li>
</ul>
<p><em>For education and coaching context only — not medical advice.</em></p>
`.trim();
    }

    await db.insert(podcastEpisodes).values({
      videoId: ep.videoId,
      slug: ep.slug,
      title: ep.title,
      thumbnail: `https://i.ytimg.com/vi/${ep.videoId}/hqdefault.jpg`,
      publishedAt: new Date(ep.publishedAt),
      showNotesHtml: notes,
      seoTitle: ep.seoTitle,
      seoDescription: ep.seoDescription,
      status: "published",
    });
    console.log("OK", ep.videoId, ep.slug);
  }

  console.log("\nTiny Movements page:");
  console.log(
    "https://mindandbodyresetcoach.com/midlife-health-podcast/could-tiny-movements-transform-your-energy-levels"
  );
  console.log("YouTube: https://www.youtube.com/watch?v=FLoXn9oZP8A");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
