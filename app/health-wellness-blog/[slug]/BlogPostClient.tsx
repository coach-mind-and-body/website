"use client";

import { useEffect } from "react";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ArrowRight, Link2, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { BRAND, SITE_URL } from "@shared/brand";
import { trpc } from "@/lib/trpc";
import { NewsletterInline, NewsletterPopup } from "@/components/NewsletterSignup";
import { sanitizeHtml } from "@/lib/sanitizeHtml";


// ── Share Buttons component ──────────────────────────────────────────────────

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE_URL}/health-wellness-blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shares = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bg: "#1877F2",
    },
    {
      label: "X / Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bg: "#000000",
    },
    {
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
      ),
      bg: "#E60023",
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=I thought you might enjoy this article: ${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
      bg: "oklch(0.38 0.10 148)",
    },
  ];

  return (
    <div className="container max-w-3xl mx-auto mt-12 pt-8" style={{ borderTop: "1px solid oklch(0.88 0.015 80)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold" style={{ color: "oklch(0.45 0.02 160)" }}>Share this post:</span>
        {shares.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: s.bg }}
            aria-label={`Share on ${s.label}`}
          >
            {s.icon}
            <span className="hidden sm:inline">{s.label}</span>
          </a>
        ))}
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{
            background: copied ? "oklch(0.38 0.10 148)" : "oklch(0.90 0.01 160)",
            color: copied ? "white" : "oklch(0.38 0.02 160)",
          }}
          aria-label="Copy link"
        >
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{copied ? "Copied!" : "Copy Link"}</span>
        </button>
      </div>
    </div>
  );
}

// ── Related Posts component ───────────────────────────────────────────────────
const STATIC_RELATED_COVERS: Record<string, string> = {
  "midlife-body-image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/midlife-body-image_60942928.jpg",
  "midlife-body-image-your-body-is-not-a-before-picture": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/midlife-body-image_60942928.jpg",
  "embrace-reflection": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/reflection_bd3fd046.jpg",
  "embrace-reflection-shifting-from-fault-finding-to-self-awareness": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/reflection_bd3fd046.jpg",
  "calming-food-noise": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/food-noise_ce014448.jpg",
  "calming-food-noise-drop-the-food-courtroom": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/food-noise_ce014448.jpg",
};

function RelatedPosts({ slug, category }: { slug: string; category?: string }) {
  const { data: related } = trpc.blog.related.useQuery(
    { slug, category, limit: 3 },
    { enabled: !!slug }
  );
  if (!related || related.length === 0) return null;
  return (
    <section className="py-16" style={{ background: "oklch(0.985 0.008 80)" }}>
      <div className="container max-w-5xl mx-auto">
        <h2
          className="font-bold mb-8 text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: "oklch(0.22 0.02 160)" }}
        >
          You Might Also Enjoy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map((p) => {
            const cover = p.coverImage ?? STATIC_RELATED_COVERS[p.slug] ?? null;
            return (
              <Link
                key={p.slug}
                href={`/health-wellness-blog/${p.slug}`}
                className="card-brand rounded-2xl overflow-hidden group block"
              >
                <div className="h-44 relative overflow-hidden" style={{ background: "oklch(0.93 0.06 78)" }}>
                  {cover && (
                    <img
                      src={cover}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {p.category && (
                    <span className="absolute bottom-3 left-4 badge-forest">{p.category}</span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs mb-1.5" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
                  </p>
                  <h3
                    className="font-bold text-base mb-2 leading-snug"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
                  >
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "oklch(0.52 0.015 50)" }}>{p.excerpt}</p>
                  )}
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold" style={{ color: "oklch(0.38 0.10 148)" }}>
                    Read More <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Static fallback posts with full content
const STATIC_POST_COVERS: Record<string, string> = {
  "midlife-body-image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/midlife-body-image_60942928.jpg",
  "embrace-reflection": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/reflection_bd3fd046.jpg",
  "calming-food-noise": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/food-noise_ce014448.jpg",
  "perimenopause-weight": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/perimenopause_fa9d9703.webp",
  "food-freedom": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/food-freedom_f58bcd9e.jpg",
  "thought-work-intro": "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/thought-work_c157a975.jpg",
};

const STATIC_POSTS: Record<string, { title: string; category: string; date: string; excerpt: string; content: string }> = {
  "midlife-body-image": {
    title: "Midlife Body Image: Your Body is Not a Before Picture",
    category: "Body Image",
    date: "March 2, 2026",
    excerpt: "Rebuilding body confidence after 40 — why your internal commentary is a habit, not a truth.",
    content: `Your body has carried you through decades of life. It has grown children, survived illnesses, navigated grief, and shown up for every single day you've lived. And yet, for many women in midlife, the first thing they do when they look in the mirror is find fault.

**The internal commentary is relentless.** Too soft here. Too saggy there. Not what it used to be. And the cruelest part? We've been trained to see this as motivation. As if criticizing ourselves hard enough will somehow inspire us to change.

It doesn't work that way.

## Your Body Is Not a Before Picture

Diet culture has sold us the idea that our current body is a problem to be solved — a "before" waiting for its "after." But this framing is deeply damaging, especially for women over 40 whose bodies are navigating real hormonal shifts that no amount of willpower can override.

When you treat your body as a before picture, you're in a constant state of war with yourself. And you cannot heal a body you're at war with.

## The Commentary Is a Habit, Not a Truth

Here's something that changes everything when you truly understand it: **the critical voice in your head is not telling you the truth. It's telling you a story it has rehearsed thousands of times.**

Thoughts become habits. The more you think a thought, the more automatic it becomes. The more automatic it becomes, the more it feels like reality. But it isn't. It's a neural pathway that can be redirected.

This is the work we do in coaching — not just changing what you eat, but changing the lens through which you see yourself.

## Three Shifts That Help

**1. Notice the commentary without believing it.** You don't have to argue with the critical voice. Just notice it. "There's that thought again." You are not your thoughts.

**2. Ask what your body has done for you today.** Before you criticize it, acknowledge it. It breathed for you. It moved for you. It digested, circulated, and regulated — all without you asking.

**3. Separate your worth from your weight.** Your value as a human being is not located in your body size. This sounds obvious, but most of us have deeply internalized the opposite message. Unlearning it takes practice.

## The Goal Is Not a Smaller Body

The goal is a life that feels like yours. A body you can live in with some degree of peace. A relationship with food and yourself that doesn't consume your mental energy.

That's what we work toward in the R.E.C.L.A.I.M. program. Not a before and after. A beginning.`,
  },
  "calming-food-noise": {
    title: "Calming Food Noise: Drop the Mental Food Fight",
    category: "Mindful Eating & Nutrition",
    date: "February 6, 2026",
    excerpt: "Practical strategies to quiet the constant mental chatter about food.",
    content: `Do you ever feel like your brain never stops thinking about food? What you're going to eat next. Whether you "should" eat that. How many calories are in it. Whether you've been "good" today. Whether you've ruined it.

This constant mental chatter is called **food noise** — and it is exhausting.

## What Is Food Noise?

Food noise is the relentless mental preoccupation with food, eating, and body image that takes up space in your brain that could be used for literally anything else. It's the background hum of diet culture that never fully turns off.

For many women, food noise intensifies in perimenopause and menopause due to hormonal shifts that affect hunger hormones like ghrelin and leptin. Your body is sending louder signals, and your brain is interpreting them through the filter of decades of diet rules.

## Why Willpower Doesn't Quiet It

The standard advice — "just have more self-control" — actually makes food noise worse. Restriction increases preoccupation. The more you tell yourself you can't have something, the louder it gets.

This is not a character flaw. It's neuroscience.

## Practical Strategies That Actually Help

**1. Eat enough.** Chronic under-eating is the number one driver of food noise. When your body is genuinely under-fueled, it will not stop thinking about food. This is a survival mechanism, not weakness.

**2. Remove the moral weight from food.** Food is not "good" or "bad." It is fuel, pleasure, culture, and connection. When you stop labeling foods as virtuous or sinful, the mental charge around them decreases.

**3. Practice the pause.** Before eating, take three breaths. Ask: am I physically hungry? What does my body actually want? This is not about restriction — it's about reconnection.

**4. Work on the thoughts, not just the food.** Most food noise is driven by underlying thoughts and beliefs. "I have no self-control." "I always ruin it." "I don't deserve to feel good." These are the thoughts worth examining.

## The Quiet Is Possible

Women who go through the R.E.C.L.A.I.M. program consistently report that the food noise gets quieter — not because they're following stricter rules, but because they've addressed the root cause. The mental fight ends when you stop fighting.`,
  },
};

type InitialPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  coverImage: string | null;
  coverImageAlt?: string | null;
  published: boolean;
  publishedAt: string | null;
  authorId: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  schemaTypes?: string | null;
  schemaFaqJson?: string | null;
  schemaVideoUrl?: string | null;
  schemaVideoDescription?: string | null;
  schemaHowToStepsJson?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export default function BlogPost({ initialPost = null }: { initialPost?: InitialPost | null }) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? initialPost?.slug;
  // Client refetch for freshness; initialPost from the server already has full body for SSR/SEO
  const { data: dbPost, isLoading } = trpc.blog.bySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug, staleTime: 60_000 }
  );

  const staticPost = slug ? STATIC_POSTS[slug] : undefined;
  const staticCover = slug ? (STATIC_POST_COVERS[slug] ?? null) : null;
  const post =
    dbPost ??
    initialPost ??
    (staticPost
      ? {
          ...staticPost,
          slug: slug ?? "",
          id: 0,
          coverImage: staticCover,
          seoTitle: null,
          seoDescription: null,
          published: true,
          publishedAt: null,
          authorId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : null);

  // Only show spinner when we have nothing to render yet (SSR path never hits this)
  const waitingForData = isLoading && !initialPost && !staticPost;

  // Update page title + meta tags for SEO
  useEffect(() => {
    if (post) {
      document.title = `${post.seoTitle ?? post.title} | Mind and Body Reset`;
      // Update og:title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) { ogTitle = document.createElement('meta'); (ogTitle as HTMLMetaElement).setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
      (ogTitle as HTMLMetaElement).setAttribute('content', `${post.seoTitle ?? post.title} | ${BRAND.name}`);
      // Update og:description
      const desc = post.seoDescription ?? post.excerpt ?? '';
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) { ogDesc = document.createElement('meta'); (ogDesc as HTMLMetaElement).setAttribute('property', 'og:description'); document.head.appendChild(ogDesc); }
      (ogDesc as HTMLMetaElement).setAttribute('content', desc);
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) { metaDesc = document.createElement('meta'); (metaDesc as HTMLMetaElement).setAttribute('name', 'description'); document.head.appendChild(metaDesc); }
      (metaDesc as HTMLMetaElement).setAttribute('content', desc);
      // Update canonical
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) { canonical = document.createElement('link'); (canonical as HTMLLinkElement).setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
      (canonical as HTMLLinkElement).setAttribute('href', `${SITE_URL}/health-wellness-blog/${post.slug}`);

      // Inject JSON-LD schema markup
      const existingSchemas = document.querySelectorAll('script[data-schema="blog-post"]');
      existingSchemas.forEach(s => s.remove());

      // Cast to any to access schema fields (union with static posts type)
      const p = post as any;
      const schemaTypes = (p.schemaTypes ?? 'Article').split(',').map((s: string) => s.trim()).filter(Boolean);
      const postUrl = `${SITE_URL}/health-wellness-blog/${post.slug}`;
      const publishDate = p.publishedAt ? new Date(p.publishedAt).toISOString() : new Date(p.createdAt).toISOString();
      const modifiedDate = new Date(p.updatedAt).toISOString();

      const schemas: object[] = [];

      // Article / BlogPosting
      if (schemaTypes.includes('Article') || schemaTypes.includes('BlogPosting')) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': schemaTypes.includes('BlogPosting') ? 'BlogPosting' : 'Article',
          headline: p.seoTitle ?? post.title,
          description: p.seoDescription ?? post.excerpt ?? '',
          url: postUrl,
          datePublished: publishDate,
          dateModified: modifiedDate,
          author: { '@type': 'Person', name: 'Lee Anne Chapman', url: `${SITE_URL}/about` },
          publisher: { '@type': 'Organization', name: 'Mind and Body Reset', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-new.jpg` } },
          ...(post.coverImage ? { image: { '@type': 'ImageObject', url: post.coverImage } } : {}),
          mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
        });
      }

      // FAQ
      if (schemaTypes.includes('FAQ') && p.schemaFaqJson) {
        try {
          const faqItems = JSON.parse(p.schemaFaqJson);
          if (Array.isArray(faqItems) && faqItems.length > 0) {
            schemas.push({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqItems.map((item: {question: string; answer: string}) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            });
          }
        } catch {}
      }

      // VideoObject
      if (schemaTypes.includes('VideoObject') && p.schemaVideoUrl) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: p.seoTitle ?? post.title,
          description: p.schemaVideoDescription ?? p.seoDescription ?? post.excerpt ?? '',
          url: p.schemaVideoUrl,
          uploadDate: publishDate,
          ...(post.coverImage ? { thumbnailUrl: post.coverImage } : {}),
        });
      }

      // HowTo
      if (schemaTypes.includes('HowTo') && p.schemaHowToStepsJson) {
        try {
          const steps = JSON.parse(p.schemaHowToStepsJson);
          if (Array.isArray(steps) && steps.length > 0) {
            schemas.push({
              '@context': 'https://schema.org',
              '@type': 'HowTo',
              name: p.seoTitle ?? post.title,
              description: p.seoDescription ?? post.excerpt ?? '',
              step: steps.map((step: {name: string; text: string}, i: number) => ({
                '@type': 'HowToStep',
                position: i + 1,
                name: step.name,
                text: step.text,
              })),
            });
          }
        } catch {}
      }

      schemas.forEach(schema => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-schema', 'blog-post');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }

    return () => {
      // Clean up injected schemas on unmount
      document.querySelectorAll('script[data-schema="blog-post"]').forEach(s => s.remove());
    };
  }, [post]);

  if (waitingForData) {
    return (
      <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
        <SiteNav />
        <div className="container py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: "oklch(0.72 0.12 75)" }} />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
        <SiteNav />
        <div className="container py-20 text-center">
          <h1 className="font-bold text-2xl mb-4" style={{ color: "oklch(0.22 0.02 160)" }}>Post Not Found</h1>
          <Link href="/health-wellness-blog" className="inline-flex items-center gap-2 font-bold" style={{ color: "oklch(0.38 0.10 148)" }}>
            <ChevronLeft size={16} /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Markdown component map for styled rendering
  const markdownComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="font-bold mt-10 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", color: "oklch(0.22 0.02 160)", lineHeight: 1.2 }}>{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-bold mt-8 mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", color: "oklch(0.22 0.02 160)" }}>{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-bold mt-6 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", color: "oklch(0.28 0.02 160)" }}>{children}</h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-base leading-relaxed mb-4" style={{ color: "oklch(0.45 0.02 160)" }}>{children}</p>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong style={{ color: "oklch(0.22 0.02 160)", fontWeight: 700 }}>{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em style={{ color: "oklch(0.38 0.02 160)", fontStyle: "italic" }}>{children}</em>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-4 pl-6 space-y-1" style={{ color: "oklch(0.45 0.02 160)", listStyleType: "disc" }}>{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-4 pl-6 space-y-1" style={{ color: "oklch(0.45 0.02 160)", listStyleType: "decimal" }}>{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="text-base leading-relaxed">{children}</li>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 pl-5 py-1 my-6 italic" style={{ borderColor: "oklch(0.72 0.12 75)", color: "oklch(0.38 0.02 160)", background: "oklch(0.95 0.02 75 / 0.4)", borderRadius: "0 8px 8px 0" }}>{children}</blockquote>
    ),
    hr: () => (
      <hr className="my-8" style={{ borderColor: "oklch(0.85 0.01 160)" }} />
    ),
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <img src={src} alt={alt ?? ""} className="rounded-xl my-6 w-full object-cover" style={{ maxHeight: "480px" }} loading="lazy" />
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "oklch(0.38 0.10 148)", textDecoration: "underline", textUnderlineOffset: "3px" }}>{children}</a>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="px-1.5 py-0.5 rounded text-sm" style={{ background: "oklch(0.90 0.01 160)", color: "oklch(0.28 0.02 160)", fontFamily: "monospace" }}>{children}</code>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      {/* Hero */}
      <section className="pb-8" style={{ background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.97 0.008 10) 60%)" }}>
        {/* Cover image */}
        {post.coverImage && (
          <div className="w-full h-64 md:h-80 overflow-hidden mb-8">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}
        <div className="container max-w-3xl mx-auto">
          <Link href="/health-wellness-blog" className="inline-flex items-center gap-1 text-xs font-bold mb-4 block" style={{ color: "oklch(0.38 0.10 148)" }}>
            <ChevronLeft size={14} /> Back to Blog
          </Link>
          <span className="badge-forest mb-4 block w-fit">{post.category}</span>
          <h1 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4.5vw, 3.2rem)", color: "oklch(0.22 0.02 160)", lineHeight: 1.2 }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.55 0.02 160)" }}>{post.excerpt}</p>
          )}
          <div className="flex items-center gap-3 mt-4">
            <img src={BRAND.logoUrl} alt="Lee Anne" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-xs font-semibold" style={{ color: "oklch(0.55 0.02 160)" }}>
              {BRAND.coachName} · {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : (staticPost?.date ?? "")}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "oklch(0.88 0.04 75)", color: "oklch(0.38 0.06 75)" }}>
              {Math.max(1, Math.ceil(post.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200))} min read
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="pt-8 pb-16">
        <div className="container max-w-3xl mx-auto blog-prose">
          {/* Detect HTML content (from DB editor) vs markdown (static posts) */}
          {post.content.trimStart().startsWith('<') ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents as never}
            >
              {post.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Share buttons */}
        <NewsletterInline />
        <ShareButtons title={post.title} slug={post.slug} />
      </article>
      <NewsletterPopup />

      {/* Related Posts */}
      <RelatedPosts slug={post.slug} category={post.category ?? undefined} />

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "oklch(0.93 0.06 75)" }}>
        <div className="container max-w-xl mx-auto">
          <h2 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "oklch(0.22 0.02 160)" }}>
            Ready to Do This Work Together?
          </h2>
          <p className="text-base mb-6" style={{ color: "oklch(0.45 0.02 160)" }}>
            Book a free 30-minute discovery call with Lee Anne and find out if R.E.C.L.A.I.M. is right for you.
          </p>
          <Link href="/book" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1" style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.97 0.008 10)" }}>
            Book Free Discovery Call <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
