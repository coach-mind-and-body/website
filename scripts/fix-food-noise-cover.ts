import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { blogPosts } from "../drizzle/schema";
import { storagePut } from "../server/storage";

async function main() {
  const url = "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/food-noise_ce014448.jpg";
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  const { url: out } = await storagePut("blog-images/calming-food-noise-drop-the-food-courtroom.jpg", buf, "image/jpeg");
  const db = await getDb();
  if (!db) throw new Error("no db");
  await db.update(blogPosts).set({ coverImage: out }).where(eq(blogPosts.slug, "calming-food-noise-drop-the-food-courtroom"));
  const head = await fetch(out, { method: "HEAD" });
  console.log(out, "HEAD", head.status);
}
main();
