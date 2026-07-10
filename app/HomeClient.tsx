"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
;
import { ArrowRight, Star, CheckCircle2, ChevronRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { BRAND, PROGRAM } from "@shared/brand";
import { trpc } from "@/lib/trpc";


const LOGO = BRAND.logoUrl;

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      setProgress(el.scrollHeight - el.clientHeight > 0
        ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

function useFadeUp(deps: unknown[] = []) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const TESTIMONIALS = [
  {
    name: "Chrissy O.", date: "12/3/2025", initial: "C",
    title: "Obsessing over food",
    quote: "Lee Anne's coaching has changed the way I see myself, and food. I thought obsessing over the next meal was normal. Eating chocolate after every meal was just something I did. The thought of giving up sugar was too scary, so I just existed in the status quo of my busy life. Lee Anne showed me a different way that was do-able and I feel like I've come home to myself. Highly recommend!",
  },
  {
    name: "Nicole L.", date: "1/28/2026", initial: "N",
    title: "Feeling like myself again",
    quote: "My old strategies for feeling my best were working less and less, and I felt frustrated before finding Lee Anne. Working with her has given me clarity around what was truly holding me back from my health goals. Each session leaves me with practical insights and a stronger ability to work with my mind and body. I feel more supported, informed, and like myself again.",
  },
  {
    name: "Sherylee", date: "2/11/2026", initial: "S",
    title: "Ownership of my health",
    quote: "Lee Anne's coaching goes beyond typical health advice. She helps women step out of the quick-fix mindset and into a long term approach that supports your physical and mental health. You feel empowered to take ownership of your health in a way that lasts.",
  },
];

const STATIC_POSTS = [
  { slug: "midlife-body-image-your-body-is-not-a-before-picture", category: "Body Image", date: "March 2, 2026", title: "Midlife Body Image: Your Body is Not a Before Picture", excerpt: "Rebuilding body confidence after 40 — why your internal commentary is a habit, not a truth.", coverImage: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800" },
  { slug: "embrace-reflection-shifting-from-fault-finding-to-self-awareness", category: "Mindset & Self-Compassion", date: "February 13, 2026", title: "Embrace Reflection: Shifting from Fault-Finding to Self-Awareness", excerpt: "How to stop negative self-talk in the mirror and break the fault-finding cycle.", coverImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" },
  { slug: "calming-food-noise-drop-the-food-courtroom", category: "Mindful Eating & Nutrition", date: "February 6, 2026", title: "Calming Food Noise: Drop the Mental Food Fight", excerpt: "Practical strategies to quiet the constant mental chatter about food.", coverImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800" },
];

export default function Home() {
  
  const progress = useScrollProgress();
  const { data: dbPosts } = trpc.blog.list.useQuery({ limit: 3 });
  useFadeUp([dbPosts]);
  const displayPosts = (dbPosts?.posts && dbPosts.posts.length > 0)
    ? dbPosts.posts.map((p: any) => ({
        slug: p.slug,
        category: p.category ?? "Wellness",
        date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "",
        title: p.title,
        excerpt: p.excerpt ?? "",
        coverImage: p.coverImage ?? null,
        readTime: Math.max(1, Math.ceil(p.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200)),
      }))
    : STATIC_POSTS.map(p => ({ ...p, readTime: null }));

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      <div className="scroll-progress" style={{ width: `${progress}%` }} />
      <SiteNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: "oklch(0.985 0.008 80)", minHeight: "560px" }}>
        <div className="container relative z-10 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
            {/* Left: Logo + Copy — centered */}
            <div className="fade-up flex flex-col items-center text-center">
              {/* Circular logo */}
              <Image
                src={LOGO}
                alt="Mind & Body Reset"
                className="w-32 h-32 rounded-full object-cover mb-6"
                style={{ border: "3px solid oklch(0.90 0.015 80)" }}
                width={128}
                height={128}
                priority
              />
              <h1
                className="font-bold leading-tight mb-5"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)",
                  color: "oklch(0.42 0.09 140)",
                  lineHeight: 1.25,
                }}
              >
                Reclaim Your Body.<br />
                Rewire Your Mind.<br />
                Reset Your Life.
              </h1>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "oklch(0.35 0.015 50)", maxWidth: "420px" }}>
                Take this <strong style={{ color: "oklch(0.20 0.015 50)" }}>60 second quiz</strong> to understand where you're stuck with food and what to do about it!
              </p>
              <Link
                href="/food-quiz"
                className="btn-gold inline-flex items-center gap-2"
              >
                Take Quiz Now
              </Link>
              <div className="flex flex-wrap gap-5 mt-8 justify-center">
                {["Certified Life Coach", "Certified Health Coach", "Women 40+"].map((tag) => (
                  <div key={tag} className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} style={{ color: "oklch(0.42 0.09 140)" }} />
                    <span className="text-xs font-semibold" style={{ color: "oklch(0.52 0.015 50)" }}>{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quiz graphic with label */}
            <div className="fade-up flex flex-col items-center gap-4">
              <p
                className="font-bold tracking-widest uppercase text-sm"
                style={{ color: "oklch(0.20 0.015 50)", letterSpacing: "0.12em" }}
              >
                Take This Free Quiz
              </p>
              <Image
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/QuizResultsImageTransparent_917137c5.webp"
                alt="Take the Free Quiz — Find Your Food & Mindset Type"
                className="w-full max-w-lg lg:max-w-2xl object-contain drop-shadow-xl"
                width={640}
                height={352}
                sizes="(max-width: 1024px) 100vw, 640px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20" style={{ background: "oklch(1 0 0)" }}>
        <div className="container">
          <div className="text-center mb-12 fade-up">
            <span className="badge-gold mb-3 inline-block">Client Stories</span>
            <h2
              className="font-bold"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "oklch(0.20 0.015 50)" }}
            >
              What Women Just Like You Are Saying
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card-brand rounded-2xl p-6 fade-up flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                    style={{ background: "oklch(0.93 0.06 78)", color: "oklch(0.45 0.12 72)" }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>{t.name}</p>
                    <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>{t.date}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="star-gold" fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm font-bold mb-2" style={{ color: "oklch(0.55 0.11 72)" }}>{t.title}</p>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "oklch(0.45 0.015 50)" }}>"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEET LEE ANNE ── */}
      <section className="py-20" style={{ background: "oklch(0.985 0.008 80)" }}>
        <div className="container">
          {/* Intro tagline */}
          <div className="text-center mb-14 fade-up">
            <p
              className="text-2xl md:text-3xl font-bold italic"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.42 0.09 140)" }}
            >
              Your body isn't failing you. It's asking for a new approach,
            </p>
            <p
              className="text-2xl md:text-3xl font-bold italic"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.55 0.11 72)" }}
            >
              and I can show you the way.
            </p>
          </div>

          {/* Photo + Bio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div className="fade-up">
              <span className="badge-gold mb-4 inline-block">Hi, I'm Lee Anne</span>
              <h2
                className="font-bold mb-6"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "oklch(0.20 0.015 50)" }}
              >
                Your Coach, Your Cheerleader, Your Guide
              </h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: "oklch(0.42 0.015 50)" }}>
                <p>As someone who's raised five children and gone through menopause, <strong style={{ color: "oklch(0.20 0.015 50)" }}>I get it.</strong></p>
                <p>The confusing diets, the never-ending advice that contradicts itself, the exhaustion of endless pressure to make a size 5.</p>
                <p className="italic" style={{ color: "oklch(0.42 0.09 140)", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>Sigh. I've been there so. many. times.</p>
                <p>Because like you, I want to be healthy and feel good in my own skin. That's why I've spent the better part of a decade re-learning how to help my body and mind feel energized and vibrant, no matter what stage I'm in.</p>
                <p>As a certified life and health coach, I've learned tools that felt hidden, but have <strong style={{ color: "oklch(0.20 0.015 50)" }}>changed everything</strong>: my health, my weight, and even my relationships.</p>
                <p>I'm passionate — some say obsessed, <em>ahem</em> — with helping <strong style={{ color: "oklch(0.20 0.015 50)" }}>YOU</strong> learn these same tools. I don't want you spending another sleepless night feeling shame, or spiraling in an unnecessary hot flash.</p>
                <p>Our goal is not just a smaller body, but a <strong style={{ color: "oklch(0.42 0.09 140)" }}>steadier mind, stronger confidence, and a life that finally feels like yours again.</strong></p>
                <p className="font-bold text-lg italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.55 0.11 72)" }}>Let's reclaim your life, your health, and most importantly, your zest and joy!</p>
              </div>
              <Link href="/about" className="inline-flex items-center gap-2 font-bold text-sm mt-8" style={{ color: "oklch(0.55 0.11 72)" }}>
                Read My Full Story <ChevronRight size={16} />
              </Link>
            </div>

            <div className="fade-up">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp"
                  alt="Lee Anne — Certified Life & Health Coach"
                  className="w-full object-cover"
                  style={{ maxHeight: "560px", objectPosition: "top" }}
                  width={682}
                  height={1024}
                  sizes="(max-width: 1024px) 100vw, 682px"
                />
              </div>
            </div>
          </div>

          {/* Certifications + Stay Connected */}
          <div
            className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-md fade-up"
            style={{ border: "1px solid oklch(0.90 0.015 80)" }}
          >
            {/* Left: Certifications */}
            <div className="p-10" style={{ background: "oklch(1 0 0)" }}>
              <h3
                className="font-bold mb-6"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "oklch(0.55 0.11 72)" }}
              >
                Our Certifications
              </h3>
              <div className="flex gap-8 flex-wrap items-center">
                <Image src="https://img1.wsimg.com/isteam/ip/a5a9c59b-2adc-48fc-995e-909cdea8df57/Gemini_Generated_Image_crrbqocrrbqocrrb.png/:/rs=w:100,h:100,cg:true,m/cr=w:100,h:100" alt="Certified Coach" className="h-24 w-auto hover:scale-105 transition-transform" width={100} height={100} />
                <Image src="https://img1.wsimg.com/isteam/ip/a5a9c59b-2adc-48fc-995e-909cdea8df57/FLAG_CERTIFIED_MARK%20(1).jpg/:/rs=w:102,h:100,cg:true,m/cr=w:102,h:100" alt="Fast Like A Girl Certified" className="h-24 w-auto hover:scale-105 transition-transform" width={102} height={100} />
                <Image src="https://img1.wsimg.com/isteam/ip/a5a9c59b-2adc-48fc-995e-909cdea8df57/BTH%20Certified%20Coach%20Badge.png/:/rs=w:100,h:100,cg:true,m/cr=w:100,h:100" alt="Better Than Happy Certified" className="h-24 w-auto hover:scale-105 transition-transform" width={100} height={100} />
              </div>
            </div>

            {/* Right: Stay Connected — blush bg */}
            <div className="p-10" style={{ background: "oklch(0.96 0.025 50)" }}>
              <h3
                className="font-bold mb-6"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "oklch(0.55 0.11 72)" }}
              >
                Stay Connected
              </h3>
              <ul className="space-y-4 mb-6">
                <li>
                  <a href="https://www.youtube.com/playlist?list=PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H" target="_blank" rel="noopener noreferrer" className="font-bold text-lg transition-opacity hover:opacity-70" style={{ color: "oklch(0.42 0.09 140)" }}>
                    Mind &amp; Body Podcast →
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/@MindandBodyResetCoach" target="_blank" rel="noopener noreferrer" className="font-bold text-lg transition-opacity hover:opacity-70" style={{ color: "oklch(0.42 0.09 140)" }}>
                    YouTube Channel →
                  </a>
                </li>
              </ul>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/mindandbodyresetgals/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm transition-all hover:-translate-y-1" style={{ color: "oklch(0.42 0.09 140)" }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://www.facebook.com/MindandBodyReset" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm transition-all hover:-translate-y-1" style={{ color: "oklch(0.42 0.09 140)" }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.tiktok.com/@resetgals8" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm transition-all hover:-translate-y-1" style={{ color: "oklch(0.42 0.09 140)" }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.58-1.01V15.5c0 1.63-.44 3.25-1.31 4.58-1.46 2.25-4.14 3.59-6.8 3.32-2.61-.25-4.9-2.07-5.74-4.52-.94-2.73-.24-5.91 1.79-8.03 1.62-1.74 4.09-2.58 6.44-2.17V12.9c-1.28-.15-2.61.16-3.64 1.01-.8.67-1.27 1.71-1.28 2.75-.01 1.05.47 2.1 1.3 2.75 1.03.8 2.5.94 3.64.3 1.01-.58 1.64-1.68 1.64-2.84V.02z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-20" style={{ background: "oklch(0.96 0.025 50)" }}>
        <div className="container">
          <div className="text-center mb-12 fade-up">
            <span className="badge-gold mb-3 inline-block">Choose Your Path</span>
            <h2
              className="font-bold"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "oklch(0.20 0.015 50)" }}
            >
              A Health Approach That Finally Feels Doable
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free consult card */}
            <div
              className="rounded-2xl p-7 fade-up"
              style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)", boxShadow: "0 2px 16px oklch(0.20 0.015 50 / 0.06)" }}
            >
              <span className="badge-olive mb-3 inline-block">Free</span>
              <h3
                className="font-bold text-xl mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
              >
                Mind & Body Free Consult
              </h3>
              <p className="text-xs mb-1" style={{ color: "oklch(0.52 0.015 50)" }}>30 mins · 1st appointment only</p>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(0.45 0.015 50)" }}>
                In this free call you will learn a new revolutionary way that women just like you are losing the weight and keeping it off forever.
              </p>
              <Link
                href="/book"
                className="btn-gold inline-flex items-center gap-2 text-sm"
              >
                Book Free Call <ArrowRight size={14} />
              </Link>
            </div>

            {/* RECLAIM program card */}
            <div
              className="rounded-2xl p-7 fade-up relative overflow-hidden"
              style={{ background: "oklch(0.93 0.06 78)", border: "2px solid oklch(0.72 0.11 78)" }}
            >
              <div
                className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold"
                style={{ background: "oklch(0.42 0.09 140)", color: "white" }}
              >
                SAVE {PROGRAM.savingsPercent}%
              </div>
              <span className="badge-gold mb-3 inline-block">Signature Program</span>
              <h3
                className="font-bold text-xl mb-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
              >
                {PROGRAM.fullName}
              </h3>
              <p className="text-xs mb-1" style={{ color: "oklch(0.52 0.015 50)" }}>{PROGRAM.sessionDurationMins} mins · {PROGRAM.sessionCount} sessions</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className="text-3xl font-bold"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
                >
                  ${PROGRAM.fullPrice}
                </span>
                <span className="text-base line-through" style={{ color: "oklch(0.52 0.015 50)" }}>${PROGRAM.originalPrice}</span>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(0.42 0.015 50)" }}>
                Experience transformation and empowerment. Unleash your full potential and reclaim control over your mind and body.
              </p>
              <Link
                href="/reclaim"
                className="btn-dark inline-flex items-center gap-2 text-sm"
              >
                Learn About Reclaim Program <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUIZ CTA BANNER — dark forest green strip ── */}
      <section className="py-16 text-center" style={{ background: "oklch(0.32 0.09 148)" }}>
        <div className="container max-w-2xl mx-auto fade-up">
          <h2
            className="font-bold mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "oklch(1 0 0)" }}
          >
            Get Unstuck! Take the Freedom Food Quiz
          </h2>
          <p className="text-base mb-6 leading-relaxed" style={{ color: "oklch(0.88 0.03 148)" }}>
            Stop blaming yourself. Start understanding yourself. This 60-second quiz helps you see why weight loss has felt so hard — and what shifts it.
          </p>
          <a
            href="/food-quiz"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1"
            style={{ background: "oklch(0.72 0.11 78)", color: "oklch(1 0 0)" }}
          >
            Take the Free Quiz <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* ── BLOG PREVIEW ── */}
      <section className="py-20" style={{ background: "oklch(1 0 0)" }}>
        <div className="container">
          <div className="flex items-end justify-between mb-10 fade-up">
            <div>
              <span className="badge-gold mb-3 inline-block">My Blog</span>
              <h2
                className="font-bold"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "oklch(0.20 0.015 50)" }}
              >
                Insights for Your Journey
              </h2>
            </div>
            <Link href="/health-wellness-blog" className="hidden md:inline-flex items-center gap-1 font-bold text-sm" style={{ color: "oklch(0.55 0.11 72)" }}>
All Posts <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayPosts.map((post: any) => (
              <Link key={post.slug} href={`/health-wellness-blog/${post.slug}`} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#e8ddd0] flex flex-col h-full fade-up">
                <div className="h-44 relative overflow-hidden" style={{ background: "oklch(0.93 0.06 78)" }}>
                  {post.coverImage && (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute bottom-3 left-4 badge-gold">{post.category}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>{post.date}</p>
                    {post.readTime && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "oklch(0.88 0.04 75)", color: "oklch(0.38 0.06 75)" }}>
                        {post.readTime} min read
                      </span>
                    )}
                  </div>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
                  >
                    {post.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.52 0.015 50)" }}>{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8 md:hidden fade-up">
            <Link href="/health-wellness-blog" className="inline-flex items-center gap-1 font-bold text-sm" style={{ color: "oklch(0.55 0.11 72)" }}>
              View All Posts <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BOOK CTA ── */}
      <section className="py-20 text-center" style={{ background: "oklch(0.985 0.008 80)" }}>
        <div className="container max-w-xl mx-auto fade-up">
          <span className="badge-gold mb-4 inline-block">Ready to Start?</span>
          <h2
            className="font-bold mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "oklch(0.20 0.015 50)" }}
          >
            Ready to Reclaim Your Life?
          </h2>
          <p className="text-base mb-8 leading-relaxed" style={{ color: "oklch(0.45 0.015 50)" }}>
            Book a free 30-minute discovery call with Lee Anne. No pressure, no commitment — just a real conversation about where you are and where you want to be.
          </p>
          <Link
            href="/book"
            className="btn-gold inline-flex items-center gap-2"
          >
            Book Your Free Discovery Call <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
