import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DB_URL);

const updates = [
  {
    slug: 'rebuilding-your-body-after-baby-how-i-got-my-energy-and-confidence-back',
    publishedAt: new Date('2026-05-08T20:00:00Z'),
    title: "How I Got My Energy, Body, and Confidence Back After Baby (Sara's Story)",
    excerpt: "After having a baby, everyone talks about the weight—but rarely the fatigue and brain fog. Read Sara's story on how she rebuilt her energy and confidence without extreme dieting.",
    seoTitle: "Rebuilding Your Body After Baby: Sara's Story on Energy & Confidence",
    seoDescription: 'Discover how Sara rebuilt her energy, cleared brain fog, and regained body confidence postpartum using a sustainable framework—without extreme dieting.',
  },
  {
    slug: 'reclaim-rewire-reset-become-a-different-decision-maker',
    publishedAt: new Date('2026-05-15T20:00:00Z'),
    title: 'Reclaim, Rewire, Reset: Become a Different Decision Maker',
    excerpt: 'Traditional weight loss methods fail when they focus only on behavior without addressing your underlying identity. Learn how to reclaim your body, rewire your mind, and reset your standards.',
    seoTitle: 'Reclaim, Rewire, Reset: Change Your Identity & Conquer Emotional Eating',
    seoDescription: 'Weight loss starts with changing your identity. Learn the Reclaim, Rewire, Reset method to stabilize your metabolism and conquer emotional eating for good.',
  },
  {
    slug: 'when-your-body-stops-responding-finding-the-balance',
    publishedAt: new Date('2026-05-22T20:00:00Z'),
    title: "I Thought I Was Doing Everything Right... (Brittany's Story)",
    excerpt: "What do you do when everything that used to work suddenly stops? Read Brittany's story on how integrating natural strategies and medical support changed everything when she lost control of her health.",
    seoTitle: "When Your Body Stops Responding: Brittany's Autoimmune Healing Story",
    seoDescription: "Brittany shares her journey with Graves' disease and blood clots. Learn why combining natural and medical support is the key to hormonal healing.",
  },
  {
    slug: 'mastering-insulin-fueling-fat-burning-and-energy-after-40',
    publishedAt: new Date('2026-05-29T20:00:00Z'),
    title: 'Mastering Insulin: Fueling Fat Burning & Energy After 40',
    excerpt: 'Energy crashes and brain fog in your 40s often point to unstable insulin levels. Learn how to stabilize your insulin, stop constant cravings, and fuel your metabolism using Unicity Balance and Unimate.',
    seoTitle: 'Mastering Insulin: Unicity Balance & Unimate for Fat Burning After 40',
    seoDescription: 'Stop energy crashes and brain fog in your 40s. Discover how Unicity Balance and Unimate stabilize insulin and unlock stubborn fat burning for women.',
  }
];

console.log('Updating blog posts with enhanced SEO and dates...');

for (const update of updates) {
  await connection.execute(
    `UPDATE blog_posts 
     SET publishedAt = ?, excerpt = ?, seoTitle = ?, seoDescription = ?, title = ?
     WHERE slug = ?`,
    [
      update.publishedAt,
      update.excerpt,
      update.seoTitle,
      update.seoDescription,
      update.title,
      update.slug
    ]
  );
  console.log(`  ✅ Updated: ${update.slug}`);
}

await connection.end();
console.log('\nDone! Blog posts updated.');
