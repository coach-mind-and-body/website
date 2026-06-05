import "dotenv/config";
import { getDb } from "./server/db";
import { blogPosts } from "./drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./server/_core/env";
import fs from "fs";
import path from "path";

async function run() {
  console.log("Starting image migration to R2...");
  const db = await getDb();
  if (!db) {
    console.error("No DB connection");
    process.exit(1);
  }

  if (!ENV.r2AccessKeyId || !ENV.r2SecretAccessKey || !ENV.r2Endpoint || !ENV.r2BucketName || !ENV.r2PublicUrl) {
    console.error("Missing R2 environment variables. Cannot migrate.");
    process.exit(1);
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: ENV.r2Endpoint,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });

  const posts = await db.select().from(blogPosts).where(isNotNull(blogPosts.coverImage));
  
  for (const post of posts) {
    if (!post.coverImage) continue;

    if (post.coverImage.includes(ENV.r2PublicUrl)) {
      console.log(`[Skip] Post "${post.title}" already uses R2 public URL`);
      continue;
    }

    let buffer: Buffer | null = null;
    let mimeType = "image/jpeg";
    const ext = post.coverImage.split('.').pop()?.split('?')[0] || 'jpg';
    
    if (ext.toLowerCase() === 'png') mimeType = "image/png";
    if (ext.toLowerCase() === 'webp') mimeType = "image/webp";

    if (post.coverImage.startsWith("http")) {
      // Download from Manus CDN or other HTTP source
      console.log(`[Download] Fetching URL for "${post.title}"...`);
      try {
        const res = await fetch(post.coverImage);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } catch (err) {
        console.error(`Failed to download ${post.coverImage}`, err);
        continue;
      }
    } else if (post.coverImage.startsWith("/")) {
      // Read from local file system (e.g., /blog/...)
      const localPath = path.join(process.cwd(), "client", "public", post.coverImage);
      console.log(`[Local] Reading file ${localPath} for "${post.title}"...`);
      try {
        buffer = fs.readFileSync(localPath);
      } catch (err) {
        console.error(`Failed to read local file ${localPath}`, err);
        continue;
      }
    }

    if (buffer) {
      const fileName = `blog-images/${post.slug}_${Date.now()}.${ext}`;
      console.log(`[Upload] Uploading ${fileName} to R2...`);
      
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: ENV.r2BucketName,
            Key: fileName,
            Body: buffer,
            ContentType: mimeType,
          })
        );
        
        const newUrl = `${ENV.r2PublicUrl}/${fileName}`;
        
        await db.update(blogPosts)
          .set({ coverImage: newUrl })
          .where(eq(blogPosts.id, post.id));
          
        console.log(`[Success] Updated "${post.title}" to use R2 URL: ${newUrl}`);
      } catch (err) {
        console.error(`[Error] Failed to upload/update "${post.title}"`, err);
      }
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

run().catch(console.error);
