/**
 * Publish definitive guide: How to Calm Food Noise After 40
 * Expands pillar post with accurate, brand-voice, SEO-optimized content.
 * Slug unchanged for indexing continuity.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
import { storagePut } from "../server/storage";

const slug = "calming-food-noise-drop-the-food-courtroom";

const title = "How to Calm Food Noise After 40 (Without Another Diet)";

const seoTitle = "How to Calm Food Noise After 40 (Without Another Diet)";

const seoDescription =
  "How to calm food noise after 40: what food noise is, why restriction and midlife amplify it, what GLP-1s often change, and practical skills to quiet the mental food fight — without another diet.";

const excerpt =
  "If your brain will not stop negotiating about food — especially after 40 — that is food noise. Here is how to calm it without more restriction, willpower lectures, or another diet that backfires.";

const coverImageAlt =
  "Calm midlife woman at dusk with tea — quieter evenings after learning how to calm food noise";

const plateImageAlt =
  "Midlife woman building a balanced plate — eating enough on purpose to lower food noise";

const schemaFaqJson = JSON.stringify([
  {
    question: "What is food noise?",
    answer:
      "Food noise is persistent, often unwanted mental chatter about food — planning, craving, negotiating, and guilt — that takes up bandwidth even when you are not clearly hungry. It is a lived experience term, not a formal medical diagnosis.",
  },
  {
    question: "Is food noise the same as being hungry?",
    answer:
      "No. Hunger is a physical need that usually eases after eating. Food noise can show up after a meal and feel urgent, emotional, or looping rather than purely physical.",
  },
  {
    question: "Why is food noise louder after 40?",
    answer:
      "Midlife often stacks sleep disruption, stress, years of dieting history, and shifting hormones that can change how hunger and fullness feel. Louder noise does not mean you failed — it means your system is working overtime.",
  },
  {
    question: "Does restriction make food noise worse?",
    answer:
      "Often yes. When intake is too low or foods are heavily forbidden, the brain can treat food as scarce and turn up preoccupation. Adequate, consistent meals usually lower noise more than white-knuckle willpower.",
  },
  {
    question: "Do GLP-1 medications quiet food noise?",
    answer:
      "Many people report a big drop in food chatter and cravings while on GLP-1 medications. Experiences vary. These are medical treatments — whether they are right for you is a decision with your prescribing clinician.",
  },
  {
    question: "Will food noise come back if I stop a GLP-1?",
    answer:
      "Often appetite and food preoccupation return after stopping for many people. That is commonly described as biology and habit patterns reasserting — not a character flaw. Plan support with your care team if treatment changes.",
  },
  {
    question: "Can I calm food noise without medication?",
    answer:
      "Many women lower the volume with regular balanced meals, enough food (not chronic restriction), sleep, stress care, fewer good/bad food rules, and skills for evening urges. Results vary; some still need clinical care.",
  },
  {
    question: "Is food noise just emotional eating?",
    answer:
      "Emotions can trigger it, but so can under-fueling, sleep debt, stress, food cues, and diet history. Treating it as “only emotions” misses the full picture.",
  },
  {
    question: "When should I get professional help for food thoughts?",
    answer:
      "If food thoughts dominate your day, drive distress or secrecy, disrupt work or relationships, or pair with binge/restrict cycles, talk with a clinician and consider a therapist or dietitian experienced with midlife and disordered eating.",
  },
  {
    question: "How do I calm food noise tonight?",
    answer:
      "Eat a real dinner with protein and fiber, pause and name the urge, ask “Who is driving — future me or craving me?”, and use one off-ramp (walk, tea, brush teeth, leave the kitchen). One skill beats another empty promise to “be good tomorrow.”",
  },
]);

const schemaHowToStepsJson = JSON.stringify([
  {
    name: "Eat enough on purpose",
    text: "Build regular meals with protein and fiber so your body does not treat food as scarce. Under-eating is rocket fuel for food noise.",
  },
  {
    name: "Name the urge",
    text: "Label what is happening: true hunger, stress, habit, boredom, or leftover diet rules. Naming creates a pause between stimulus and response.",
  },
  {
    name: "Drop the food courtroom",
    text: "Stop putting foods on trial as good or bad. Neutrality reduces the forbidden charge that keeps the mental loop going.",
  },
  {
    name: "Build an evening off-ramp",
    text: "Nights are when food noise peaks for many women. Plan a wind-down ritual before the kitchen becomes the default.",
  },
  {
    name: "Practice one pause",
    text: "When a craving hits, take one breath and ask: Who is driving — future me or craving me? Then choose the next small vote.",
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
const calmLocal = path.join(sessionImagesDir, "3.jpg");
const plateLocal = path.join(sessionImagesDir, "4.jpg");

function figure(src: string, alt: string, caption: string): string {
  return `
<figure style="margin:1.75rem 0;">
  <img src="${src}" alt="${alt}" style="width:100%;height:auto;border-radius:16px;display:block;" loading="lazy" />
  <figcaption style="margin-top:0.5rem;font-size:0.875rem;color:#6b7280;text-align:center;">${caption}</figcaption>
</figure>`.trim();
}

function buildContent(imgs: { calm: string; plate: string }): string {
  return `
<p>If you have been searching <strong>how to calm food noise</strong>, you already know the soundtrack:</p>
<p><em>“Should I?” “I shouldn’t.” “I’ll start Monday.” “Why am I thinking about this again?”</em></p>
<p>That constant mental chatter about food — planning it, resisting it, regretting it — is exhausting. Especially after 40, when the same old “try harder” strategies stop working and the volume somehow goes <em>up</em>.</p>
<p>Here is the reframe I want you to hear first: <strong>food noise is not a character flaw.</strong> It is not proof you lack discipline. It is a mix of biology, history, stress, sleep, and diet culture — and it can get quieter.</p>
<p>This guide is the full midlife version: what food noise actually is, why restriction makes it worse, what GLP-1 medications often change (and what they don’t), and the practical skills that help women 40+ reclaim mental bandwidth without another diet.</p>
<p><em>Coaching education only — not medical or dietetic advice. Medication and medical decisions belong with your healthcare team.</em></p>

<h2>What is food noise?</h2>
<p>Food noise is persistent, often unwanted mental chatter about food. It is the background hum of diet culture living rent-free in your head:</p>
<ul>
  <li>“I shouldn’t eat that.”</li>
  <li>“I already blew it — might as well keep going.”</li>
  <li>“What will I eat next?”</li>
  <li>“Why can’t I stop thinking about the pantry?”</li>
</ul>
<p>Researchers and clinicians increasingly use “food noise” as everyday language for <strong>distressing or intrusive food thoughts</strong> that take mental bandwidth — more than ordinary meal planning, and different from simple hunger that eases after you eat.</p>
<p>It is <strong>not</strong> a formal medical diagnosis. It is a real lived experience. And for many women over 40, it is the part of weight loss that feels the most unfair: you can “know what to do” and still feel hijacked by the loop.</p>

<h2>Food noise vs hunger vs “I like food”</h2>
<p><strong>Hunger</strong> is a physical need. It usually builds, and it usually softens after a real meal.</p>
<p><strong>Enjoying food</strong> is normal. Planning dinner is normal. Buying groceries is normal.</p>
<p><strong>Food noise</strong> is when the thoughts feel rigid, sticky, or stressful — when food stays on your mental desktop even after you ate, or when every snack becomes a courtroom case.</p>
<p>If you only treat noise as “emotional eating,” you miss half the story. Emotions matter. So do under-fueling, sleep debt, stress load, food cues (ads, smells, open kitchens), and years of starting over every Monday.</p>

${figure(imgs.calm, coverImageAlt, "Quiet is not perfection. Quiet is enough mental space to live your life.")}

<h2>Why restriction makes food noise louder</h2>
<p>When your brain detects scarcity — fewer calories, banned foods, rigid rules — it often turns up obsession. That is not weakness. That is a survival-style response: <em>food is scarce → think about food more.</em></p>
<p>Severe restriction has a long history of producing obsessive food thinking. You do not need a starvation experiment in your kitchen to feel a milder version of the same pattern. More rules can mean more panic, more planning, and more 9 p.m. battles.</p>
<p>So if every diet left you louder, not freer, you are not broken. You were practicing a strategy that amplifies noise.</p>
<p>Related: <a href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works">how to stop sugar cravings at night</a> — because evenings are when the courtroom gets the loudest for many women.</p>

<h2>Why food noise often gets louder after 40</h2>
<p>Midlife does not invent food noise. It stacks amplifiers:</p>
<ul>
  <li><strong>Hormonal shifts</strong> that can change how hunger, fullness, and cravings <em>feel</em> (perimenopause and menopause context — not a DIY diagnosis)</li>
  <li><strong>Sleep fragmentation</strong> — 3 a.m. wake-ups, night sweats, lighter sleep</li>
  <li><strong>Higher stress load</strong> with less recovery time</li>
  <li><strong>Decades of diet identity</strong> — “I am someone who is always starting over”</li>
  <li><strong>Metabolic context</strong> many women are navigating — see our guide on <a href="/insulin-resistance-after-40">insulin resistance after 40</a> (education, not a label we slap on you from a blog)</li>
</ul>
<p>If the scale feels stuck even when you eat less, that is often patterns plus midlife biology — not proof you need more self-hate. Read: <a href="/health-wellness-blog/why-am-i-gaining-weight-after-40-even-when-i-eat-less">Why am I gaining weight after 40 even when I eat less?</a></p>

<h2>GLP-1s and food noise: what many people notice</h2>
<p>A lot of women hear about food noise for the first time because of GLP-1 medications (medications in the class used for type 2 diabetes or weight management, prescribed by clinicians — brand names you see in the news include drugs like Ozempic, Wegovy, Mounjaro, Zepbound, and others).</p>
<p><strong>What many people report while on them:</strong> the volume drops. Less constant craving. Less day-long food monologue. More ability to choose without a full-time mental fight.</p>
<p>That matches what clinicians and patient education often describe: these medications can reduce hunger, increase fullness, and change craving intensity for many people — by acting on gut–brain appetite signaling, not by giving you “more willpower.”</p>
<p><strong>What many people notice when medication changes or stops:</strong> appetite and food preoccupation often return. For some, the <em>return of the noise</em> is as distressing as any change on the scale. That is commonly described as biology and old habit loops reasserting — not a personal failure.</p>
<p><strong>What coaching can and cannot do here:</strong></p>
<ul>
  <li>We can help you build skills for quieter evenings — on medication, off medication, or never on medication.</li>
  <li>We cannot tell you to start, stop, or change a dose. That is your prescribing clinician’s lane.</li>
  <li>We will not shame you for using a medical tool — or for wanting a non-drug path.</li>
</ul>
<p>If you are navigating the transition after a GLP-1, start here: <a href="/life-after-glp-1">Life after GLP-1 — habits, food noise, and maintenance</a>.</p>

${figure(imgs.plate, plateImageAlt, "Eating enough on purpose is not “giving up.” It is how you turn the volume down.")}

<h2>How to calm food noise after 40 (what actually helps)</h2>
<p>These are not another set of food rules. They are volume dials.</p>

<h3>1. Eat enough on purpose</h3>
<p>Under-eating is rocket fuel for obsession. Prioritize real meals — protein and fiber help many women feel steadier. Satisfaction is a nervous-system signal of safety. If your plan only works when you are slightly miserable, it is not a midlife plan. It is a temporary white-knuckle streak.</p>

<h3>2. Name the urge</h3>
<p>Say it out loud or write it down: “This is stress.” “This is habit.” “This is true hunger.” “This is leftover diet rules.” Naming creates a pause between stimulus and response. You cannot rewire what you refuse to see.</p>

<h3>3. Drop the food courtroom</h3>
<p>Stop putting cookies on trial. When foods lose their forbidden charge, they often lose their grip. Neutrality is advanced work — and it is learnable. Shame is not a nutrition strategy.</p>

<h3>4. Reduce all-day decision chaos</h3>
<p>Constant mini-decisions keep food on the mental desktop. Structured meals can lower decision load without becoming a rigid “plan cult.” You are building patterns, not collecting gold stars.</p>

<h3>5. Build an off-ramp for nights</h3>
<p>Evenings are peak food-noise hours for many women. Use a wind-down ritual before the kitchen becomes the default. The free <a href="/snack-hack">Snack Hack guide</a> is built for this exact 9 p.m. battle.</p>

<h3>6. Treat sleep and stress as food strategies</h3>
<p>Chronic stress and poor sleep increase craving intensity. Midlife health is whole-person. Nervous-system regulation is not optional fluff — it is part of how you quiet the loop.</p>

<h3>7. Try a movement snack before a pantry raid</h3>
<p>Sometimes the body is asking for circulation, not cookies. Two minutes of movement can change the channel. See: <a href="/health-wellness-blog/what-if-you-did-an-exercise-snack-instead">What if you did an exercise snack instead?</a></p>

<h3>8. Change the identity story</h3>
<p>As long as you identify as “someone who is always on a diet,” food stays center stage. The work is becoming someone who keeps promises to herself — the heart of <a href="/reclaim">R.E.C.L.A.I.M. 1:1 coaching</a>.</p>

<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Not sure what is keeping you stuck?</p>
  <p style="margin:0;">Take the free <a href="/food-quiz">60-second food &amp; mindset quiz</a> — no judgment, just clarity — then come back to these tools with a clearer next step.</p>
</div>

<h2>Three practices to start tonight</h2>
<ol>
  <li><strong>Ask a better question.</strong> Swap “Why can’t I stop?” for “What is interrupting my peace right now — hunger, stress, habit, or rules?”</li>
  <li><strong>Create a two-line victory list.</strong> Write two things you did well today with food or self-talk. Your brain is a scoreboard. If you only track misses, motivation dies.</li>
  <li><strong>Practice one pause.</strong> When a craving hits, take one breath and ask: <em>“Who is driving — future me or craving me?”</em> Somebody gets the keys. You choose.</li>
</ol>
<p>Track those wins in our free <a href="/habit-tracker">habit tracker</a> if you like a simple scoreboard without turning life into a spreadsheet.</p>

<h2>What success feels like (so you recognize it)</h2>
<p>Quieter evenings. Fewer debates. More presence at the table. The ability to leave one cookie in the package without a three-act drama.</p>
<p>The goal is not perfect eating. The goal is <strong>mental freedom</strong> — so food is food again, not a full-time job.</p>
<p>You are not failing. You are practicing. Every pause is a vote for the woman you are becoming.</p>

<h2>When to get more support</h2>
<p>If food thoughts dominate your day, drive secrecy or distress, disrupt work or relationships, or pair with binge/restrict cycles, please loop in clinical support — a physician, a therapist, or a registered dietitian experienced with midlife and disordered eating. Coaching is powerful for patterns and skills. It is not a substitute for medical or mental health care.</p>

<h2>FAQs: how to calm food noise after 40</h2>

<h3>What is food noise?</h3>
<p>Persistent mental chatter about food — planning, craving, negotiating, guilt — that takes bandwidth even when you are not clearly hungry. A lived experience term, not a formal diagnosis.</p>

<h3>Is food noise the same as hunger?</h3>
<p>No. Hunger is physical and usually eases after eating. Food noise can loop after meals and feel sticky or urgent.</p>

<h3>Why is my food noise louder in my 40s?</h3>
<p>Sleep, stress, diet history, and midlife hormonal shifts often stack. Louder does not mean you failed.</p>

<h3>Does dieting make food noise worse?</h3>
<p>Often yes. Scarcity and forbidden foods can turn the volume up. Enough food plus fewer moral rules usually helps.</p>

<h3>Do GLP-1s turn off food noise?</h3>
<p>Many people report a big drop while on medication. Experiences vary. Medication decisions stay with your clinician.</p>

<h3>Will the noise come back if I stop a GLP-1?</h3>
<p>Often appetite and preoccupation return for many people. That is common — not a character flaw. Skills matter on and off medication.</p>

<h3>Can I quiet food noise without medication?</h3>
<p>Many women can lower the volume with meals, sleep, stress care, environment design, and thought work. Some still need clinical care. Both paths deserve respect.</p>

<h2>Key takeaways</h2>
<ul>
  <li>Food noise is mental preoccupation with food — different from simple hunger, and not a moral failure.</li>
  <li>Restriction, under-eating, stress, and sleep debt often amplify it; midlife stacks more amplifiers.</li>
  <li>GLP-1s often quiet noise for many people while on them; noise may return when treatment changes — plan skills either way.</li>
  <li>Calm comes from safety, satisfaction, pauses, and identity work — not harsher diets.</li>
  <li>Consistency beats perfection. You are practicing.</li>
</ul>

<div style="padding:1.25rem 1.5rem;border-radius:12px;background:oklch(0.96 0.02 148);border:1px solid oklch(0.90 0.03 148);margin:1.75rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">Want help rewriting the pattern — not just white-knuckling tonight?</p>
  <p style="margin:0 0 0.75rem;"><a href="/book">Book a free clarity call</a> with Lee Anne. We’ll look at what is interrupting your peace and whether 1:1 coaching is the right fit. No pressure. No meal-plan lecture.</p>
  <p style="margin:0;">Or start free: <a href="/food-quiz">food quiz</a> · <a href="/snack-hack">Snack Hack</a> · <a href="/habit-tracker">habit tracker</a> · <a href="/reclaim">R.E.C.L.A.I.M. coaching</a></p>
</div>

<p>Keep going. Quiet is possible — and you do not have to earn it with another round of punishment.</p>
`.trim();
}

async function uploadImage(localPath: string, key: string): Promise<string> {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Image not found: ${localPath}`);
  }
  const buf = fs.readFileSync(localPath);
  const { url } = await storagePut(key, buf, "image/jpeg");
  console.log("Uploaded", key, "->", url);
  return url;
}

async function main() {
  for (const p of [calmLocal, plateLocal]) {
    if (!fs.existsSync(p)) throw new Error(`Missing image: ${p}`);
  }

  const calmUrl = await uploadImage(
    calmLocal,
    `blog-images/${slug}-calm-evening.jpg`
  );
  const plateUrl = await uploadImage(
    plateLocal,
    `blog-images/${slug}-balanced-plate.jpg`
  );

  // Prefer new calm image as cover (more on-message than old cover if any)
  const coverUrl = calmUrl;

  if (!fs.existsSync(publicBlogDir)) fs.mkdirSync(publicBlogDir, { recursive: true });
  fs.copyFileSync(calmLocal, path.join(publicBlogDir, `${slug}-calm-evening.jpg`));
  fs.copyFileSync(plateLocal, path.join(publicBlogDir, `${slug}-balanced-plate.jpg`));

  const content = buildContent({ calm: calmUrl, plate: plateUrl });

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
    category: "Mindful Eating & Nutrition",
    coverImage: coverUrl,
    coverImageAlt,
    published: true,
    // Keep original publish date for history; bump updatedAt via DB default on update
    publishedAt: existing?.publishedAt ?? new Date("2026-07-10T17:54:31.000Z"),
    seoTitle,
    seoDescription,
    schemaTypes: "Article,FAQ,HowTo",
    schemaFaqJson,
    schemaHowToStepsJson,
    schemaVideoUrl: null as string | null,
    schemaVideoDescription: null as string | null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(blogPosts).set(values).where(eq(blogPosts.id, existing.id));
    console.log("Updated food-noise post id=", existing.id);
  } else {
    await db.insert(blogPosts).values({
      ...values,
      publishedAt: new Date(),
    });
    console.log("Inserted food-noise post");
  }

  // Word-ish count for sanity
  const text = content.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  console.log("Approx word count:", words);
  console.log(`https://mindandbodyresetcoach.com/health-wellness-blog/${slug}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
