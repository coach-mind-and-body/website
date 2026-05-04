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
  {
    title: 'Stop Food Shame: Healing Midlife Insulin Resistance',
    slug: 'stop-food-shame-healing-midlife-insulin-resistance',
    category: 'Thought Work',
    excerpt: 'If you\'re a woman in your 40s, 50s, or 60s struggling with insulin resistance, sudden weight gain, and constant food noise, you are not alone. Learn how mindset directly impacts your biochemistry.',
    featuredImageUrl: 'https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663371864914/YZWgrgdxQTBXMoUL.png?Expires=1804046811&Signature=Tn0YAWKY5Jfb-mD-Df9c0bvgOkz4syS95AfeKvUEY-aWEPgEoqVU-aOBeo8fqiUlV-TVgiAlztqa90ozReSd9cjyFe4DOgiusAhpAk78GItklvumH9MfLKzQtwDRoGnNWNbVJTtHF5axAqgl5pPvcSkuyHnWijteBit40Bsk5DxdCp9Zi2JEw9i1d2K3R8lCy2uA1IwsLuwbk9BvERJMPd8KY3c~2PWptQ45oHdiJrJgQZyZbm6DLog8gwl6mNlAMhIAr98IAqsWE6-HkWnaRIW9JfgTxTToFPZ7d~QfEXNayqt5H3OsBiOWODL8Djl9R5oHcMqFuk7VeSRliW5yPQ__&Key-Pair-Id=K2HSFNDJXOU9YS',
    content: `<p>If you're a woman in your 40s, 50s, or 60s struggling with insulin resistance, sudden weight gain, and constant food noise, you are not alone. Many women reach perimenopause and menopause feeling exhausted and discouraged because the dieting rules that worked in their 20s simply don't work anymore.</p>

<p>What most metabolic programs fail to mention is this: Your mindset directly impacts your biochemistry. Learning how to "clean up your thoughts" isn't just self-help—it is a physiological tool for healing your relationship with food and stabilizing your blood sugar.</p>

<h2>The Link Between Stress, Cortisol, and Insulin Resistance</h2>
<p>In midlife, hormonal shifts change how your body processes stress and glucose. When your self-talk is harsh or shameful, your body perceives a threat. This triggers the sympathetic nervous system (fight-or-flight), releasing cortisol.</p>

<p>High cortisol levels tell your liver to release more glucose into the bloodstream. If this happens chronically due to negative thought patterns, it worsens insulin resistance and makes weight loss feel impossible.</p>

<h3>Common "Toxic" Thoughts That Stall Progress:</h3>
<ul>
  <li>"I can't trust myself around sugar."</li>
  <li>"My metabolism is broken because of menopause."</li>
  <li>"I've already ruined the day, so I might as well keep eating."</li>
</ul>

<p>These thoughts create food shame, which leads to emotional eating and further metabolic dysfunction. It's not a willpower problem; it's a nervous system regulation problem.</p>

<h2>What is "Thought Work" for Metabolic Health?</h2>
<p>Thought work is not "toxic positivity" or pretending you love your body when you don't. In the context of metabolic health and insulin sensitivity, thought work is the practice of noticing the mental loops that keep your body in a stressed state.</p>

<h3>The Cognitive Cycle of Health:</h3>
<ul>
  <li><strong>Thought:</strong> "I'll never get my blood sugar under control."</li>
  <li><strong>Feeling:</strong> Hopelessness/Anxiety.</li>
  <li><strong>Action:</strong> Reaching for comfort food to soothe the anxiety.</li>
  <li><strong>Result:</strong> Elevated glucose and reinforced insulin resistance.</li>
</ul>

<p>By shifting the thought, you change the physiological result.</p>

<img src="https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663371864914/ChhJOBqNIpYmwVVp.png?Expires=1804046811&Signature=IZ~YpU-sfM4FsWTYz~AEnWSriPFv8PfP2j1K7zEfb~URf4O0Zn91Z1whPm4r75F8pzYdS~Wrwr9nHYXvTthvd0L8UlQf6vhu1SvM2m3BlrckFqxzlbkS7Yed3-2YXYGCyIDwlnjAx-7Is7qM6UfZS7xnpTYW6h1C639sfXIHVdY~H4eJhh74Y2wvAe~YwRew8iluAnJ6EYqfOSZ5w4PQ8XLIegzKCeiNbTXIAD~kVz1b1SD7VNlZd3Uen4lern2U3GiiPi0lUcF7wNM4ySpctq3Q28NJzVnkUy7LzEC~pXfR9L6PCu4WAF7wST7UslBs9xH~J38Yt9ZlDBeAXfvSHw__&Key-Pair-Id=K2HSFNDJXOU9YS" alt="A woman's thoughts — watercolor illustration" style="width:100%;border-radius:12px;margin:1.5rem 0;" />

<h2>A 4-Step Process to Clean Up Your Thoughts</h2>
<p>To lower your stress response and support your hormones, use this simple daily practice:</p>
<ol>
  <li><strong>Audit the Thought:</strong> Ask, "What am I actually saying to myself right now?" Be a neutral observer.</li>
  <li><strong>Identify the Emotion:</strong> Does this thought make you feel empowered or defeated? Shame is a high-stress emotion that triggers glucose spikes.</li>
  <li><strong>Challenge the Utility:</strong> Instead of asking if the thought is "true," ask: "Is this thought helping my body heal?"</li>
  <li><strong>Pivot to a "Neutral" Thought:</strong> You don't have to jump to "I love my body." Try a bridge thought: "I am learning how my body responds to different foods." / "My body is giving me feedback, not a failure report." / "I can choose a different action in the next five minutes."</li>
</ol>

<h2>Why Calming Your Mind Heals Your Metabolism</h2>
<p>A stressed body holds onto glucose and resists insulin to "save" energy for a perceived emergency. A calm body—one that feels safe and supported—can finally enter rest and digest mode.</p>

<p>Mindset work is physiology support. By reducing food shame, you reduce cortisol, which allows your insulin receptors to become more sensitive and your hormones to find balance.</p>

<h2>Summary: Better Than Perfect is Enough</h2>
<p>You don't need a perfect diet or perfect thoughts to see results. You need consistency and self-compassion. Cleaning up your thoughts one at a time changes how you feel around food, which eventually changes your biology.</p>`,
    publishedAt: new Date('2026-01-09'),
    published: 1,
  },
  {
    title: 'Embracing Change: Redefining Your Journey Through Menopause',
    slug: 'embracing-change-redefining-your-journey-through-menopause',
    category: 'Menopause & Hormonal Health',
    excerpt: 'Many women in their 40s and 50s find that "eating clean" and vigorous exercise suddenly stop working due to hormonal shifts and undiagnosed insulin resistance. Learn how to stabilize your health and rediscover your vitality.',
    featuredImageUrl: 'https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663371864914/LaZfzvFTaageFakJ.png?Expires=1804046878&Signature=rvKtcfX9RETlA61KllvUHFctCJsnHVjCOe~0qMmrzCxfq4Y0DOXmDME2gktjr~ChdmAmkAL262KTh98N-nRG3ZgXnq43SKHoebLxPNhdCPvntS6-8VvSOni1EKdcRfisigzQ0GT4Dk6RedsgtknltBT~sE4d9SiPpd7nmww9JYgYas4WZiDa~v1kzdc9OnD6OIP-Vuur17VgRS17JnNpkYpEd~9aerU3CRtu~4CXkVgqzTOJxW5TVZmSVO8GClqe~gyd~LJ15keaFrB9i6svJxC7yyHjfhZFY-0qEEXxH9STbM3xjIbC8-vctbrZS8hMEj88QFTFewpY~1g1Ep29-Q__&Key-Pair-Id=K2HSFNDJXOU9YS',
    content: `<p>Many women in their 40s and 50s find that "eating clean" and vigorous exercise suddenly stop working due to hormonal shifts and undiagnosed insulin resistance. If you are experiencing unexplained anxiety, brain fog, and weight gain, it is often a sign that your body requires a fresh approach. By combining Hormone Replacement Therapy (HRT) with metabolic tools like intermittent fasting and supplements, you can stabilize your health and rediscover your vitality.</p>

<h2>When the Rules of Life Suddenly Change</h2>
<p>If you're reading this and quietly questioning, "I used to handle everything, and now I can barely get through the day," this article is for you. Many women find themselves in their forties or fifties when life's rules suddenly change: workouts that once worked become ineffective, dietary routines no longer yield results, and the mind starts to feel unfamiliar. Often, there is little warning for these shifts, leading to significant confusion and self-doubt.</p>

<h2>The Journey of Change: From the "Capable One" to Hitting a Wall</h2>
<p>I am sharing my story not because I have solved every mystery, but because I spent years wrongly believing I was failing when, in reality, my body was calling for help.</p>

<p>Throughout my life, I was the "capable one"—raising five children, building a business with my husband, managing a busy household, and showing up daily. Since the age of sixteen, exercise has been a cornerstone of my life. I started with Jane Fonda workout tapes, doing them so often they literally wore out. These routines were my anchor; they bolstered my mental health, aided my recovery from C-sections, and enabled me to keep up with life's demands—until one day, they simply didn't.</p>

<h2>Symptoms of the "Menopause Wall"</h2>
<p>Suddenly, life hit a wall, and I was faced with a series of overwhelming challenges:</p>
<ul>
  <li><strong>Unexplained Anxiety:</strong> Feeling anxious without reason and overwhelmed by simple decisions.</li>
  <li><strong>Cognitive Decline:</strong> Feeling lost in a constant state of brain fog.</li>
  <li><strong>Physical Exhaustion:</strong> Some days, simply getting out of bed felt like an insurmountable task.</li>
  <li><strong>Stubborn Weight Gain:</strong> Despite "eating clean" and exercising vigorously, the weight continued to creep on.</li>
</ul>

<p>I didn't recognize myself, and neither did my family. I began hiding from mirrors and photos, obsessively scrutinizing my food and blaming myself when nothing worked. When I sought medical help, doctors dismissed menopause as the issue because my blood work appeared "normal," instead recommending antidepressants. This lack of solutions led me to question my own sanity.</p>

<h2>A Turning Point: The Connection Between Hormones and Metabolism</h2>
<p>The shift began during a period of family turmoil when my husband was diagnosed with thyroid cancer. Through his own treatment, he began Hormone Replacement Therapy (HRT) and suggested I recheck my blood work.</p>

<p>Reluctantly, I did, and the results were telling: my hormones were in complete chaos. Starting HRT was a revelation—it lifted the brain fog and eased my anxiety. I finally felt like myself again, but one problem remained: the weight was still stubborn.</p>

<h2>The Role of Insulin Resistance in Menopause</h2>
<p>Another blood test revealed a critical piece of the puzzle—an A1C of 9.2. I was insulin resistant and pre-diabetic. I realized that menopause wasn't the sole culprit; insulin resistance was exacerbating every symptom, including intense fatigue and anxiety, persistent weight gain, and the complete failure of my prior diet and exercise methods.</p>

<h2>A New Approach: Supporting the Body Instead of Blaming It</h2>
<p>Once the full picture was clear, I approached my health with a new set of tools. I abandoned "quick fixes" and self-blame, and instead, learned how to truly support my body. My new strategy included:</p>
<ul>
  <li><strong>Hormone Replacement Therapy:</strong> To stabilize my system and restore mental clarity.</li>
  <li><strong>Supplements:</strong> To fill nutritional gaps and support metabolic health.</li>
  <li><strong>Intermittent Fasting:</strong> Tailored specifically to my needs to combat insulin resistance.</li>
</ul>

<p>The results were transformative. Within two months, my A1C dropped to the low fives, my weight started to shift, my energy surged, and my motivation returned. I was finally discovering how to live well in my new body.</p>

<h2>The Takeaway: You Are Not Failing</h2>
<p>If my story resonates with you, please understand: you are not lazy or failing. Your body is simply changing and deserves a fresh approach. Menopause is not the end of your vitality; it is a wake-up call to adopt new strategies.</p>

<p>If you seek guidance to navigate this journey with clarity instead of shame, remember you are not alone. You don't have to endure this phase in isolation or feel as though you are "finished"—in truth, you are just getting started.</p>

<h2>A New Beginning</h2>
<p>This transition period can be daunting, but it is also an opportunity to redefine your methods and embrace the changes. Your journey through menopause is a new beginning. Take this time to understand your body and learn what supports it. With the right tools and perspective, you are not just enduring this phase of life—you are thriving.</p>`,
    publishedAt: new Date('2026-02-03'),
    published: 1,
  },
];

console.log('Inserting blog posts...');

for (const post of posts) {
  // Check if slug already exists
  const [existing] = await connection.execute(
    'SELECT id FROM blog_posts WHERE slug = ?',
    [post.slug]
  );
  if (existing.length > 0) {
    console.log(`Post already exists: ${post.slug} — skipping.`);
    continue;
  }

  await connection.execute(
    `INSERT INTO blog_posts (title, slug, category, excerpt, featured_image_url, content, published_at, published, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      post.title,
      post.slug,
      post.category,
      post.excerpt,
      post.featuredImageUrl,
      post.content,
      post.publishedAt,
      post.published,
    ]
  );
  console.log(`✓ Inserted: ${post.title}`);
}

await connection.end();
console.log('Done!');
