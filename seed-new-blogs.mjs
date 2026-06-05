import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DB_URL);

const posts = [
  // ── POST 1: Postpartum Energy ─────────────────────────────────────────────────────────────
  {
    title: 'Rebuilding Your Body After Baby: How I Got My Energy and Confidence Back',
    slug: 'rebuilding-your-body-after-baby-how-i-got-my-energy-and-confidence-back',
    category: 'Postpartum Health',
    publishedAt: new Date('2026-06-02'),
    excerpt: 'After having a baby, everyone talks about the weight—but almost no one talks about the fatigue, brain fog, and losing your sense of self. Learn how I rebuilt my energy and confidence without extreme dieting.',
    coverImage: '/blog/postpartum_energy_recovery_1780339071077.png',
    seoTitle: 'Rebuilding Your Body After Baby: How I Got My Energy and Confidence Back | Mind and Body Reset',
    seoDescription: 'Discover a sustainable framework for regaining energy, clearing brain fog, and feeling confident in your body postpartum without extreme dieting.',
    content: `<p>After having a baby, everyone talks about the weight—but almost no one talks about the fatigue, the brain fog, and the feeling like you're not quite yourself anymore. It isn't just a physical transition; it's a mental one. You are adjusting to a new identity, a new rhythm, and a new version of your body. Many women quietly wonder, "Will I ever feel like me again?" I remember that feeling, and I remember thinking that maybe this was just what postpartum felt like now.</p>

<h2>What Actually Worked After My First Baby</h2>
<p>After my first baby, we made some simple—but powerful—changes. It wasn't a restrictive diet, but a focus on structure. We changed what foods we kept in the house, how we built our meals, and how often we were eating.</p>
<p>About seven months postpartum, I introduced intermittent fasting. Not aggressively or perfectly, but consistently. Something surprising happened: my fatigue started lifting, my brain fog cleared, and my energy came back. By the time my baby turned one, I was in the best shape of my life—not just physically, but mentally.</p>

<h2>A Different Journey: The Second Pregnancy</h2>
<p>Then came baby number two, and this pregnancy humbled me. It was harder, and I ended up on bedrest. That meant less movement, less control, and a much bigger mental struggle. If you have ever been in a season where your body can't do what it used to, you know how frustrating that feels. This wasn't just physical anymore; it was a mindset battle.</p>

<h2>Focusing on Foundations (What Changed Everything)</h2>
<p>After my second baby, I didn't rush. I didn't jump back into fasting immediately, and I didn't force workouts. Instead, I focused on foundational habits first:</p>
<ul>
  <li><strong>Letting my body heal:</strong> Giving myself the grace and time necessary for recovery.</li>
  <li><strong>Nourishing while breastfeeding:</strong> Focusing on fueling my body, not restricting it.</li>
  <li><strong>Supporting my energy:</strong> Making choices that restored energy rather than draining it.</li>
</ul>

<p>I went back to the basics:</p>
<ol>
  <li><strong>Plate Structure:</strong> Prioritizing protein first, building balanced meals, and eliminating mindless eating.</li>
  <li><strong>Eating Boundaries:</strong> Stopping the constant snacking, late-night eating, and middle-of-the-night grazing.</li>
  <li><strong>Gentle Awareness:</strong> Paying attention to my habits without pressure and making small adjustments along the way.</li>
</ol>

<h2>The Missing Piece Most Women Overlook: Mindset</h2>
<p>This is the part that truly changed everything. After my second pregnancy, my mindset was tested in ways it had never been before. There were days I struggled, felt stuck, and didn't recognize myself. That's where coaching became invaluable. I learned that your results don't come from your plan alone—they come from how you think while you are in the process.</p>
<p>You can have the "perfect" plan, but if your thoughts sound like "This isn't working," or "I'll never get back," you won't stay consistent long enough to see results.</p>

<h2>The Simple Framework That Changes Everything</h2>
<p>Looking back, my journey to recovery falls into three distinct pillars:</p>
<ul>
  <li><strong>Reclaim:</strong> Support your body with real nourishment (not restriction).</li>
  <li><strong>Reset:</strong> Create structure with your eating habits (not chaos or grazing).</li>
  <li><strong>Rewire:</strong> Change how you think about your body and progress (not self-criticism).</li>
</ul>

<p>If you are postpartum or simply feeling disconnected from your body right now, please hear this: You are not behind. You are not broken. And you don't need to rush. Your body isn't something to fight; it's something to rebuild a relationship with, and that takes time, consistency, and the right mindset.</p>

<h2>You Don't Have to Do This Alone</h2>
<p>If you're reading this and thinking, "I want this, but I don't know where to start," that is exactly why I created my Mind & Body Reset coaching. We simplify your nutrition, build sustainable structure, and rewire the thoughts keeping you stuck.</p>
<p>Ready to feel confident, clear, and in control again? <a href="/book">Apply for a Clarity Call today</a> and let's build your plan.</p>`
  },

  // ── POST 2: Reclaim, Rewire, Reset ─────────────────────────────────────────────────────────────
  {
    title: 'Reclaim, Rewire, Reset: Become a Different Decision Maker',
    slug: 'reclaim-rewire-reset-become-a-different-decision-maker',
    category: 'Thought Work',
    publishedAt: new Date('2026-06-03'),
    excerpt: "Traditional weight loss methods fail when they focus only on behavior without addressing your underlying identity. Learn how to reclaim your body, rewire your mind, and reset your standards.",
    coverImage: '/blog/mindset_decision_maker_1780339085678.png',
    seoTitle: 'Reclaim, Rewire, Reset: Become a Different Decision Maker | Mind and Body Reset',
    seoDescription: 'Transform your approach to weight loss by changing your identity. Learn the Reclaim, Rewire, Reset method for lasting mind and body health.',
    content: `<p>Let's face it: traditional weight loss methods often fail not because we lack motivation, but because we haven't addressed the underlying identity issues that drive our decisions around food. Many wonder why their efforts haven't yielded results—blaming hormones, age, or a lack of effort. The truth is simpler yet profound: you're trying to change behavior without changing your identity. It's like renovating a house; fresh paint won't suffice if the foundation is cracked and the closets are cluttered.</p>

<h2>The Decision-Maker Dilemma</h2>
<p>Imagine your weight loss journey as an attempt to decorate dysfunction—buying new plans, apps, and supplements without addressing the core issue: flawed decision-making. When cravings hit and you say, "I'll start over tomorrow," it's a decision rooted in an unchanged identity. True success comes when you become a different decision-maker, not when you simply find a better diet.</p>

<h2>Phase 1: Reclaim Your Body</h2>
<p>The first phase of transformation is about stabilization. Many women feel disconnected from their bodies, seeing them as betrayers when nothing seems to work anymore. Reclaiming involves clearing away the junk and focusing on the "big rocks": fiber, protein, calorie awareness, exercise, sleep, and emotional regulation.</p>
<p>We start with subtraction before addition. Removing just one sabotaging habit can be transformative. For example, by eliminating weekend wine and grazing, many clients have stabilized their energy, quieted food noise, and finally seen progress on the scale.</p>

<h2>Phase 2: Rewire Your Mind</h2>
<p>Most weight loss programs give you food rules but neglect the crucial element: your mindset. Your brain operates like a GPS, constantly routing you back to the same behaviors if it's programmed with limiting beliefs like "I can't trust myself" or "It's my hormones."</p>
<p>Rewiring updates your identity. Instead of declaring defeat, you learn to affirm, "I recover quickly," or "One decision doesn't define me." This mental shift ensures that your behavior aligns with the new identity you're building.</p>

<h2>Phase 3: Reset Your Standards</h2>
<p>The final phase focuses on creating standards, not relying on motivation, which is fleeting. Standards are structural; they define who you are. It's time to say goodbye to hero streaks, 30-day extremes, and white-knuckling your way through diets.</p>
<p>Success isn't glamorous—it is born of boring, repetitive habits. It may take longer than you think, but the results are lasting because your body responds to consistency, not intensity.</p>

<h2>Building a New Identity</h2>
<p>Women who complete this method don't become obsessive; they become calm and collected, no longer at war with food. This transformation isn't about dieting; it's about identity change. Realizing you don't feel at war with food for the first time in decades is a powerful feeling.</p>
<p>Hard work and structure build this change, not a new supplement plan. High-performance individuals recognize the need for support in business, athletics, and leadership—and your body deserves the same level of investment.</p>

<p>If you're tired of negotiating with yourself and ready to become a different decision-maker, let's stop decorating dysfunction and start building a foundation for a healthier you. <a href="/reclaim">Join the Reclaim Program today</a> and start your transformation.</p>`
  },

  // ── POST 3: When Your Body Stops Responding ─────────────────────────────────────────────────────────────
  {
    title: 'When Your Body Stops Responding: Finding the Balance Between Natural and Medical Support',
    slug: 'when-your-body-stops-responding-finding-the-balance',
    category: 'Hormonal Health',
    publishedAt: new Date('2026-06-04'),
    excerpt: "What do you do when everything that used to work suddenly stops? Read how integrating natural strategies and medical support changed everything when I lost control of my health.",
    coverImage: '/blog/healing_balance_hormones_1780339100250.png',
    seoTitle: 'When Your Body Stops Responding: Balancing Natural and Medical Support | Mind and Body Reset',
    seoDescription: 'Learn why a combination of natural and medical support might be exactly what your body needs to heal from hormonal and autoimmune imbalances.',
    content: `<p>I thought I was doing everything right... and my body was still falling apart. In my late 20s, I was dealing with blood clots, thyroid nodules, and Graves' disease. It felt like no matter how hard I tried, I was losing control. My energy was gone, my body was changing, and no one could give me a clear answer.</p>

<p>Maybe you've felt this too. It feels like your body suddenly has its own agenda. Like what used to work simply doesn't anymore. But here's what shocked me: what finally turned things around wasn't just medication, and it wasn't just fasting. It was learning how to strategically combine both. And that changed everything.</p>

<h2>When Your Body Stops Responding</h2>
<p>A few years ago, I was diagnosed with Graves' disease while simultaneously dealing with blood clots. I couldn't just jump in and "fix everything" at once. That's where the frustration really set in.</p>
<p>When your body is struggling, you want a solution immediately. But instead, I had to slow down. I had to treat one issue, wait, and then address the next. It felt like I was constantly behind, trying to catch up to my own body.</p>

<h2>I Did What I Was "Supposed" to Do</h2>
<p>Once the blood clots were under control, I went all in on natural solutions. I followed fasting protocols, leaned into my fitness knowledge, and stayed consistent. And to be fair, it worked. My symptoms improved and my thyroid nodule disappeared. It felt like a huge win.</p>

<h2>The Part No One Talks About</h2>
<p>But then something unexpected happened. I started losing muscle—not just a little, but a lot. If you've ever experienced that, you know how unsettling it is. Your strength changes, your energy drops, and your body doesn't feel like yours anymore. I realized I had solved one problem but created another.</p>

<h2>The Shift: It Wasn't "This or That"</h2>
<p>This is where everything changed for me. I stopped thinking in terms of "natural vs. medical" and started asking, "What does my body actually need right now?"</p>
<p>That led me to integrated functional health support. What I learned was simple but powerful: my body didn't need more restriction; it needed support. With the right medical intervention, combined with what I was already doing, everything started to come back online.</p>

<h2>What Happened Next</h2>
<p>Within three months, my energy came back, my muscle started rebuilding, and my body felt stable again. Both my Graves' and Hashimoto's became manageable. Not perfect, but manageable. And honestly, that is what most women are really looking for—not perfection, just to feel like themselves again.</p>

<h2>3 Things You Can Start Today</h2>
<p>Your body is not broken, but it is complex. Sometimes the answer isn't more discipline; it's a better strategy. If you feel like your body is working against you, start here:</p>
<ol>
  <li><strong>Stop forcing one solution to fix everything:</strong> Your body might need more than one approach. The goal isn't purity; the goal is progress.</li>
  <li><strong>Pay attention to what your body is losing, not just gaining:</strong> Energy, strength, sleep, and mood matter just as much as weight or labs. Listen to the feedback your body is giving you.</li>
  <li><strong>Build a plan that supports your body, not fights it:</strong> More restriction is not always the answer. Sometimes your body needs more nourishment, more recovery, and more balance—not more pressure.</li>
</ol>

<p>You can take control again, not by doing more, but by doing what actually works for your body. If you want help figuring out what your body actually needs, <a href="/book">book a clarity call</a>. We'll look at what's going on and build a plan that makes sense for you. No guessing, no overwhelm. Just clarity.</p>`
  },

  // ── POST 4: Mastering Insulin ─────────────────────────────────────────────────────────────
  {
    title: 'Mastering Insulin: Fueling Fat Burning and Energy After 40',
    slug: 'mastering-insulin-fueling-fat-burning-and-energy-after-40',
    category: 'Menopause & Hormonal Health',
    publishedAt: new Date('2026-06-05'),
    excerpt: "Energy crashes and brain fog in your 40s often point to unstable insulin levels. Learn how to stabilize your insulin, stop constant cravings, and fuel your metabolism the smart way.",
    coverImage: '/blog/metabolism_after_40_1780339113905.png',
    seoTitle: 'Mastering Insulin: Fueling Fat Burning and Energy After 40 | Mind and Body Reset',
    seoDescription: 'Struggling with weight loss and energy crashes after 40? Discover how stabilizing insulin can transform your metabolism and overall wellness.',
    content: `<p>As we navigate life after 40, energy crashes and brain fog often become unwelcome companions. Many women find themselves exercising, cutting carbs, and skipping meals, yet still feel stuck in their wellness journey. The common culprit? Insulin. When insulin levels are unstable, your body struggles to access fat and regulate appetite effectively.</p>

<h2>Understanding the 40+ Metabolism</h2>
<p>After turning 40, our bodies undergo significant changes. What worked at 30 may no longer yield the same results. It's akin to showing up to a familiar game, only to find that the rules have changed overnight. One critical change is the drop in estrogen levels, which leads to insulin becoming more dominant. An elevated insulin level can lead to increased fat storage, energy crashes, and aggravated cravings.</p>
<p>But what if the issue isn't about discipline or working harder? Perhaps your metabolism simply needs a supportive nudge in the right direction.</p>

<h2>Supporting Your Metabolism with Simple Tools</h2>
<p>Think of your body as a bustling city at rush hour, and your bloodstream as the freeway. Every time you consume carbohydrates, glucose floods the freeway, with insulin acting as the traffic cop. Constant snacking can lead to congestion. That's where strategic support comes in.</p>

<h3>Fiber and Glucose Management</h3>
<p>Using a clinically studied fiber blend before meals functions like adding extra lanes to the freeway. It helps slow glucose absorption, supporting healthy A1C levels and improving insulin sensitivity. This also helps reduce the spikes in blood sugar, which are crucial for women aged 40 to 60 as they face unique metabolic challenges. Fiber aids in making fasting easier by helping you feel full longer, thus supporting your metabolism without the struggle.</p>

<h3>The Power of Yerba Mate</h3>
<p>Unlike typical energy drinks, a high-quality Yerba mate beverage delivers calm energy, mental clarity, and support for fat oxidation. This is perfect during a fasting window, helping you maintain focus and avoid the temptation to snack.</p>

<h2>Embracing a Sustainable Lifestyle Change</h2>
<p>Stabilizing insulin can unlock a myriad of benefits: clearer thinking, improved A1C levels, and access to stubborn fat stores. Strategic tools are not magic, but rather support your body's natural ability to regulate insulin. Think of them as training wheels—you still need to pedal by making mindful choices, but without the constant struggle.</p>

<p>By prioritizing fiber before a high-carb meal, you manage insulin spikes, making fat more accessible. Meanwhile, leveraging tools like Yerba mate during your fasting window helps maintain calm energy and supports longevity in fat-burning mode.</p>

<p>Remember, the journey after 40 isn't about restriction but about refinement. Understand your hormones, support your insulin, and work alongside your body for lasting wellness. Consistency will always outdo perfection. Embrace this season with tools that support your health journey.</p>

<p>If you're ready to stop guessing and start feeling steady again, <a href="/book">book your clarity call today</a>. Let's support your body the smart way.</p>`
  }
];

console.log('Inserting NEW blog posts...');

for (const post of posts) {
  // Check if slug already exists
  const [existing] = await connection.execute(
    'SELECT id FROM blog_posts WHERE slug = ?',
    [post.slug]
  );

  if (existing.length > 0) {
    console.log(`  ⏭  Skipping (already exists): ${post.title}`);
    continue;
  }

  await connection.execute(
    `INSERT INTO blog_posts
      (slug, title, excerpt, content, category, coverImage, published, publishedAt, seoTitle, seoDescription, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, NOW(), NOW())`,
    [
      post.slug,
      post.title,
      post.excerpt,
      post.content,
      post.category,
      post.coverImage,
      post.publishedAt,
      post.seoTitle,
      post.seoDescription,
    ]
  );
  console.log(`  ✅ Inserted: ${post.title}`);
}

await connection.end();
console.log('\nDone! New blog posts seeded.');
