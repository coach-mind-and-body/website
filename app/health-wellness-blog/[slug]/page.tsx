import type { Metadata, ResolvingMetadata } from "next";
import { getDb } from "@/server/db";
import { blogPosts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import BlogPostClient from './BlogPostClient';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  const db = await getDb();
  if (!db) return { title: "Blog | Mind and Body Reset" };

  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);

  if (!post) {
    return { title: "Post Not Found | Mind and Body Reset" };
  }

  return {
    title: `${post.title} | Mind and Body Reset`,
    description: post.excerpt || "Read this article on Mind and Body Reset.",
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      url: `/health-wellness-blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      authors: ["Lee Anne Chapman"],
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "",
      images: post.coverImage ? [post.coverImage] : undefined,
    }
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  
  const db = await getDb();
  let jsonLd = null;

  if (db) {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    if (post) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt || "",
        "image": post.coverImage
          ? (post.coverImage.startsWith("http")
              ? post.coverImage
              : `https://www.mindandbodyresetcoach.com${post.coverImage}`)
          : undefined,
        "author": {
          "@type": "Person",
          "name": "Lee Anne Chapman"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Mind and Body Reset",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.mindandbodyresetcoach.com/logo-new.jpg"
          }
        },
        "datePublished": post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        "dateModified": post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://www.mindandbodyresetcoach.com/health-wellness-blog/${slug}`
        }
      };
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogPostClient />
    </>
  );
}

