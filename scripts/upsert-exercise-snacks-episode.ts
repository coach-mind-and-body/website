import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { podcastEpisodes } from "../drizzle/schema";

/** July 10, 2026 — Exercise snacks / tiny movements (full transcript) */
const videoId = "GXiY8p1iuz8";
const slug = "exercise-snacks-2-minute-movement-habit";
const title =
  "Exercise Snacks: The 2-Minute Movement Habit to Curb Cravings After 40";

const showNotesHtml = `
<p>Have you ever opened the fridge, stared inside, closed it… then opened it again 30 seconds later like new food might magically appear? Or hit 2:37 p.m. and thought “I need a snack” when you weren’t actually starving?</p>
<p>In this episode, Lee Anne shares one of the simplest health habits she’s seen: the <strong>exercise snack</strong> — tiny bursts of movement that might be what your body is asking for when you think you need pretzels, trail mix, or a cookie. Stay with her. This one can change how you look at the pantry.</p>

<h2>Key takeaways</h2>
<ul>
  <li><strong>Most snack runs aren’t true hunger.</strong> Boredom, stress, procrastination, overwhelm, fatigue, irritation, and scroll eating often drive the kitchen trip.</li>
  <li><strong>Social media and snacks become best friends.</strong> Five minutes of scrolling can turn into 45 minutes of dog videos and trail mix straight from the bag.</li>
  <li><strong>We’ve trained ourselves like a toddler with cookies.</strong> Restless? Cookie. Sad? Cookie. Tired? Cookie. Discomfort gets fed instead of moved through.</li>
  <li><strong>Some cravings are movement signals.</strong> Circulation, oxygen, and energy can feel like hunger when you’ve been sitting too long. Your body wasn’t designed for eight hours in a chair.</li>
  <li><strong>Movement is like charging a phone at 10%.</strong> You wouldn’t feed the phone a cookie — you’d plug it in. Food often masks fatigue; movement often fixes it.</li>
  <li><strong>Exercise snacks are ridiculously simple.</strong> Not workouts. Not gym sessions. Movement: 10 squats, 20 calf raises (even while brushing your teeth), walking on a phone call, stairs, marching in place while coffee brews, a loop around the building — two or three minutes.</li>
  <li><strong>Beat the 3 p.m. slump with stairs or squats before the vending machine.</strong> It might feel weird. It works.</li>
  <li><strong>After 40, this matters more.</strong> Movement supports blood sugar and insulin sensitivity, brain function, mood, muscle preservation, circulation, and energy — collected all day long, not earned in a perfect hour-long workout.</li>
  <li><strong>Identity shift:</strong> stop “I’m not an exerciser.” Become <em>someone who moves</em> — stairs, farther parking, walking while talking, squats while dinner cooks.</li>
</ul>

<h2>Three simple tips</h2>
<ol>
  <li><strong>Before a snack, ask:</strong> “Am I hungry, or do I need movement?” Take a two-minute walk first, then decide.</li>
  <li><strong>Create three daily exercise snacks</strong> — morning, afternoon, evening. Three tiny movement moments. That’s it.</li>
  <li><strong>Keep score.</strong> At the end of the day: “How many movement snacks did I take?” Not calories burned — movement moments completed.</li>
</ol>

<h2>This week’s challenge</h2>
<p>Before reaching for a snack, take an exercise snack first: walk, squat, stretch, calf raises, jumping jacks, dance — move. Then decide what you need. Your body isn’t asking for perfection. She’s asking for movement. Let’s give her more of it.</p>

<h2>Chapters</h2>
<ul>
  <li><strong>Why we snack</strong> — fridge stare, boredom, scroll eating, cookie-trained cravings</li>
  <li><strong>Cravings as signals</strong> — movement vs hunger; recharge like a phone</li>
  <li><strong>What is an exercise snack?</strong> — two–three minutes, real-life examples</li>
  <li><strong>Beat the afternoon slump</strong> — stairs before the vending machine</li>
  <li><strong>Why it matters after 40</strong> — energy, mood, muscle, metabolic support</li>
  <li><strong>Become someone who moves</strong> — identity over force</li>
  <li><strong>Three tips + weekly challenge</strong> — ask, schedule three, keep score</li>
</ul>

<h2>Related resources</h2>
<ul>
  <li><a href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works">How to stop sugar cravings at night</a></li>
  <li><a href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom">How to calm food noise</a></li>
  <li><a href="/habit-tracker">Free habit tracker</a> — track movement moments</li>
  <li><a href="/snack-hack">Free Snack Hack guide</a></li>
  <li><a href="/insulin-resistance-after-40">Insulin resistance after 40</a></li>
</ul>

<p><strong>Next step:</strong> Want help creating simple habits that fit life after 40? <a href="/book">Book a free discovery call</a> — consistency beats perfection. Or start with the <a href="/food-quiz">free food &amp; mindset quiz</a>.</p>

<p><em>For education and coaching context only — not medical advice. Check with your clinician before starting new exercise if you have health conditions.</em></p>
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
    publishedAt: new Date("2026-07-10T16:00:13+00:00"),
    youtubeDescription:
      "Fridge stares, 2:37 p.m. snacks, scroll eating — what if your body wants an exercise snack, not another cookie? Tiny 2-minute moves after 40.",
    showNotesHtml,
    seoTitle: "Exercise Snacks: 2-Minute Moves vs Snack Cravings",
    seoDescription:
      "What is an exercise snack? Tiny 2–3 minute moves that beat the 3 p.m. slump, curb cravings, and help you become someone who moves after 40.",
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
    "https://mindandbodyresetcoach.com/midlife-health-podcast/exercise-snacks-2-minute-movement-habit"
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
