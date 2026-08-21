/**
 * Publish: Is 60 Too Old to Start Over?
 * Uploads cover + mid-article images to R2, then upserts the blog post.
 *
 * Sources: Flight 60 transcript + "expiration date" essay
 * YouTube: https://youtu.be/gKOI4PkRrCE
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
import { storagePut } from "../server/storage";

const slug = "is-60-too-old-to-start-over";
const videoId = "gKOI4PkRrCE";
const podcastSlug = "is-60-too-old-to-start-over";

const title = "Is 60 Too Old to Start Over?";
const seoTitle = "Is 60 Too Old to Start Over? You're Not Expired";

const seoDescription =
  "Is 60 too old to start over? A coach turning 60 on why women don't have an expiration date — unfinished, not lost — and how to begin the next chapter today.";

const excerpt =
  "Is 60 too old to start over — or 50, or 42? A coach boarding Flight 60 on the lie of an expiration date, becoming unfinished on purpose, and asking a better question: what will you do with the years you have?";

const coverImageAlt =
  "Vibrant woman around 60 on a sunlit mountain trail looking toward her next chapter — not expired, unfinished";

const pianoImageAlt =
  "Woman around 60 sitting back down at the piano, learning again as a beginner in midlife";

const pickleballImageAlt =
  "Woman around 60 playing pickleball outdoors — pro-living, not anti-aging";

const journalImageAlt =
  "Woman around 60 journaling her next-chapter challenge at a sunlit kitchen table";

const schemaFaqJson = JSON.stringify([
  {
    question: "Is 60 too old to start over?",
    answer:
      "No. Starting over at 60 is not a late scramble — it is often the first time a woman has enough wisdom, boundaries, and freedom to become who she actually wants to be. You are not expired. You are unfinished.",
  },
  {
    question: "Is it too late to change my life after 50?",
    answer:
      "It is not too late. The years pass whether you start or not. You can turn 55, 60, or 70 having tried the thing — or still wondering. The better question is not “Am I behind?” It is “What am I going to do with the years I have?”",
  },
  {
    question: "When did we decide women have an expiration date?",
    answer:
      "Culture handed women a story: young years are for becoming, middle years are for doing, later years are for fading. That story is a lie. You can love the life you built and still want a new chapter. Gratitude and desire can live in the same woman.",
  },
  {
    question: "Why do I feel lost in midlife even if I love my family?",
    answer:
      "Kids grow up, bodies change, roles change — and a quiet question shows up: “Is this it?” Feeling that does not make you ungrateful. You may not be lost. You may be unfinished, with more coming.",
  },
  {
    question: "What is the difference between being lost and unfinished?",
    answer:
      "Lost implies something went wrong. Unfinished means there is more coming. The woman you were at 30, 40, and 50 was not the final version — and 60 is not either.",
  },
  {
    question: "Should I chase anti-aging after 50?",
    answer:
      "Anti-aging fights the privilege of continuing to live. A better goal is pro-living: strong legs, a curious brain, food that nourishes without running your life, purpose, and a body you take care of because you still have things to do with it.",
  },
  {
    question: "How do I start the next chapter of my life?",
    answer:
      "Leave three stories at the gate: “I should have done it by now,” “I’m too old,” and “I need to know exactly how this turns out.” Then finish three sentences — I’m ready to stop… I’m ready to start… I’m becoming a woman who… — and take the next step you would take if you believed your best chapter was still ahead.",
  },
  {
    question: "Can I start a new career or hobby at 60?",
    answer:
      "Yes. Lee Anne went back to school, became a certified financial, metabolic, and life coach, sat back down at the piano, learned pickleball, and built Mind & Body Reset in her late fifties. The world does not have to get smaller. Yours can get bigger.",
  },
]);

const schemaHowToStepsJson = JSON.stringify([
  {
    name: "Drop “I should have done it by now”",
    text: "Should beats today’s possibilities with yesterday. You cannot change when you started. You can decide what you do next.",
  },
  {
    name: "Question “I’m too old”",
    text: "Too old for what — to learn, change, get stronger, start something, or fall in love with your life again? There is no expiration date stamped on women.",
  },
  {
    name: "Board without the full itinerary",
    text: "You do not need to know how the whole chapter turns out. You need the next page. Faith is moving when you trust the One who knows the turns.",
  },
  {
    name: "Write your next-chapter sentences",
    text: "Finish: I’m ready to stop… I’m ready to start… I’m becoming a woman who… Then ask: if I truly believed my best chapter could still be ahead, what would I do next? Do that.",
  },
]);

const sessionImagesDir = path.join(
  process.env.USERPROFILE || "",
  ".grok",
  "sessions",
  "C%3A%5CUsers%5Ccarte%5CDownloads%5Cmind-body-reset-portal",
  "01a0251b-03ad-7810-aec8-ceaa0a585350",
  "images"
);

const publicBlogDir = path.join(process.cwd(), "public", "blog");

const coverLocal = path.join(sessionImagesDir, "1.jpg");
const journalLocal = path.join(sessionImagesDir, "2.jpg");
const pianoLocal = path.join(sessionImagesDir, "3.jpg");
const pickleballLocal = path.join(sessionImagesDir, "4.jpg");

function figure(src: string, alt: string, caption: string): string {
  return `
<figure style="margin:1.75rem 0;">
  <img src="${src}" alt="${alt}" style="width:100%;height:auto;border-radius:16px;display:block;" loading="lazy" />
  <figcaption style="margin-top:0.5rem;font-size:0.875rem;color:#6b7280;text-align:center;">${caption}</figcaption>
</figure>`.trim();
}

function buildContent(imgs: {
  piano: string;
  pickleball: string;
  journal: string;
}): string {
  return `
<p>I'm turning 60. There. I said it. <strong>Sixty.</strong></p>
<p>If you have been quietly googling <strong>is 60 too old to start over</strong> — or 50, or 47, or 42 — I have disappointing news and better news.</p>
<p>The disappointing news: sixty is not the age when everything suddenly clicks. I still stare into the fridge wondering what I came for. I still second-guess myself. I still try things and fail. I still have dreams that scare me. Occasionally I look around for my phone while it is in my pocket.</p>
<p>The better news: <strong>figuring it all out was never the point.</strong></p>
<p>When did we decide women have an expiration date? Because I have searched everywhere, and I cannot find the paperwork.</p>
<p><em>Coaching education only — not medical advice. Work with your clinician for personal health decisions.</em></p>

<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Watch / listen to the episode</p>
  <p style="margin:0 0 0.75rem;">Prefer Lee Anne&apos;s voice? Full show notes, chapters, and player: <a href="/midlife-health-podcast/${podcastSlug}"><em>Is 60 Too Old to Start Over?</em></a> (YouTube: <em>How Can Turning 60 Be the Start of Your Next Great Adventure?</em>).</p>
  <p style="margin:0;"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a> · also in the free <a href="/habit-tracker/podcasts">habit tracker podcast tab</a>.</p>
</div>

<h2>Why does turning 60 feel like a finish line?</h2>
<p>For most of my life I pictured life as a staircase. Graduate. Get married. Build a career. Raise the kids. Buy the house. Take care of everybody. Figure out your health, your marriage, your purpose. Eventually you reach the top:</p>
<p><strong>Congratulations. You have arrived.</strong> You know who you are. Your children call regularly. Hormones cooperate. You finally know what to make for dinner.</p>
<p>I am standing at 60 thinking: <em>where is the top?</em></p>
<p>Life is not a staircase. It is more like an airport. You race toward a gate thinking, “Once I get there, I will finally relax.” You get there — and somebody changes the gate.</p>
<ul>
  <li>Kids grow up. Gate change.</li>
  <li>Grandkids arrive. Gate change.</li>
  <li>Your body changes. Big gate change.</li>
  <li>Career changes. Gate change.</li>
  <li>You start wondering what <em>you</em> want after decades of taking care of everyone else.</li>
</ul>
<p>Ladies, we are in another terminal. I have spent enough of my life sitting at the gate. <strong>I am going somewhere.</strong></p>
<p>If the “I’ll start Monday” loop is part of what has you stuck at the gate, read <a href="/health-wellness-blog/how-to-stop-starting-over-every-monday-after-40">how to stop starting over every Monday after 40</a>.</p>

<h2>When did we decide women have an expiration date?</h2>
<p>Somewhere along the way we absorbed a pretty terrible story about aging.</p>
<p>Your younger years are for becoming. Your middle years are for doing. And your later years? Well… try not to fall. Fade into the background. Stay useful, stay quiet, stay grateful, and please do not want too much.</p>
<p><strong>Excuse me? No. I refuse.</strong></p>
<p>I am not interested in disappearing. I am also not interested in desperately trying to look 35. I have already been 35. It was exhausting. Children needed things. Everybody needed things. Someone was always asking, “Mom, where’s my…?” I don’t know. Probably next to my sanity.</p>
<p>I do not want my younger life back. I want <strong>this</strong> life — with everything I know now. More wisdom. More freedom. More confidence. More boundaries. More curiosity. And significantly less interest in what everybody thinks about me.</p>
<p>That is one of the perks nobody advertises. The “What will people think?” department becomes severely understaffed. And it is delightful.</p>

${figure(imgs.pickleball, pickleballImageAlt, "Pro-living looks like this: strong legs, a curious brain, and a paddle in your hand — not a war on your own birthday.")}

<h2>What if the 2019 picture wasn't a before photo?</h2>
<p>I have a picture of myself from 2019. I am about twenty pounds heavier. For a long time, when I looked at it, I saw the weight.</p>
<p>Now I see the woman. And that has changed everything.</p>
<p>I do not look at her and think, “Girl, you need to lose twenty pounds.” I look at her and think, <strong>“Oh honey… you have no idea who you are about to become.”</strong></p>
<p>She did not know she would go back to school through BYU Pathways. She did not know she would become a Dave Ramsey certified financial coach, a Mindy Pelz certified metabolic coach, and a Jody Moore certified life coach. Apparently somewhere in my late fifties I decided certifications were like Costco samples.</p>
<p><em>Financial coaching? Sure. Metabolic health? I’ll take one. Life coaching? Throw that in the cart.</em></p>
<p>She did not know she would start building <a href="/about">Mind &amp; Body Reset</a>. Sit back down at the piano. Pick up a pickleball paddle. Learn things that made her interesting on purpose — including skills that pushed her way outside her comfort zone.</p>
<p>I am basically one sourdough starter away from becoming completely unpredictable. And I love that, because for years I thought aging meant your world got smaller. <strong>I am discovering mine is getting bigger.</strong></p>
<p>Yes, my body changed. If midlife weight has been your loudest story, start here: <a href="/health-wellness-blog/why-am-i-gaining-weight-after-40-even-when-i-eat-less">why am I gaining weight after 40 even when I eat less?</a> The biggest before-and-after was not happening on the outside. It was happening in the woman living inside it.</p>

${figure(imgs.piano, pianoImageAlt, "Reclaim the parts of you that got quiet. You do not need your younger self back. You need the beginner who still says yes.")}

<h2>What if you're not lost — you're unfinished?</h2>
<p>There is a question a lot of women quietly start asking in this season. The kids do not need you the same way. Your body is changing. Your roles are changing. You look at your life and think, <strong>“Okay… now what?”</strong></p>
<p>Underneath that can be another question we are almost afraid to say out loud:</p>
<p><strong>Is this it?</strong></p>
<p>That question can feel scary because we loved our families. We love being mothers. We adore our grandkids. We are grateful. But <strong>gratitude and desire can exist in the same woman.</strong></p>
<p>You can love the life you have built and still want to build something new. You can adore your grandchildren and have dreams that belong only to you. You can be grateful for who you have been and curious about who you are becoming. That does not make you selfish. It makes you alive.</p>
<p>Women say, “I need to find myself again.” I have said versions of it too. Lately I have wondered: <strong>what if you are not lost? What if you are unfinished?</strong></p>
<p>Lost implies something went wrong. Unfinished means there is more coming.</p>
<p>The woman you were at 30 was not the final version. Neither was 40. Neither was 50. And I am happy to report… 60 is not either. Thank goodness. Because I have plans.</p>
<p>Identity work is the engine under this: <a href="/health-wellness-blog/reclaim-rewire-reset-become-a-different-decision-maker">become a different decision-maker</a> and the episode <a href="/midlife-health-podcast/reclaim-rewire-reset-transform-identity">Reclaim, Rewire, Reset</a>.</p>

<h2>Is anti-aging the wrong goal after 50?</h2>
<p>Here is something else I have decided as I turn 60. I do not want an <strong>anti-aging</strong> life.</p>
<p>Think about that phrase. Anti-aging. Anti… the privilege of continuing to live? No thank you.</p>
<p>I do not want to spend the next decade fighting the fact that I am getting older. I want to become <strong>pro-living</strong>.</p>
<ul>
  <li>Strong legs that carry me on adventures</li>
  <li>Muscle, energy, a curious brain</li>
  <li>Food that nourishes me without running my life</li>
  <li>Laughter that makes my stomach hurt</li>
  <li>Learning, purpose, family dinners</li>
  <li>Loving my kids and spoiling grandkids just enough to annoy their parents (that is practically in the grandmother job description)</li>
</ul>
<p>I want to take care of this body — not because I am trying to make it look 30. <strong>Because I still have things I want to do with it.</strong> That is a very different reason to pursue health.</p>
<p>If food still feels like a courtroom, you may also want <a href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom">how to calm food noise</a> and the free <a href="/food-quiz">food &amp; mindset quiz</a>.</p>

<h2>What should you leave at the gate of the next chapter?</h2>
<p>So what am I taking into this next decade? Not another 47-step morning routine. Not perfection. Not a desperate attempt to reverse aging.</p>
<p>I am leaving three things behind as I board Flight 60 — and carrying <strong>Reclaim. Rewire. Reset.</strong></p>

<h3>1. Leave “I should have done it by now”</h3>
<p>Should have lost the weight. Should have figured out my career. Should have saved more. Should have started sooner. Should have known better. Should, should, should.</p>
<p>You know what should does? It takes today’s possibilities and beats you over the head with yesterday. I am done with that. I cannot change when I started. <strong>I can decide what I do next.</strong></p>

<h3>2. Leave “I’m too old”</h3>
<p>Too old for what? To learn? To change? To get stronger? To start something? To fall in love with your life again?</p>
<p>Show me the paperwork. Who made that rule? Because I am 60, and apparently I am taking piano lessons, playing pickleball, building a coaching business, and learning things I never thought I would learn. If somebody has an age-limit policy, I would love to speak to management.</p>
<p>Instead of “I’m too old,” try: <strong>“I’ve never done this at this age before.”</strong> Those are very different sentences. One closes the door. The other opens it.</p>

<h3>3. Leave “I need to know exactly how this turns out”</h3>
<p>This might be the biggest lesson I am carrying into 60. You do not need to know how the entire next chapter turns out. You just need to start the next page.</p>
<p>I did not know exactly where going back to school would lead. I did not know where becoming a coach would lead. I did not know exactly what Mind &amp; Body Reset would become. I started anyway.</p>
<p><strong>The years are going to pass whether you start or not.</strong> You can turn 50, 55, 60, 65, or 70 having tried the thing — or still wondering what might have happened if you had. I am choosing tried.</p>
<p>Maybe that is faith. Not knowing exactly where every turn will take you, but trusting the One who does.</p>
<p>Reclaim the parts of you that got quiet. Rewire the story (“too old / too late”). Reset by starting before you feel ready. That is the heart of <a href="/reclaim">R.E.C.L.A.I.M. coaching</a> for women 40+.</p>

<h2>What if God isn't finished with you?</h2>
<p>This is where turning 60 has become something much deeper for me. I believe God knew every version of me — the young woman, the woman building a family, the woman struggling with her body, the woman questioning herself, the woman learning, the woman starting over, the mom becoming a coach, and this woman turning 60.</p>
<p>Maybe God never looked at any of those versions and thought, “She’s behind.” Maybe I was the one doing that. Maybe He knew all along that every chapter was preparing me for the next one. Maybe the woman I am becoming needed everything I have lived through to become her.</p>
<p>The mistakes. The weight struggles. The doubts. The motherhood. The marriage. The businesses. The disappointments. The learning. The starting over. <strong>None of it was wasted.</strong></p>
<p>And maybe you need to hear that too. <strong>You are not late to your own life.</strong></p>
<p>If younger me had been asked what 60 looked like, I probably would have said “old.” Sorry, but I would have. Now I think 60 looks like freedom, wisdom, strength, curiosity, grandkids, boundaries, pickleball, purpose — and not giving nearly as many hoots about things that never mattered anyway.</p>
<p>I thought by 60 I would finally have life figured out. I finally figured out that I do not have to. There is so much more freedom in that.</p>

${figure(imgs.journal, journalImageAlt, "Write what you actually want — not what sounds responsible. Then take the next step.")}

<h2>How do you start your next chapter today?</h2>
<p>My birthday wish is not to be younger. I do not want my 40-year-old body back. I do not want to erase the wrinkles. I do not want to rewind my life.</p>
<p>I want to be <strong>fully here for the woman I am becoming</strong>. I want to keep saying yes when God nudges me. I want to keep doing things that scare me a little. I want to stay curious. I want to keep taking care of my mind and body — not because I am desperately trying to stay young, but because I have things I still want to do, people I want to love, places I want to go, women I want to help, memories I have not made yet, and grandkids I fully intend to keep up with.</p>
<p>So yes. I am turning 60. And no, I do not have it all figured out. Thank goodness — because that means there is still mystery, still possibility, still growth, still adventure, still more of me I have not met yet.</p>
<p>This birthday is not looking backward asking, “Where did the years go?” It is looking forward and asking, <strong>“What am I going to do with the years I have?”</strong></p>
<p>I have not finished becoming. I have finally started becoming the woman God always knew I could be. And girlfriend… she is just getting warmed up.</p>
<p><strong>Welcome to Chapter 60. Let’s go.</strong></p>

<h3>Your Chapter ___ challenge</h3>
<p>Whatever number your next chapter is — 40, 47, 53, 60, 68 — grab a piece of paper and finish these three sentences. Do not write what sounds responsible. Write what you actually want.</p>
<ol>
  <li><strong>I’m ready to stop…</strong></li>
  <li><strong>I’m ready to start…</strong></li>
  <li><strong>I’m becoming a woman who…</strong></li>
</ol>
<p>Then answer one final question:</p>
<p><strong>If I truly believed my best chapter could still be ahead of me, what would I do next?</strong></p>
<p>Do that.</p>
<p>Track the follow-through in our free <a href="/habit-tracker">habit tracker</a> if you like a simple scoreboard. And if there is a woman in your life who thinks she is too old, too late, too far behind, or has missed her chance — send her this. She may need the reminder: she is not done becoming either.</p>

<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Related on the podcast</p>
  <p style="margin:0;"><a href="/midlife-health-podcast/navigating-midlife-changes-hormones-weight">Navigating Midlife Changes</a> · <a href="/midlife-health-podcast/beyond-the-scale-building-new-weight-loss-patterns">Beyond the Scale</a> · <a href="/midlife-health-podcast/breaking-the-cycle-habits-not-plans">Habits, Not Plans</a></p>
</div>

<h2>FAQs: is it too late to start over after 50 or 60?</h2>

<h3>Is 60 too old to start over?</h3>
<p>No. Starting over at 60 is often the first time a woman has enough wisdom, boundaries, and freedom to become who she actually wants to be. You are not expired. You are unfinished.</p>

<h3>Is it too late to change my life after 50?</h3>
<p>It is not too late. The years pass whether you start or not. You can turn 55, 60, or 70 having tried the thing — or still wondering. Ask a better question: what am I going to do with the years I have?</p>

<h3>When did we decide women have an expiration date?</h3>
<p>We were handed a story that later years are for fading. That story is a lie. You can love the life you built and still want a new chapter. Gratitude and desire can live in the same woman.</p>

<h3>Why do I feel lost in midlife even if I love my family?</h3>
<p>Roles change. Bodies change. A quiet “is this it?” is common — and it does not make you ungrateful. You may not be lost. You may be unfinished, with more coming.</p>

<h3>Should I chase anti-aging after 50?</h3>
<p>Anti-aging fights the privilege of continuing to live. Choose pro-living: strength, curiosity, nourishing food, purpose, and a body you care for because you still have things to do with it.</p>

<h3>Can I start a new career or hobby at 60?</h3>
<p>Yes. School, certifications, piano, pickleball, a business, a beginner skill that scares you a little — your world does not have to get smaller. It can get bigger. See also <a href="/health-wellness-blog/stop-chasing-plans-lasting-health-transformation">stop chasing plans</a> if you keep waiting for a perfect program before you begin.</p>

<h2>You are not late to your own life</h2>
<p>Maybe you could not have done it then. Maybe you did not know enough. Maybe you were not ready. Maybe everything you have lived through was preparing you for what comes next.</p>
<p>What if you are not behind? <strong>What if you are right on time?</strong></p>
<p>If you want a partner for the next chapter — health, habits, and the woman you are still becoming — <a href="/book">book a free discovery call</a>. Or start with the <a href="/food-quiz">free quiz</a> and explore <a href="/holistic-health-and-wellness">holistic health for women 40+</a>.</p>
<p>I have not finished becoming. Neither have you. Let’s go.</p>
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
  for (const p of [coverLocal, journalLocal, pianoLocal, pickleballLocal]) {
    if (!fs.existsSync(p)) throw new Error(`Missing image: ${p}`);
  }

  if (!fs.existsSync(publicBlogDir)) fs.mkdirSync(publicBlogDir, { recursive: true });
  fs.copyFileSync(coverLocal, path.join(publicBlogDir, `${slug}.jpg`));
  fs.copyFileSync(pianoLocal, path.join(publicBlogDir, `${slug}-piano.jpg`));
  fs.copyFileSync(pickleballLocal, path.join(publicBlogDir, `${slug}-pickleball.jpg`));
  fs.copyFileSync(journalLocal, path.join(publicBlogDir, `${slug}-journal.jpg`));
  console.log("Saved local copies under public/blog/");

  const coverUrl = await uploadImage(coverLocal, `blog-images/${slug}.jpg`);
  const pianoUrl = await uploadImage(pianoLocal, `blog-images/${slug}-piano.jpg`);
  const pickleballUrl = await uploadImage(
    pickleballLocal,
    `blog-images/${slug}-pickleball.jpg`
  );
  const journalUrl = await uploadImage(
    journalLocal,
    `blog-images/${slug}-journal.jpg`
  );

  const content = buildContent({
    piano: pianoUrl,
    pickleball: pickleballUrl,
    journal: journalUrl,
  });

  const db = await getDb();
  if (!db) throw new Error("No database connection");

  const [existing] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  const publishedAt = new Date("2026-08-21T15:00:00.000Z");

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
      "Is 60 too old to start over? Lee Anne boards Flight 60: women don't have an expiration date, unfinished not lost, pro-living instead of anti-aging.",
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
