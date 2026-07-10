import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { blogPosts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import BlogPostClient from "./BlogPostClient";
import { absoluteUrl } from "@shared/brand";

type Props = {
  params: Promise<{ slug: string }>;
};

function toAbsoluteImage(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return absoluteUrl(src);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const db = await getDb();
  if (!db) {
    return {
      title: "Blog | Mind and Body Reset",
      alternates: { canonical: absoluteUrl(`/health-wellness-blog/${slug}`) },
    };
  }

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!post) {
    return {
      title: "Post Not Found | Mind and Body Reset",
      robots: { index: false, follow: false },
    };
  }

  const title = (post.seoTitle?.trim() || post.title).replace(
    /\s*\|\s*Mind and Body Reset\s*$/i,
    ""
  );
  const description =
    post.seoDescription?.trim() ||
    post.excerpt ||
    "Read this article on Mind and Body Reset.";
  const canonicalPath = `/health-wellness-blog/${post.slug}`;
  const image = toAbsoluteImage(post.coverImage);

  return {
    title,
    description,
    authors: [{ name: "Lee Anne Chapman" }],
    alternates: {
      canonical: absoluteUrl(canonicalPath),
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "article",
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      modifiedTime: post.updatedAt
        ? new Date(post.updatedAt).toISOString()
        : undefined,
      authors: ["Lee Anne Chapman"],
      images: image
        ? [{ url: image, alt: post.coverImageAlt || post.title }]
        : undefined,
      siteName: "Mind and Body Reset",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: post.published
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const db = await getDb();
  let jsonLdBlocks: object[] = [];

  if (db) {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (post) {
      const headline = post.seoTitle?.trim() || post.title;
      const description =
        post.seoDescription?.trim() || post.excerpt || "";
      const image = toAbsoluteImage(post.coverImage);
      const pageUrl = absoluteUrl(`/health-wellness-blog/${post.slug}`);

      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline,
        description,
        image: image ? [image] : undefined,
        author: {
          "@type": "Person",
          name: "Lee Anne Chapman",
          url: absoluteUrl("/about"),
        },
        publisher: {
          "@type": "Organization",
          name: "Mind and Body Reset",
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/logo-new.jpg"),
          },
        },
        datePublished: post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : undefined,
        dateModified: post.updatedAt
          ? new Date(post.updatedAt).toISOString()
          : undefined,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
        url: pageUrl,
        inLanguage: "en-US",
      });

      // Optional FAQ schema from admin
      if (post.schemaFaqJson) {
        try {
          const faqs = JSON.parse(post.schemaFaqJson) as Array<{
            question: string;
            answer: string;
          }>;
          if (Array.isArray(faqs) && faqs.length > 0) {
            jsonLdBlocks.push({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: f.answer,
                },
              })),
            });
          }
        } catch {
          /* ignore invalid JSON */
        }
      }

      // Optional HowTo schema
      if (post.schemaHowToStepsJson) {
        try {
          const steps = JSON.parse(post.schemaHowToStepsJson) as Array<{
            name: string;
            text: string;
          }>;
          if (Array.isArray(steps) && steps.length > 0) {
            jsonLdBlocks.push({
              "@context": "https://schema.org",
              "@type": "HowTo",
              name: headline,
              description,
              step: steps.map((s, i) => ({
                "@type": "HowToStep",
                position: i + 1,
                name: s.name,
                text: s.text,
              })),
            });
          }
        } catch {
          /* ignore */
        }
      }

      // Optional VideoObject
      if (post.schemaVideoUrl) {
        jsonLdBlocks.push({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: headline,
          description:
            post.schemaVideoDescription || description,
          contentUrl: post.schemaVideoUrl,
          embedUrl: post.schemaVideoUrl,
          uploadDate: post.publishedAt
            ? new Date(post.publishedAt).toISOString()
            : undefined,
        });
      }
    }
  }

  return (
    <>
      {jsonLdBlocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <BlogPostClient />
    </>
  );
}
