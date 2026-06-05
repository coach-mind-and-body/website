import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Read CSV
  const csvData = fs.readFileSync('C:\\\\Users\\\\carte\\\\Downloads\\\\blog_posts_20260601_191409.csv', 'utf8');
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  });
  
  const publicBlogDir = path.join(__dirname, 'client', 'public', 'blog');
  if (!fs.existsSync(publicBlogDir)) {
    fs.mkdirSync(publicBlogDir, { recursive: true });
  }

  // Get existing slugs to avoid duplicates
  const [existingRows] = await connection.execute('SELECT slug FROM blog_posts');
  const existingSlugs = new Set(existingRows.map(r => r.slug));
  
  let insertedCount = 0;
  
  for (const record of records) {
    if (existingSlugs.has(record.slug)) {
      console.log(`Skipping already existing post: ${record.slug}`);
      continue;
    }
    
    let coverImage = record.coverImage;
    
    // Download image if it's a URL
    if (coverImage && coverImage.startsWith('http')) {
      try {
        const ext = coverImage.split('?')[0].split('.').pop() || 'png';
        const filename = `${record.slug}_${Date.now()}.${ext}`;
        const destPath = path.join(publicBlogDir, filename);
        console.log(`Downloading image for ${record.slug}...`);
        await downloadImage(coverImage, destPath);
        coverImage = `/blog/${filename}`;
        console.log(`Saved as ${coverImage}`);
      } catch (err) {
        console.error(`Error downloading image for ${record.slug}: ${err.message}`);
      }
    }
    
    console.log(`Inserting: ${record.slug}`);
    
    await connection.execute(
      `INSERT INTO blog_posts (
        slug, title, excerpt, content, category, coverImage, published, publishedAt, 
        seoTitle, seoDescription, authorId, createdAt, updatedAt, scheduledAt, 
        schemaTypes, schemaFaqJson, schemaVideoUrl, schemaVideoDescription, 
        schemaHowToStepsJson, coverImageAlt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.slug,
        record.title,
        record.excerpt,
        record.content,
        record.category,
        coverImage,
        record.published === '1' || record.published === 'true' || record.published === 1,
        new Date(record.publishedAt),
        record.seoTitle || null,
        record.seoDescription || null,
        record.authorId ? parseInt(record.authorId) : 1,
        new Date(record.createdAt || Date.now()),
        new Date(record.updatedAt || Date.now()),
        record.scheduledAt ? new Date(record.scheduledAt) : null,
        record.schemaTypes || 'Article',
        record.schemaFaqJson || null,
        record.schemaVideoUrl || null,
        record.schemaVideoDescription || null,
        record.schemaHowToStepsJson || null,
        record.coverImageAlt || null
      ]
    );
    insertedCount++;
  }
  
  console.log(`Finished inserting ${insertedCount} missing posts.`);
  await connection.end();
}

run().catch(console.error);
