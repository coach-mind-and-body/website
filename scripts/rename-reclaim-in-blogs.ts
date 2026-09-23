import "dotenv/config";
import mysql from "mysql2/promise";

function rewrite(s: string): { next: string; hits: number } {
  let hits = 0;
  const next = s.replace(/R\.E\.C\.L\.A\.I\.M\./g, () => {
    hits += 1;
    return "6 Habits in 6 Weeks";
  });
  return { next, hits };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("No DATABASE_URL");
  const c = await mysql.createConnection(url);
  const [rows] = await c.query(
    `SELECT id, slug, title, excerpt, content, seoTitle, seoDescription, schemaFaqJson, schemaVideoDescription
     FROM blog_posts
     WHERE content LIKE '%R.E.C.L.A.I.M.%'
        OR excerpt LIKE '%R.E.C.L.A.I.M.%'
        OR title LIKE '%R.E.C.L.A.I.M.%'
        OR seoTitle LIKE '%R.E.C.L.A.I.M.%'
        OR seoDescription LIKE '%R.E.C.L.A.I.M.%'
        OR schemaFaqJson LIKE '%R.E.C.L.A.I.M.%'
        OR schemaVideoDescription LIKE '%R.E.C.L.A.I.M.%'`
  );
  const posts = rows as Array<Record<string, string | number | null>>;
  console.log(`Found ${posts.length} blog posts with R.E.C.L.A.I.M.`);

  let updated = 0;
  for (const post of posts) {
    const fields: Record<string, string> = {};
    let total = 0;
    for (const col of [
      "title",
      "excerpt",
      "content",
      "seoTitle",
      "seoDescription",
      "schemaFaqJson",
      "schemaVideoDescription",
    ] as const) {
      const raw = post[col];
      if (typeof raw !== "string" || !raw.includes("R.E.C.L.A.I.M.")) continue;
      const { next, hits } = rewrite(raw);
      fields[col] = next;
      total += hits;
    }
    if (Object.keys(fields).length === 0) continue;
    const sets = Object.keys(fields)
      .map((k) => `\`${k}\` = ?`)
      .join(", ");
    await c.query(`UPDATE blog_posts SET ${sets} WHERE id = ?`, [...Object.values(fields), post.id]);
    updated += 1;
    console.log(`  ${post.slug}: ${total} replacements`);
  }

  const [left] = await c.query(
    `SELECT COUNT(*) AS n FROM blog_posts WHERE content LIKE '%R.E.C.L.A.I.M.%' OR excerpt LIKE '%R.E.C.L.A.I.M.%'`
  );
  console.log(`Updated ${updated} posts. Remaining with acronym:`, (left as { n: number }[])[0]);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
