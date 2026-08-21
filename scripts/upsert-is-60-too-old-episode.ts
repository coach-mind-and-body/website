/**
 * Upsert show notes for Flight 60 / Is 60 Too Old to Start Over?
 * YouTube: https://youtu.be/gKOI4PkRrCE
 * Title on YouTube: How Can Turning 60 Be the Start of Your Next Great Adventure?
 */
import "dotenv/config";
import { eq, or } from "drizzle-orm";
import { getDb } from "../server/db";
import { podcastEpisodes } from "../drizzle/schema";

const videoId = "gKOI4PkRrCE";
const slug = "is-60-too-old-to-start-over";
const title = "Is 60 Too Old to Start Over?";
const blogSlug = "is-60-too-old-to-start-over";

const showNotesHtml = `
<p>I'm turning 60 — and apparently I still don't know what I want to be when I grow up. If you've been waiting for the age when everything clicks, sixty isn't it. The good news? Figuring it all out was never the point.</p>
<p>In this episode, Lee Anne boards <strong>Flight 60</strong> and asks the question women whisper in midlife: <strong>is 60 too old to start over?</strong> When did we decide women have an expiration date? You'll hear why life is an airport (not a staircase), why you're unfinished rather than lost, and why she's done with anti-aging and all-in on pro-living.</p>
<p>YouTube title: <em>How Can Turning 60 Be the Start of Your Next Great Adventure?</em></p>

<h2>Key takeaways</h2>
<ul>
  <li><strong>Sixty is not the finish line.</strong> Lee Anne still second-guesses herself, still has dreams that scare her, and still looks for her phone while it's in her pocket. Arrival was never the point. Becoming is.</li>
  <li><strong>Life is an airport, not a staircase.</strong> You race toward a gate thinking you'll finally relax — then the kids grow up, the body changes, the roles shift. Gate change. Stop sitting at the gate. Board.</li>
  <li><strong>Women don't have an expiration date.</strong> The story that later years are for fading is a lie. She doesn't want 35 back. She wants this life — wisdom, boundaries, curiosity, and a severely understaffed “what will people think?” department.</li>
  <li><strong>The 2019 picture changed meaning.</strong> She used to see twenty extra pounds. Now she sees a woman who had no idea she was about to go back to school, collect certifications, sit down at the piano, pick up pickleball, and build Mind &amp; Body Reset. Aging can make your world bigger.</li>
  <li><strong>Gratitude and desire can live in the same woman.</strong> Loving your family and still wanting a chapter that belongs to you is not selfish. It's alive. The midlife “is this it?” is often a beginning, not a verdict.</li>
  <li><strong>You're not lost. You're unfinished.</strong> Lost implies something went wrong. Unfinished means there's more coming. 30, 40, and 50 weren't the final version. 60 isn't either.</li>
  <li><strong>Pro-living beats anti-aging.</strong> Anti-aging fights the privilege of continuing to live. She wants strong legs, a curious brain, food that doesn't run her life, purpose, and a body she cares for because she still has things to do with it.</li>
  <li><strong>Leave three bags at the gate:</strong> “I should have done it by now.” “I'm too old.” “I need to know exactly how this turns out.” Should beats today with yesterday. There is no age-limit paperwork. You don't need the itinerary — you need to board.</li>
  <li><strong>You are not late to your own life.</strong> Maybe God never thought you were behind. Maybe every chapter — mistakes, weight struggles, motherhood, starting over — was preparing you. None of it was wasted.</li>
</ul>

<h2>This week's challenge</h2>
<p>Finish these three sentences. Don't write what sounds responsible. Write what you actually want.</p>
<ol>
  <li><strong>I'm ready to stop…</strong></li>
  <li><strong>I'm ready to start…</strong></li>
  <li><strong>I'm becoming a woman who…</strong></li>
</ol>
<p>Then ask: <strong>If I truly believed my best chapter could still be ahead of me, what would I do next?</strong> That's your next step. Take it.</p>

<h2>Chapters</h2>
<ul>
  <li><strong>00:00</strong> — I still don't know what I want to be when I grow up</li>
  <li><strong>00:48</strong> — Life isn't a staircase (it's an airport)</li>
  <li><strong>02:00</strong> — The 2019 picture: the woman she was becoming</li>
  <li><strong>03:00</strong> — When did women get an expiration date?</li>
  <li><strong>04:00</strong> — “Is this it?” Gratitude and desire can coexist</li>
  <li><strong>04:50</strong> — You're not lost. You're unfinished</li>
  <li><strong>05:20</strong> — Pro-living, not anti-aging</li>
  <li><strong>06:10</strong> — Three things to leave at the gate</li>
  <li><strong>07:00</strong> — What if God isn't done with you?</li>
  <li><strong>08:15</strong> — Birthday wish: fully here for the woman I'm becoming</li>
  <li><strong>09:40</strong> — Your next-chapter challenge</li>
</ul>

<h2>Related resources</h2>
<ul>
  <li><a href="/health-wellness-blog/${blogSlug}">Blog: Is 60 Too Old to Start Over?</a></li>
  <li><a href="/reclaim">R.E.C.L.A.I.M. coaching</a> — reclaim, rewire, reset</li>
  <li><a href="/health-wellness-blog/reclaim-rewire-reset-become-a-different-decision-maker">Become a different decision-maker</a></li>
  <li><a href="/health-wellness-blog/how-to-stop-starting-over-every-monday-after-40">How to stop starting over every Monday after 40</a></li>
  <li><a href="/health-wellness-blog/why-am-i-gaining-weight-after-40-even-when-i-eat-less">Why am I gaining weight after 40 even when I eat less?</a></li>
  <li><a href="/habit-tracker">Free habit tracker</a></li>
  <li><a href="/food-quiz">Free food &amp; mindset quiz</a></li>
  <li><a href="/midlife-health-podcast/reclaim-rewire-reset-transform-identity">Related episode: Reclaim, Rewire, Reset</a></li>
  <li><a href="/midlife-health-podcast/navigating-midlife-changes-hormones-weight">Related episode: Navigating Midlife Changes</a></li>
</ul>

<p><strong>Next step:</strong> If you know you want a next chapter but keep sitting at the gate, <a href="/book">book a free discovery call</a>. You don't need the whole itinerary. You need a first step — and someone who will not let you call yourself expired.</p>

<p><em>For education and coaching context only — not medical advice.</em></p>
`.trim();

const transcript = `I'm turning 60, and apparently I still don't know what I wanna be when I grow up. Seriously, I thought by 60 I would have all the answers. I thought I'd be one of those women who wakes up naturally at 5:30, drinks lemon water, remembers everyone's birthdays, and knows exactly what she's doing with her life.

But here I am, almost sixty, and sometimes I'm still staring in the fridge thinking, "What did I come here for?" I still second-guess myself. I still try things and fail. I still change my mind. I still have dreams that scare me, and occasionally I look around for my phone, and it's in my pocket. So if you're waiting for the age when everything suddenly clicks, I've got some disappointing news for you.

Sixty isn't it. But I've also got some really good news for you. I think I've finally figured out that figuring out was never the point. For most of my life, I pictured life as a staircase. You just keep climbing, graduate, get married, build a career, raise the kids, buy the house, take care of everybody, become financially responsible, figure out your health, figure out your marriage, figure out your purpose, and eventually you reach the top.

Congratulations, you have arrived. You know who you are. Your children call you regularly, and hormones cooperate, and you finally know what to make for dinner. But here I am, standing here at sixty thinking, "Where is the top?" Because life isn't a staircase. I've decided life is more like an airport. You spend years racing towards a gate thinking, "Once I get there, I'll finally relax."

You get there, and somebody changes the gate. Kids grow up, gate change. Grandkids arrive, gate change. Your body changes, big gate change. Career changes, gate change. You start wondering what you want after decades of taking care of everyone else. Ladies, we are now in another terminal, and I don't know about you, but I've spent enough of my life sitting at the gate.

I'm going somewhere. I have a picture of myself from twenty nineteen. I'm about twenty pounds heavier, and when I used to look at that picture, I saw the weight. Now I see the woman, and that has changed everything. Because I don't look at her and think, "Girl, you need to lose twenty pounds."

I look at her and think, "Oh, honey, you have no idea who you are about to become." She didn't know yet. She didn't know she would go back to school through BYU Pathways. She didn't know she would become a Dave Ramsey certified financial coach or a Mindy Pelz metabolic coach or a Jody Moore certified life coach.

She didn't know she would start building Mind and Body Reset. She didn't know she'd sit back down at a piano. She didn't know she'd pick up a pickleball paddle. She definitely didn't know she was going to learn to use a handgun. And apparently, somewhere in my late fifties, I decided, "Let's make this woman interesting."

Financial coaching, metabolic health, life coaching, piano, pickleball, handguns. I'm basically one sourdough starter away from becoming completely unpredictable, and I love that because for years, I thought aging meant your world got smaller. I'm discovering mine is getting bigger. This is the part I really want women to hear.

Somewhere along the way, we've absorbed this idea that a woman's life has a peak. Young, beautiful, needed, busy, raising children, building careers, taking care of everyone. And then eventually she starts fading into the background. Excuse me? No, I refuse. I am not interested in disappearing, and I'm also not interested in desperately trying to look thirty-five.

I don't necessarily wanna be thirty-five again. I was there. It was exhausting. I had children who needed things, and everybody needed things. Someone was always asking, "Mom, where's my...?" I don't know. Probably next to my sanity. I don't want my younger life back. I want this life with everything I know now, with more wisdom, more freedom, more confidence, more boundaries, more curiosity, and significantly less interest in what everybody thinks about me.

That's one of the perks nobody advertises about getting older. Your what will people think department becomes severely understaffed, and frankly, it's delightful. There is a question I think a lot of women quietly start asking in this season. Maybe you've asked it. The kids don't need you the same way.

Your body is changing. Your roles are changing. You look at your life and think, "Okay, now what?" And underneath that question can be another one we're almost afraid to say out loud. Is this it? That question can feel scary because we loved our families. We love being mothers. We adore our grandkids.

We are grateful. But gratitude and desire can exist in the same woman. You can love the life you've built and still want to build something new. You can adore your grandchildren and have dreams that belong only to you. You can be grateful for who you've been and curious about who you're becoming.

That doesn't make you selfish. It makes you alive. We hear women say, "I need to find myself again." But I've been thinking about that. Maybe we don't need to find ourselves. Maybe we're not lost. Maybe we're just unfinished. I love that because lost implies something went wrong. Unfinished means there's more coming.

The woman you were at thirty wasn't the final version. Neither was forty. Neither was fifty. And I'm beginning to suspect sixty isn't either. Thank goodness, because I have plans. Here's something else I've decided as I turn sixty. I don't want an anti-aging life. Think about that phrase.

Anti-aging? Anti the privilege of continuing to live? No, thank you. I don't want to spend the next day fighting the fact that I'm getting older. I want to become pro-living. I want strong legs that carry me places. I want a brain that stays curious. I want food to nourish me without running my life.

I want to laugh. I want adventures. I want to learn things I'm terrible at. I want to lift weights, play pickleball, travel, sit at the piano, build something meaningful, help women, love my family, spoil my grandkids just enough to irritate their parents. That's what grandparents are for, and I want to keep becoming.

So I'm leaving three things behind as I board Flight 60. Number one, I should have done it by now. Should have lost the weight, should have figured out my career, should have saved money, should have started sooner, should have known better.

Should, should, should. You know what should does? It takes today's possibilities and beats you over the head with yesterday. I'm done with that. I cannot change when I started, but I can decide what I do next. Number two, I'm too old. Too old for what? To learn? To change? To get stronger? To start something? To fall in love with your life again?

Show me the paperwork. Who made that rule? Because I'm 60, and apparently I'm taking piano lessons, playing pickleball, building a coaching business, and learning things I never thought I'd learn. If somebody has an age limit policy, I'd love to speak to management. Number three, I need to know exactly how this turns out.

This is a big one for me. I don't know exactly where this chapter leads, and maybe that's the adventure. I don't need the itinerary, I just need to board the plane. Maybe that's faith. Not knowing exactly where every turn will take you, but trusting the one who does.

What if God isn't done with you? And this is where turning 60 has become something much deeper for me because I believe God knew every version of me. The young woman, the woman building a family, the woman struggling with her body, the woman questioning herself, the woman learning, the woman starting over, the mom becoming a coach, and this woman turning 60.

Maybe God never looked at any of those versions and thought, "She's behind." Maybe I was the one doing that. Maybe he knew all along that every chapter was preparing me for the next one, and maybe the woman I'm becoming needed everything I've lived through to become her. The mistakes, the weight struggles, the doubts, the motherhood, the marriage, the businesses, the disappointments, the learning, the starting over.

None of it was wasted, and maybe you need to hear that too. You are not late to your own life. If you had asked younger me what 60 looked like, I probably would have said old. Sorry, but I would have. Now, I think 60 looks like freedom, wisdom, strength, curiosity, grandkids, boundaries, pickleball, purpose, and not giving nearly as many hoots about things that never mattered anyway.

I thought by 60, I'd finally have life figured out. I finally figured out that I don't have to, and there is so much more freedom in that. So here's my birthday wish this year. I don't wish to be younger.

I don't want my 40-year-old body back. I don't want to erase the wrinkles. I don't want to rewind my life. My birthday wish is this: I want to be fully here for the woman I'm becoming. I want to keep saying yes when God nudges me. I want to keep doing things that scare me a little. I want to stay curious. I want to keep taking care of my mind and body, not because I'm desperately trying to stay young, but because I have things I still want to do, people I wanna love, places I wanna go, women I want to help, memories I haven't made yet, and grandkids I fully intend to keep up with.

So yes, I'm turning 60, and no, I don't have it all figured out. Thank goodness, because that means there's still mystery, still possibility, still growth, still adventure, still more of me I haven't met yet. And maybe that's what this birthday is really about. Not looking backward asking, "Where did the years go?"

But looking forward and asking, "What am I going to do with the years I have?" Because I haven't finished becoming. I finally started becoming the woman God always knew I could be. And girlfriend, she's just getting warmed up. Welcome to chapter 60. Let's go. So I want you to do something for me. Finish these three sentences.

I'm ready to stop... I'm ready to start... I'm becoming a woman who... And don't write what sounds responsible. Write what you actually want. Then ask yourself one final question. If I truly believed my best chapter could still be ahead of me, what would I do next? There's your next step. Take it.

I'll see you next time on Mind and Body Reset.`;

const youtubeDescription = `Is 60 too old to start over? Lee Anne turns 60 and asks when we decided women have an expiration date.

You're not lost. You're unfinished. Board Flight 60.

Read the full article: https://mindandbodyresetcoach.com/health-wellness-blog/is-60-too-old-to-start-over
Show notes: https://mindandbodyresetcoach.com/midlife-health-podcast/is-60-too-old-to-start-over
Book a free call: https://mindandbodyresetcoach.com/book

Chapters:
00:00 I still don't know what I want to be when I grow up
00:48 Life isn't a staircase (it's an airport)
02:00 The 2019 picture
03:00 When did women get an expiration date?
04:00 "Is this it?" Gratitude and desire
04:50 You're not lost. You're unfinished
05:20 Pro-living, not anti-aging
06:10 Three things to leave at the gate
07:00 What if God isn't done with you?
08:15 Birthday wish
09:40 Your next-chapter challenge

#midlife #womenover50 #womenover60 #startingover #mindset`.trim();

const habitActionsJson = JSON.stringify([
  {
    title: "Write your three sentences",
    type: "once",
    description:
      "I'm ready to stop… I'm ready to start… I'm becoming a woman who… Write what you actually want, not what sounds responsible.",
  },
  {
    title: "Take one next-chapter action",
    type: "habit",
    description:
      "If you truly believed your best chapter was still ahead, what would you do next? Do that.",
  },
]);

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: podcastEpisodes.id, videoId: podcastEpisodes.videoId })
    .from(podcastEpisodes)
    .where(
      or(eq(podcastEpisodes.videoId, videoId), eq(podcastEpisodes.slug, slug))
    )
    .limit(1);

  const values = {
    videoId,
    slug,
    title,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt: new Date("2026-08-21T15:00:00.000Z"),
    youtubeDescription,
    showNotesHtml,
    transcript,
    seoTitle: "Is 60 Too Old to Start Over? | Podcast Show Notes",
    seoDescription:
      "Show notes: is 60 too old to start over? Flight 60 — women don't have an expiration date, unfinished not lost, pro-living, and a next-chapter challenge.",
    habitActionsJson,
    linkedBlogSlug: blogSlug,
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
      "video=",
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
