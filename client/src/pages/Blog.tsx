import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ChevronRight, Search, X } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { BLOG_CATEGORIES } from "../../../shared/brand";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";

const STATIC_POSTS = [
  { slug: "midlife-body-image", category: "Body Image", date: "March 2, 2026", publishedAt: new Date("2026-03-02"), title: "Midlife Body Image: Your Body is Not a Before Picture", excerpt: "Rebuilding body confidence after 40 — why your internal commentary is a habit, not a truth.", coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/midlife-body-image_60942928.jpg" },
  { slug: "embrace-reflection", category: "Mindset & Self-Compassion", date: "February 13, 2026", publishedAt: new Date("2026-02-13"), title: "Embrace Reflection: Shifting from Fault-Finding to Self-Awareness", excerpt: "How to stop negative self-talk in the mirror and break the fault-finding cycle.", coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/reflection_bd3fd046.jpg" },
  { slug: "calming-food-noise", category: "Mindful Eating & Nutrition", date: "February 6, 2026", publishedAt: new Date("2026-02-06"), title: "Calming Food Noise: Drop the Mental Food Fight", excerpt: "Practical strategies to quiet the constant mental chatter about food.", coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/food-noise_ce014448.jpg" },
  { slug: "perimenopause-weight", category: "Menopause & Hormonal Health", date: "January 30, 2026", publishedAt: new Date("2026-01-30"), title: "Why Weight Loss Feels Harder in Perimenopause (And What Actually Works)", excerpt: "Understanding the hormonal shifts of perimenopause and how to work with your body, not against it.", coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/perimenopause_fa9d9703.webp" },
  { slug: "food-freedom", category: "Mindful Eating & Nutrition", date: "January 22, 2026", publishedAt: new Date("2026-01-22"), title: "Food Freedom Isn't About Willpower — It's About Rewiring", excerpt: "The real reason diets don't stick and what neuroscience says about lasting change.", coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/food-freedom_f58bcd9e.jpg" },
  { slug: "thought-work-intro", category: "Thought Work", date: "January 15, 2026", publishedAt: new Date("2026-01-15"), title: "What Is Thought Work and Why Does It Change Everything?", excerpt: "An introduction to the most powerful tool in the coaching toolkit — and why it's not therapy.", coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/thought-work_c157a975.jpg" },
];

export default function Blog() {
  usePageTitle({
    title: "Health & Wellness Blog | Mind and Body Reset",
    description: "Articles on midlife wellness, nutrition, hormones, mindset, body image, and food freedom for women 40+ by certified coach Lee Anne Chapman.",
    keywords: "health blog, wellness blog, midlife nutrition, hormones blog, food freedom articles, women over 40 health, perimenopause, body image"
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: dbPosts } = trpc.blog.list.useQuery({ limit: 50, category: selectedCategory ?? undefined });

  const allPosts = useMemo(() => (dbPosts && dbPosts.length > 0)
    ? dbPosts.map(p => ({
        slug: p.slug,
        category: p.category ?? "Wellness",
        date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "",
        title: p.title,
        excerpt: p.excerpt ?? "",
        coverImage: p.coverImage ?? null,
        readTime: Math.max(1, Math.ceil(p.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200)),
      }))
    : STATIC_POSTS.filter(p => !selectedCategory || p.category === selectedCategory).map(p => ({ ...p, readTime: null })),
  [dbPosts, selectedCategory]);

  const posts = useMemo(() => {
    if (!searchQuery.trim()) return allPosts;
    const q = searchQuery.toLowerCase();
    return allPosts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [allPosts, searchQuery]);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      {/* Hero */}
      <section className="py-16 text-center" style={{ background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.97 0.008 10) 60%)" }}>
        <div className="container max-w-2xl mx-auto">
          <span className="badge-gold mb-4 inline-block">The Blog</span>
          <h1 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)", color: "oklch(0.22 0.02 160)" }}>
            Insights for Your Journey
          </h1>
          <p className="text-base mb-8" style={{ color: "oklch(0.45 0.02 160)" }}>
            Practical wisdom on mindset, hormonal health, mindful eating, and reclaiming your body at every age.
          </p>
          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(0.55 0.02 160)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-10 pr-10 py-3 rounded-full text-sm border outline-none transition-all"
              style={{
                background: "oklch(1 0 0)",
                border: "1.5px solid oklch(0.85 0.02 160)",
                color: "oklch(0.22 0.02 160)",
                boxShadow: "0 2px 12px oklch(0.22 0.02 160 / 0.06)",
              }}
              onFocus={e => (e.target.style.borderColor = "oklch(0.38 0.10 148)")}
              onBlur={e => (e.target.style.borderColor = "oklch(0.85 0.02 160)")}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "oklch(0.55 0.02 160)" }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="py-6 border-b" style={{ borderColor: "oklch(0.90 0.01 160)", background: "oklch(1 0 0)" }}>
        <div className="container">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: !selectedCategory ? "oklch(0.22 0.02 160)" : "oklch(0.93 0.01 160)",
                color: !selectedCategory ? "oklch(0.97 0.008 10)" : "oklch(0.45 0.02 160)",
              }}
            >
              All Topics
            </button>
            {BLOG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: selectedCategory === cat ? "oklch(0.38 0.10 148)" : "oklch(0.93 0.01 160)",
                  color: selectedCategory === cat ? "white" : "oklch(0.45 0.02 160)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="py-16">
        <div className="container">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ color: "oklch(0.55 0.02 160)" }}>
                {searchQuery ? `No articles found for "${searchQuery}". Try a different search term.` : "No posts found in this category yet. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.slug} href={`/health-wellness-blog/${post.slug}`} className="card-brand rounded-2xl overflow-hidden group block">
                  <div className="h-48 relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.88 0.04 10) 100%)" }}>
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-3 left-4 badge-forest">{post.category}</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>{post.date}</p>
                      {post.readTime && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "oklch(0.88 0.04 75)", color: "oklch(0.38 0.06 75)" }}>
                          {post.readTime} min read
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-xl mb-3 group-hover:underline" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)", lineHeight: 1.3 }}>
                      {post.title}
                    </h2>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "oklch(0.55 0.02 160)" }}>{post.excerpt}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "oklch(0.38 0.10 148)" }}>
                      Read More <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
