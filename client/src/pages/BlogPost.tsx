import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ChevronLeft, ArrowRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { BRAND } from "../../../shared/brand";
import { trpc } from "@/lib/trpc";
import { SEO } from "@/components/SEO";

// Static fallback posts with full content
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

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data: dbPost, isLoading } = trpc.blog.bySlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug });

  const staticPost = slug ? STATIC_POSTS[slug] : undefined;
  const post = dbPost ?? (staticPost ? { ...staticPost, slug: slug ?? "", id: 0, coverImage: null, seoTitle: null, seoDescription: null, published: true, publishedAt: null, authorId: null, createdAt: new Date(), updatedAt: new Date() } : null);

  if (isLoading) {
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

  // Content is now rendered directly via dangerouslySetInnerHTML below

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.seoDescription ?? post.excerpt ?? "",
    "datePublished": post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
    "author": [{
        "@type": "Person",
        "name": BRAND.coachName,
        "url": "https://mindandbodyresetcoach.com/about"
    }]
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SEO 
        title={`${post.seoTitle ?? post.title} | ${BRAND.name}`}
        description={post.seoDescription ?? post.excerpt ?? ""}
        schema={articleSchema}
        type="article"
      />
      <SiteNav />

      {/* Hero */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.97 0.008 10) 60%)" }}>
        <div className="container max-w-3xl mx-auto">
          <Link href="/health-wellness-blog" className="inline-flex items-center gap-1 text-xs font-bold mb-6" style={{ color: "oklch(0.38 0.10 148)" }}>
            <ChevronLeft size={14} /> Back to Blog
          </Link>
          <span className="badge-forest mb-4 inline-block">{post.category}</span>
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
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="py-16">
        <div className="container max-w-3xl mx-auto prose prose-lg prose-headings:font-serif prose-headings:text-[oklch(0.22_0.02_160)] prose-p:text-[oklch(0.45_0.02_160)] prose-a:text-[oklch(0.38_0.10_148)] prose-a:font-bold prose-img:rounded-xl">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </article>

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
