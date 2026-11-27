/**
 * Upsert the Beyond the Shot blog post and podcast episode.
 *
 * Slug (both): glp-1-food-noise-dont-waste-the-quiet
 * YouTube:     https://youtu.be/onY9gVUaPPE
 * Title:       On a GLP-1 and Not Craving Anything? Do This Now
 * Published:   2026-11-27T15:46:26Z
 *
 * RUNNING THIS WRITES TO WHATEVER DATABASE_URL POINTS AT, AND IT PUBLISHES.
 * Both rows are set live (blog published=true, episode status=published).
 * Railway does not run this on deploy. Run it once, by hand, from a checkout
 * of this branch, with production DATABASE_URL and R2 credentials.
 *
 *   pnpm exec tsx scripts/upsert-beyond-the-shot.ts
 *
 * Required env:
 *   DATABASE_URL
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_ENDPOINT
 * Optional env (use the production values so image URLs match the live site):
 *   R2_BUCKET_NAME   default mindbodyreset-assets
 *   R2_PUBLIC_URL    default is the r2.dev host in server/_core/env.ts
 *
 * Idempotent. Episode lookup is videoId onY9gVUaPPE, or slug
 * glp-1-food-noise-dont-waste-the-quiet, or the poller slug
 * on-a-glp-1-and-not-craving-anything-do-this-now. A poller draft for this
 * video is updated in place, including its slug. A different video that
 * already owns the SEO slug stops the script. This file does not call
 * getDb(), so it does not run the schema-ensure helpers.
 *
 * No Apple, Spotify, or Podbean URLs are written. Those columns do not
 * exist on podcast_episodes; platform links are matched later by title.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { blogPosts, podcastEpisodes } from "../drizzle/schema";
import { storagePut } from "../server/storage";
import { ENV } from "../server/_core/env";

const SLUG = "glp-1-food-noise-dont-waste-the-quiet";
const POLLER_SLUG = "on-a-glp-1-and-not-craving-anything-do-this-now";
const VIDEO_ID = "onY9gVUaPPE";
const PUBLISHED_AT = new Date("2026-11-27T15:46:26.000Z");
const YOUTUBE_WATCH = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const THUMBNAIL = `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const SITE = "https://mindandbodyresetcoach.com";

const BLOG_TITLE = "Beyond the Shot: What to Do While GLP-1 Food Noise Is Quiet";
const BLOG_SEO_TITLE = "GLP-1 and Food Noise: What to Do While It's Quiet";
const BLOG_SEO_DESCRIPTION =
  "Food noise went quiet on a GLP-1? Three areas to work on now and a one-skill challenge for the week. Coaching education, not medical advice.";
const BLOG_EXCERPT =
  "On a GLP-1, the food noise can go quiet. Lee Anne's three areas to work on while it does: protect the body you're building, notice what food used to do for you, and rewire the story.";
const COVER_ALT =
  "A woman in a sage linen shirt stands at a wooden kitchen counter in warm evening light, hands resting on the wood, taking a slow breath";
const VOLUME_ALT =
  "A hand turns the dial down on a small wooden radio in a sunny living room";
const STRONG_ALT =
  "A woman in a cream cardigan carries a canvas tote of groceries on her porch steps in warm afternoon light";

const EPISODE_TITLE = "On a GLP-1 and Not Craving Anything? Do This Now";
const EPISODE_SEO_TITLE = "Podcast: Beyond the Shot \u2013 Food Noise on a GLP-1";
const EPISODE_SEO_DESCRIPTION =
  "Lee Anne on using the quiet: protect the body you're building, notice what food used to do for you, and rewire the story. One skill this week.";

const assetDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "assets",
  SLUG
);

const schemaFaqJson = JSON.stringify([
  {
    question: "What is food noise?",
    answer:
      "Food noise isn't necessarily hunger. It's mental chatter: 'What am I going to eat? Should I eat this? I'll start again.'",
  },
  {
    question: "Should I wait to build habits until I come off a GLP-1?",
    answer:
      "Lee Anne says no: practice them now and use the quiet. She is a life and health coach, not a prescribing healthcare professional, and decisions about medication belong between you and your healthcare professional.",
  },
  {
    question: "Does 'beyond the shot' mean getting off medication?",
    answer:
      "No. It means your health is bigger than your medication. Strength, nutrition, thoughts, your relationship with food, stress, sleep, and habits all matter.",
  },
]);

const CHAPTERS: { at: string; seconds: number; label: string }[] = [
  { at: "00:00", seconds: 0, label: "Food Noise Goes Quiet" },
  { at: "00:45", seconds: 45, label: "Fear of Stopping" },
  { at: "01:04", seconds: 64, label: "Don't Waste the Quiet" },
  { at: "01:36", seconds: 96, label: "Welcome to Mind and Body Reset" },
  { at: "01:52", seconds: 112, label: "What Is Food Noise?" },
  { at: "03:24", seconds: 204, label: "The Dance Analogy" },
  { at: "04:19", seconds: 259, label: "Practice Habits Now" },
  { at: "05:13", seconds: 313, label: "Three Areas: Protect, Notice, Rewire" },
  { at: "06:50", seconds: 410, label: "Notice Emotional Triggers" },
  { at: "08:13", seconds: 493, label: "Rewire Your Identity" },
  { at: "09:25", seconds: 565, label: "Skills to Practice Daily" },
  { at: "10:36", seconds: 636, label: "The Fear of Regain" },
  { at: "12:07", seconds: 727, label: "Beyond the Shot Toolbox" },
  { at: "12:34", seconds: 754, label: "One Skill This Week" },
  { at: "13:26", seconds: 806, label: "Programs and Final Message" },
];

const habitActionsJson = JSON.stringify([
  {
    title: "What skill did I practice today?",
    type: "habit",
    description:
      "One skill. Ask in the morning what you will practice, and at night what you practiced. Then practice again tomorrow.",
  },
  {
    title: "Protect the body you're building",
    type: "habit",
    description:
      "Be intentional about protein and strength. Nourish better. The goal isn't punishment.",
  },
  {
    title: "Notice what food used to do for you",
    type: "habit",
    description:
      "Get curious instead of judging. What used to happen in the moment you reached for food?",
  },
  {
    title: "Rewire the story you tell yourself",
    type: "habit",
    description:
      "Notice an old line like \"I can't trust myself,\" and practice \"I am learning how to care for myself with support.\"",
  },
]);

function figure(src: string, alt: string): string {
  return `<figure style="margin:1.75rem 0;">
  <img src="${src}" alt="${alt}" style="width:100%;height:auto;border-radius:16px;display:block;" loading="lazy" />
</figure>`;
}

function buildBlogContent(volumeUrl: string, strongUrl: string): string {
  const episodeHref = `/midlife-health-podcast/${SLUG}`;
  return `
<p>Are you currently taking a GLP-1 medication, or wondering about one? If so, you may have noticed, or may be curious about, the quiet it can bring. As women share their stories, one recurring theme is what comes after: a quiet where the relentless "food noise" subsides. This quiet is not just a break from the exhausting mental chatter. It is an opportunity to work on your relationship with food and with yourself.</p>
<p>Welcome to Mind and Body Reset, where we talk about the opportunity in that quiet phase and how to bring new strategies and habits into your life while it lasts. Join me, LeeAnne, a certified health and life coach, as we explore how to use the quiet and build an empowering relationship with food and self.</p>
<p><em>Coaching education only \u2014 not medical advice. I'm a life and health coach, not your prescribing healthcare professional. Please don't stop, taper, increase, decrease, or otherwise change your medication based on a blog or a podcast. Those decisions belong between you and a healthcare professional managing your medication.</em></p>
<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Watch / listen to the episode</p>
  <p style="margin:0 0 0.75rem;">Prefer my voice? <a href="${episodeHref}">Beyond the Shot</a> is this week's podcast episode.</p>
  <p style="margin:0;"><a href="${YOUTUBE_WATCH}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p>
</div>
<h2>Turning Down the Music Isn't the Same as Learning a New Dance</h2>
<p>Imagine a life filled with chaotic, deafening music, a metaphor for the constant, distracting "food noise." Now, with the introduction of a GLP-1, the volume drops for some people. You suddenly have a newfound space to hear your own thoughts, to think clearly about your relationship with food. However, turning down the music isn't the same as learning a new dance.</p>
${figure(volumeUrl, VOLUME_ALT)}
<p>Here lies the opportunity: Use the quiet to learn new patterns, habits, and ways to interact with food and your emotions. With the noise turned down, this is your chance to become skilled at a new kind of dance, a dance of self-discovery and empowerment. If you want a fuller guide to that mental chatter, read <a href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom">how to calm food noise after 40</a>.</p>
<h2>Three Areas to Work On While the Food Noise Is Quiet</h2>
<h3>1. Protect the Body You're Building</h3>
<p>Shift your perspective on weight loss. It's not solely about seeing a smaller number on the scale. Instead, focus on what you're losing: are you maintaining your muscle mass while shedding fat? Embrace a mindset of nourishment, prioritizing protein and strength training. This is not about punishment but about building a body capable of supporting you through life's adventures.</p>
${figure(strongUrl, STRONG_ALT)}
<h3>2. Notice What Food Used to Do for You</h3>
<p>With the physical urge to eat reduced, take this moment to understand why you used to reach for food. Was it boredom, stress, or a reward? Unpacking these emotions allows you to find alternative ways to meet these needs, moving beyond food as a sole comfort source. If this is your loop, read <a href="/health-wellness-blog/how-to-stop-emotional-eating-after-40-without-shame">how to stop emotional eating after 40 without shame</a>.</p>
<h3>3. Rewire the Story You Tell Yourself</h3>
<p>As your physical appearance changes, your self-perception needs to come along too. Break free from old beliefs like "I've always struggled with my weight" and reframe your identity. With practice, start believing "I am learning to trust and care for myself," turning fear into capability.</p>
<h2>This Week's Challenge: Practice One Skill</h2>
<p>Every journey begins with a single step. This week, focus on just one skill to practice. Perhaps it's putting protein first, engaging in two strength workouts, or being mindful about evening snacking. Practice it, and then tomorrow practice again.</p>
<h2>Use the Quiet</h2>
<p>Don't let this quiet go to waste. Use it to practice, learn, and build a relationship with food that isn't rooted in fear. The skills matter whether you're taking a GLP-1 or not. Whether GLP-1 medication remains part of your long-term plan is a decision to make with your healthcare professional.</p>
<p>If you're worried about what happens if you ever stop, that concern is real. Research following people after GLP-1-based treatment has found significant weight regain after medications were withdrawn. In the step one extension, participants who discontinued semaglutide regained about two-thirds of their previous weight loss on average during the following year. That does not mean you failed. It does not prove you didn't have enough willpower. For some people, ongoing medication may be part of long-term treatment, and that is a conversation for your healthcare professional. Related: <a href="/health-wellness-blog/food-noise-after-stopping-ozempic-or-wegovy">food noise after stopping Ozempic or Wegovy</a>. You can also <a href="/health-wellness-blog/how-to-stop-starting-over-every-monday-after-40">stop starting over every Monday</a>.</p>
<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Want help with this part?</p>
  <p style="margin:0;">This is what we work on inside <a href="/reclaim-invite">Six Habits in Six Weeks</a>: practice over perfection. If you want deeper one-on-one support, the Rewire and Reset Method is my 12-week intensive for the habits, thoughts, and emotional triggers underneath your relationship with food. <a href="/book">Book a free clarity call</a>. More on this topic: <a href="/life-after-glp-1">Life After GLP-1</a>.</p>
</div>
<p>Remember, beyond the shot, your health is bigger than your medication. Your strength matters. Your nutrition matters. Your thoughts matter. Your relationship with food matters. Your habits matter, and you matter.</p>
<p>Don't waste the quiet.</p>
<h2>Related reading</h2>
<ul>
  <li><a href="/health-wellness-blog/food-noise-after-stopping-ozempic-or-wegovy">Food Noise After Stopping Ozempic or Wegovy: What Comes Next</a></li>
  <li><a href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom">How to Calm Food Noise After 40 (Without Another Diet)</a></li>
  <li><a href="/health-wellness-blog/how-to-stop-emotional-eating-after-40-without-shame">How to Stop Emotional Eating After 40 Without Shame</a></li>
  <li><a href="/health-wellness-blog/how-to-stop-starting-over-every-monday-after-40">How to Stop Starting Over Every Monday After 40</a></li>
  <li>More on this topic: <a href="/life-after-glp-1">Life After GLP-1</a></li>
</ul>
`.trim();
}

function chapterListHtml(): string {
  return CHAPTERS.map((chapter) => {
    const href =
      chapter.seconds === 0
        ? YOUTUBE_WATCH
        : `${YOUTUBE_WATCH}&t=${chapter.seconds}s`;
    return `<li><a href="${href}"><strong>${chapter.at}</strong> \u2014 ${chapter.label}</a></li>`;
  }).join("\n  ");
}

function buildShowNotesHtml(): string {
  return `
<p>On a GLP-1, the food noise can go quiet. Lee Anne's point in this episode: don't waste the quiet. Protect the body you're building, notice what food used to do for you, and rewire the story. One skill this week.</p>
<p>YouTube title: <em>${EPISODE_TITLE}</em></p>
<h2>Chapters</h2>
<ul>
  ${chapterListHtml()}
</ul>
<h2>Related</h2>
<ul>
  <li><a href="/health-wellness-blog/${SLUG}">Read the article</a></li>
  <li><a href="/health-wellness-blog/food-noise-after-stopping-ozempic-or-wegovy">Food noise after stopping Ozempic or Wegovy</a></li>
  <li><a href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom">How to calm food noise after 40</a></li>
  <li><a href="/health-wellness-blog/how-to-stop-emotional-eating-after-40-without-shame">How to stop emotional eating after 40 without shame</a></li>
  <li><a href="/health-wellness-blog/how-to-stop-starting-over-every-monday-after-40">How to stop starting over every Monday after 40</a></li>
  <li><a href="/life-after-glp-1">Life After GLP-1</a></li>
  <li><a href="/reclaim-invite">Six Habits in Six Weeks</a></li>
  <li><a href="/book">Book a free clarity call</a></li>
</ul>
<p><em>Coaching education only. Not medical advice. Lee Anne is a life and health coach, not your prescribing healthcare professional. Please don't stop, taper, increase, decrease, or otherwise change your medication based on a podcast.</em></p>
`.trim();
}

function shortYoutubeDescription(): string {
  const chapters = CHAPTERS.map((chapter) => `${chapter.at} ${chapter.label}`).join("\n");
  return `On a GLP-1 and not craving anything? Don't waste the quiet.

Read the article: ${SITE}/health-wellness-blog/${SLUG}
Show notes: ${SITE}/midlife-health-podcast/${SLUG}
Book a free clarity call: ${SITE}/book
Six Habits in Six Weeks: ${SITE}/reclaim-invite
Life After GLP-1: ${SITE}/life-after-glp-1

Chapters:
${chapters}

Coaching education only. Not medical advice. Lee Anne is a life and health coach, not your prescribing healthcare professional. Please don't stop, taper, increase, decrease, or otherwise change your medication based on a podcast.`.trim();
}

function databaseTarget(url: string): string {
  try {
    const parsed = new URL(url);
    const name = parsed.pathname.replace(/^\//, "") || "(no database name)";
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}/${name}`;
  } catch {
    return "(could not parse DATABASE_URL)";
  }
}

function isDuplicateKey(error: unknown): boolean {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current instanceof Error) parts.push(current.message);
    if (typeof current === "object" && current && "code" in current) {
      parts.push(String((current as { code: unknown }).code));
    }
    current =
      typeof current === "object" && current && "cause" in current
        ? (current as { cause: unknown }).cause
        : null;
  }
  const blob = parts.join(" ");
  return blob.includes("ER_DUP_ENTRY") || blob.includes("Duplicate entry");
}

async function uploadImage(localPath: string, key: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const { url } = await storagePut(key, buf, "image/jpeg");
  console.log("Uploaded", key, "->", url);
  return url;
}

type Db = ReturnType<typeof drizzle>;

type EpisodeMatch = {
  id: number;
  videoId: string;
  slug: string;
  youtubeDescription: string | null;
};

async function loadEpisodeMatches(db: Db): Promise<EpisodeMatch[]> {
  return db
    .select({
      id: podcastEpisodes.id,
      videoId: podcastEpisodes.videoId,
      slug: podcastEpisodes.slug,
      youtubeDescription: podcastEpisodes.youtubeDescription,
    })
    .from(podcastEpisodes)
    .where(
      or(
        eq(podcastEpisodes.videoId, VIDEO_ID),
        eq(podcastEpisodes.slug, SLUG),
        eq(podcastEpisodes.slug, POLLER_SLUG)
      )
    );
}

function keeperFrom(rows: EpisodeMatch[]): EpisodeMatch | null {
  const ours = rows.filter((row) => row.videoId === VIDEO_ID);
  if (ours.length > 1) {
    throw new Error(
      `Found ${ours.length} podcast rows for video ${VIDEO_ID}. Refusing to guess.`
    );
  }
  const otherSeo = rows.find((row) => row.slug === SLUG && row.videoId !== VIDEO_ID);
  if (otherSeo) {
    throw new Error(
      `Slug ${SLUG} already belongs to video ${otherSeo.videoId} (row ${otherSeo.id}). No rows written for the episode.`
    );
  }
  return ours[0] ?? null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required. Nothing was written.");
    process.exit(1);
  }
  if (!ENV.r2AccessKeyId || !ENV.r2SecretAccessKey || !ENV.r2Endpoint) {
    console.error(
      "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT are required. Nothing was written."
    );
    process.exit(1);
  }

  const coverLocal = path.join(assetDir, "cover.jpg");
  const volumeLocal = path.join(assetDir, "volume.jpg");
  const strongLocal = path.join(assetDir, "strong.jpg");
  const transcriptPath = path.join(assetDir, "transcript.txt");
  for (const filePath of [coverLocal, volumeLocal, strongLocal, transcriptPath]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing asset: ${filePath}`);
    }
  }

  console.log("Database target:", databaseTarget(databaseUrl));
  console.log("This publishes the blog post and the episode.");

  const db = drizzle(databaseUrl);
  // Read first. A slug owned by a different video aborts before any upload or write.
  const matches = await loadEpisodeMatches(db);
  const keeper = keeperFrom(matches);

  const coverUrl = await uploadImage(coverLocal, `blog-images/${SLUG}.jpg`);
  const volumeUrl = await uploadImage(volumeLocal, `blog-images/${SLUG}-volume.jpg`);
  const strongUrl = await uploadImage(strongLocal, `blog-images/${SLUG}-strong.jpg`);
  const transcript = fs.readFileSync(transcriptPath, "utf8").trim();

  const blogValues = {
    slug: SLUG,
    title: BLOG_TITLE,
    excerpt: BLOG_EXCERPT,
    content: buildBlogContent(volumeUrl, strongUrl),
    category: "Mindset & Habits",
    coverImage: coverUrl,
    coverImageAlt: COVER_ALT,
    published: true,
    publishedAt: PUBLISHED_AT,
    seoTitle: BLOG_SEO_TITLE,
    seoDescription: BLOG_SEO_DESCRIPTION,
    schemaTypes: "Article,FAQ,VideoObject",
    schemaFaqJson,
    schemaVideoUrl: YOUTUBE_WATCH,
    schemaVideoDescription: BLOG_SEO_DESCRIPTION,
  };

  const [existingBlog] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, SLUG))
    .limit(1);

  if (existingBlog) {
    await db.update(blogPosts).set(blogValues).where(eq(blogPosts.id, existingBlog.id));
    console.log("Updated blog post id=", existingBlog.id);
  } else {
    try {
      await db.insert(blogPosts).values(blogValues);
      console.log("Inserted blog post", SLUG);
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const [again] = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(eq(blogPosts.slug, SLUG))
        .limit(1);
      if (!again) throw error;
      await db.update(blogPosts).set(blogValues).where(eq(blogPosts.id, again.id));
      console.log("Updated blog post id=", again.id);
    }
  }

  const showNotesHtml = buildShowNotesHtml();
  const youtubeDescription = keeper?.youtubeDescription?.trim()
    ? keeper.youtubeDescription
    : shortYoutubeDescription();

  const episodeValues = {
    videoId: VIDEO_ID,
    slug: SLUG,
    title: EPISODE_TITLE,
    thumbnail: THUMBNAIL,
    publishedAt: PUBLISHED_AT,
    youtubeDescription,
    showNotesHtml,
    transcript,
    seoTitle: EPISODE_SEO_TITLE,
    seoDescription: EPISODE_SEO_DESCRIPTION,
    habitActionsJson,
    linkedBlogSlug: SLUG,
    status: "published" as const,
  };

  if (keeper) {
    if (keeper.slug !== SLUG) {
      console.log("Moving episode slug", keeper.slug, "->", SLUG, "id=", keeper.id);
    }
    await db
      .update(podcastEpisodes)
      .set(episodeValues)
      .where(eq(podcastEpisodes.id, keeper.id));
    console.log("Updated episode id=", keeper.id, "video=", keeper.videoId);
  } else {
    try {
      await db.insert(podcastEpisodes).values(episodeValues);
      console.log("Inserted episode", SLUG);
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const again = keeperFrom(await loadEpisodeMatches(db));
      if (!again) throw error;
      const keptDescription = again.youtubeDescription?.trim()
        ? again.youtubeDescription
        : shortYoutubeDescription();
      await db
        .update(podcastEpisodes)
        .set({ ...episodeValues, youtubeDescription: keptDescription })
        .where(eq(podcastEpisodes.id, again.id));
      console.log("Updated episode after duplicate key id=", again.id);
    }
  }

  console.log(`${SITE}/health-wellness-blog/${SLUG}`);
  console.log(`${SITE}/midlife-health-podcast/${SLUG}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
