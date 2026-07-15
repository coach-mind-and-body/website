import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import { getDb } from "@/server/db";
import { blogPosts } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { SITE_URL } from "@shared/brand";

export const metadata: Metadata = {
  title: "Health & Wellness Blog for Women Over 40",
  description:
    "Articles on midlife wellness, nutrition, hormones, perimenopause, insulin resistance, body image, mindset, and food freedom — by certified coach Lee Anne Chapman.",
  keywords: [
    "midlife health blog",
    "perimenopause articles",
    "insulin resistance women over 40",
    "food freedom blog",
  ],
  alternates: { canonical: "/health-wellness-blog" },
  openGraph: {
    title: "Health & Wellness Blog for Women Over 40",
    description:
      "Midlife wellness, hormones, mindset, and food freedom — practical articles from Mind and Body Reset.",
    url: "/health-wellness-blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Health & Wellness Blog for Women Over 40",
    description:
      "Hormones, food noise, body image, and lasting change — blog for women 40+.",
  },
};

export type InitialBlogListPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  coverImage: string | null;
  content: string;
  publishedAt: string | null;
};

async function getInitialPosts(): Promise<InitialBlogListPost[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const posts = await db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        category: blogPosts.category,
        coverImage: blogPosts.coverImage,
        content: blogPosts.content,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(9);

    return posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      coverImage: p.coverImage,
      content: p.content,
      publishedAt: p.publishedAt
        ? new Date(p.publishedAt).toISOString()
        : null,
    }));
  } catch {
    return [];
  }
}

export default async function Page() {
  const initialPosts = await getInitialPosts();

  const itemList =
    initialPosts.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: initialPosts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/health-wellness-blog/${post.slug}`,
            name: post.title,
          })),
        }
      : null;

  return (
    <>
      {itemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
      )}
      {/* SSR post cards so crawlers see real internal links without JS */}
      <BlogClient initialPosts={initialPosts} />
    </>
  );
}
