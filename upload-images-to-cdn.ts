import { storagePut } from './server/storage.ts';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const posts = [
    { slug: 'rebuilding-your-body-after-baby-how-i-got-my-energy-and-confidence-back', img: 'postpartum_energy_recovery_1780339071077.png' },
    { slug: 'reclaim-rewire-reset-become-a-different-decision-maker', img: 'mindset_decision_maker_1780339085678.png' },
    { slug: 'when-your-body-stops-responding-finding-the-balance', img: 'healing_balance_hormones_1780339100250.png' },
    { slug: 'mastering-insulin-fueling-fat-burning-and-energy-after-40', img: 'metabolism_after_40_1780339113905.png' }
  ];

  for (const post of posts) {
    const filePath = path.join(process.cwd(), 'client', 'public', 'blog', post.img);
    if (!fs.existsSync(filePath)) {
      console.log(`Missing file: ${filePath}`);
      continue;
    }
    
    console.log(`Uploading ${post.img}...`);
    const fileBuffer = fs.readFileSync(filePath);
    const { url } = await storagePut(`blog/${post.img}`, fileBuffer, 'image/png');
    console.log(`Uploaded to: ${url}`);
    
    await connection.execute(`UPDATE blog_posts SET coverImage = ? WHERE slug = ?`, [url, post.slug]);
    console.log(`Updated DB for ${post.slug}`);
  }
  
  await connection.end();
  console.log('Done!');
}

run().catch(console.error);
