import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/server/db";
import { blogPosts } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import BlogPostClient from "./BlogPostClient";
import { absoluteUrl } from "@shared/brand";

type Props = {
  params: Promise<{ slug: string }>;
};

/** JSON-safe post payload for the client (Dates → ISO strings). */
export type SerializedBlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  published: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  authorId: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  schemaTypes: string | null;
  schemaFaqJson: string | null;
  schemaVideoUrl: string | null;
  schemaVideoDescription: string | null;
  schemaHowToStepsJson: string | null;
  createdAt: string;
  updatedAt: string;
};

function toAbsoluteImage(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return absoluteUrl(src);
}

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function serializePost(
  post: typeof blogPosts.$inferSelect
): SerializedBlogPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt ?? null,
    published: post.published,
    publishedAt: toIso(post.publishedAt),
    scheduledAt: toIso(post.scheduledAt),
    authorId: post.authorId,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    schemaTypes: post.schemaTypes ?? null,
    schemaFaqJson: post.schemaFaqJson ?? null,
    schemaVideoUrl: post.schemaVideoUrl ?? null,
    schemaVideoDescription: post.schemaVideoDescription ?? null,
    schemaHowToStepsJson: post.schemaHowToStepsJson ?? null,
    createdAt: toIso(post.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(post.updatedAt) ?? new Date().toISOString(),
  };
}

async function getPublishedPost(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
    .limit(1);
  return post ?? null;
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
  const row = await getPublishedPost(slug);

  if (!row) {
    notFound();
  }

  const post = serializePost(row);
  const headline = post.seoTitle?.trim() || post.title;
  const description = post.seoDescription?.trim() || post.excerpt || "";
  const image = toAbsoluteImage(post.coverImage);
  const pageUrl = absoluteUrl(`/health-wellness-blog/${post.slug}`);

  const jsonLdBlocks: object[] = [
    {
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
      datePublished: post.publishedAt ?? undefined,
      dateModified: post.updatedAt ?? undefined,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": pageUrl,
      },
      // Full article body in JSON-LD helps when crawlers under-render JS
      articleBody: post.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5000),
      url: pageUrl,
      inLanguage: "en-US",
    },
  ];

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

  if (post.schemaVideoUrl) {
    jsonLdBlocks.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: headline,
      description: post.schemaVideoDescription || description,
      contentUrl: post.schemaVideoUrl,
      embedUrl: post.schemaVideoUrl,
      uploadDate: post.publishedAt ?? undefined,
    });
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
      {/*
        Pass full post from the server so the first HTML response includes
        title + article body. Without this, Google only saw a loading shell
        ("Discovered - currently not indexed" / thin content risk).
      */}
      <BlogPostClient initialPost={post} />
    </>
  );
}
