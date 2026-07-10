/**
 * Publish "What if you did an exercise snack instead?" blog post
 * aligned with YouTube: Could Tiny Movements Transform Your Energy Levels? (FLoXn9oZP8A)
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";

const slug = "what-if-you-did-an-exercise-snack-instead";

const title = "What If You Did an Exercise Snack Instead?";

const seoTitle = "Exercise Snack Instead of Snacking After 40";

const seoDescription =
  "What if your 2:37 p.m. craving is a movement craving? Learn exercise snacks — 2-minute moves that beat the afternoon slump, curb mindless snacking, and boost energy after 40.";

const excerpt =
  "Standing at the fridge again — is it hunger, or does your body want movement? Discover exercise snacks: tiny 2-minute bursts that can crush cravings and recharge energy after 40.";

const coverImage =
  "https://cdn.mindandbodyresetcoach.com/blog-images/what-if-you-did-an-exercise-snack-instead.jpg";

const schemaFaqJson = JSON.stringify([
  {
    question: "What is an exercise snack?",
    answer:
      "An exercise snack is a tiny burst of movement — about two to three minutes — woven into your day. Think 10 squats, 20 calf raises, stairs, marching in place, or a short walk. It is not a full workout; it is movement that fits real life.",
  },
  {
    question: "Can exercise snacks help with afternoon snack cravings?",
    answer:
      "Often yes. Many afternoon “I need a snack” moments are boredom, stress, fatigue, or a body asking for circulation — not true hunger. A two-minute walk or stairs can recharge energy better than the vending machine when food is not the real need.",
  },
  {
    question: "Why do exercise snacks matter more after 40?",
    answer:
      "Movement supports energy, mood, circulation, muscle preservation, and metabolic health. After 40, collecting small movement moments all day can matter more than waiting for a perfect hour-long workout that never happens.",
  },
  {
    question: "How many exercise snacks should I do per day?",
    answer:
      "Start with three: morning, afternoon, and evening. Before any snack, ask: “Am I hungry, or do I need movement?” Track movement moments completed — not calories burned.",
  },
]);

const schemaHowToStepsJson = JSON.stringify([
  {
    name: "Pause before the pantry",
    text: "When a craving hits, ask: Am I hungry, or do I need movement?",
  },
  {
    name: "Take a 2-minute exercise snack",
    text: "Walk, climb stairs, do 10 squats, calf raises, march in place, or dance for two to three minutes.",
  },
  {
    name: "Then decide what you need",
    text: "After moving, reassess. Eat if you are truly hungry — without shame. Notice how often the urge softens.",
  },
  {
    name: "Schedule three daily movement moments",
    text: "Plan a morning, afternoon, and evening exercise snack so movement becomes identity, not willpower.",
  },
]);

const content = `
<p>Have you ever found yourself standing in front of the fridge, hoping a new snack would magically appear? Or at <strong>2:37 p.m.</strong>, convinced you need something crunchy or sweet — only to wonder if it is truly hunger?</p>
<p><strong>What if, instead of needing food, your body is craving movement?</strong></p>
<p>Enter the <strong>exercise snack</strong> — one of the simplest midlife habits that can deliver more energy, less brain fog, steadier blood sugar, fewer mindless cravings, and a body that feels alive again. (This pairs with our podcast episode <a href="/midlife-health-podcast/could-tiny-movements-transform-your-energy-levels"><em>Could Tiny Movements Transform Your Energy Levels?</em></a>.)</p>
<p><em>Coaching education only — not medical advice. Check with your clinician before starting new exercise if you have health conditions.</em></p>

<h2>Why we snack (hint: it is often not hunger)</h2>
<p>Let us be honest. Most of us do not hunt snacks because we are starving. We go looking because we are:</p>
<ul>
  <li>Bored</li>
  <li>Procrastinating</li>
  <li>Stressed or overwhelmed</li>
  <li>Avoiding a task</li>
  <li>Tired or irritated</li>
  <li>Scrolling social media — and suddenly “needing” pretzels</li>
</ul>
<p>Somehow Facebook (or Instagram, or dog videos) and snacks became best friends. You sit down for five minutes… forty-five minutes later you are still scrolling and eating trail mix from the bag. How did we get there?</p>

<h2>Cookie-trained cravings</h2>
<p>Imagine treating your body like a toddler who gets a cookie every time they are restless. Soon that toddler expects cookies for everything: bored, sad, tired, need stimulation — cookie.</p>
<p>Many of us have trained ourselves the same way. The minute we feel discomfort, we feed it. But what if there is another option?</p>

<h2>What if it is a movement craving?</h2>
<p>The next time you feel a craving, pause and ask: <strong>Is this hunger — or a movement craving?</strong></p>
<p>Sometimes what the body needs is circulation, oxygen, and a nervous-system reset — not calories. Your body was not designed for eight hours of sitting. When it does not move, it sends signals. The problem? We often read those signals as hunger.</p>
<p>Think of movement like charging your phone at 10%. You would not feed the phone a cookie. You would plug it in. A quick walk, a flight of stairs, or ten squats can recharge energy in ways food cannot — because sometimes food is not the real answer.</p>

<h2>What is an exercise snack?</h2>
<p>Exercise snacks are <strong>tiny bursts of movement</strong> throughout the day. Not workouts. Not gym sessions. Movement.</p>
<p>Examples:</p>
<ul>
  <li>10 squats</li>
  <li>20 calf raises (even while brushing your teeth)</li>
  <li>Walking while on a phone call</li>
  <li>A flight of stairs</li>
  <li>Marching in place while coffee brews</li>
  <li>A loop around the building</li>
  <li>A silly two-minute dance</li>
</ul>
<p><strong>Two minutes. Maybe three. That is it.</strong></p>

<h2>Beat the afternoon slump</h2>
<p>Picture 3:00 p.m. at work. Energy drops. Most people head for the vending machine.</p>
<p>What if instead you walked the stairs for two minutes, stepped outside, or did ten squats?</p>
<p>Would it feel weird? Maybe. Would it work? Often, yes — because <strong>movement creates energy</strong>. Food often <em>masks</em> fatigue. Movement often <em>fixes</em> it.</p>
<p>If nighttime sugar is your battle more than the afternoon, you may also like <a href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works">how to stop sugar cravings at night</a> and our free <a href="/snack-hack">Snack Hack guide</a>.</p>

<h2>Why this matters even more after 40</h2>
<p>After 40, movement supports more than “fitness.” It helps with:</p>
<ul>
  <li>Energy and brain fog</li>
  <li>Mood and stress</li>
  <li>Circulation</li>
  <li>Muscle preservation</li>
  <li>Blood sugar and insulin sensitivity (as part of a bigger midlife picture — see <a href="/insulin-resistance-after-40">insulin resistance after 40</a>)</li>
</ul>
<p>The beautiful part: you do not have to earn these benefits with a perfect hour-long workout. You can collect them all day long — one movement snack at a time.</p>

<h2>Become someone who moves</h2>
<p>This is where many women get stuck. They think, “I am not an exerciser.”</p>
<p>What if your identity became: <strong>“I am someone who moves”</strong>?</p>
<p>Big difference. Someone who moves takes the stairs, parks farther away, walks while talking, does squats while dinner cooks. Movement becomes who she is — not something she has to force on a perfect Monday.</p>

<h2>Three simple tips</h2>
<ol>
  <li><strong>Before a snack, ask:</strong> “Am I hungry, or do I need movement?” Take a two-minute walk first, then decide.</li>
  <li><strong>Create three daily exercise snacks</strong> — morning, afternoon, and evening. Three tiny moments. That is enough to start.</li>
  <li><strong>Keep score.</strong> At the end of the day ask: “How many movement snacks did I take?” Not calories burned — <em>movement moments completed</em>.</li>
</ol>
<p>Imagine if every time you wanted a snack, you moved first. How much more energy would you have? How many cravings would soften? Because maybe the answer is not always food. Maybe sometimes the answer is movement.</p>
<p>Track those wins in our free <a href="/habit-tracker">habit tracker</a> if you like a simple scoreboard.</p>

<h2>Try it this week</h2>
<p>One commitment: <strong>before reaching for a snack, take an exercise snack.</strong> Walk, squat, stretch, calf raises, jumping jacks, dance — move. Then decide what you need.</p>
<p>Your body is not asking for perfection. She is asking for movement. Let us give her more of it.</p>

<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Watch the episode</p>
  <p style="margin:0;">Prefer to listen? <a href="/midlife-health-podcast/could-tiny-movements-transform-your-energy-levels">Could Tiny Movements Transform Your Energy Levels?</a> — full show notes and video on the podcast page.</p>
</div>

<h2>Next steps</h2>
<p>If you want help building simple habits that fit life after 40, <a href="/book">book a free discovery call</a>. Consistency beats perfection — every time.</p>
<p>You can also start with the <a href="/food-quiz">free food &amp; mindset quiz</a> or explore <a href="/reclaim">R.E.C.L.A.I.M. coaching</a> when you are ready for deeper support.</p>
`.trim();

async function main() {
  const db = await getDb();
  if (!db) throw new Error("No database connection");

  const [existing] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  const values = {
    slug,
    title,
    excerpt,
    content,
    category: "Mindful Eating & Nutrition",
    coverImage,
    coverImageAlt:
      "Woman choosing movement and energy over mindless snacking in midlife",
    published: true,
    publishedAt: new Date(),
    seoTitle,
    seoDescription,
    schemaTypes: "Article,FAQ,HowTo,VideoObject",
    schemaFaqJson,
    schemaHowToStepsJson,
    schemaVideoUrl: "https://www.youtube.com/watch?v=FLoXn9oZP8A",
    schemaVideoDescription:
      "Could Tiny Movements Transform Your Energy Levels? Exercise snacks — the 2-minute habit that can crush cravings and boost energy after 40.",
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
