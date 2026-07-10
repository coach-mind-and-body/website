"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Link from 'next/link';
;


// Stable CloudFront portraits (Manus signed URLs expire / 403)
const CF = "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG";
const SARA_IMG = `${CF}/4Z7A6652_f211af63.webp`;
const LEEANNE_IMG = `${CF}/3542web-rigeljackson(2)_83b0d4af.webp`;
const BRITTANY_IMG = `${CF}/4Z7A6598_af959cd9.webp`;

interface CoachCardProps {
  name: string;
  title: string;
  shortBio: string;
  fullBio: string;
  img: string;
}

function CoachCard({ name, title, shortBio, fullBio, img }: CoachCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-md" style={{ background: "#ffffff", border: "1px solid oklch(0.93 0.01 160)" }}>
      {/* Photo */}
      <div className="overflow-hidden" style={{ height: "380px" }}>
        <img
          src={img}
          alt={`${name} — ${title}`}
          className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-7 flex flex-col flex-1">
        <h3 className="font-bold text-2xl mb-1 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>
          {name}
        </h3>
        <p className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: "oklch(0.38 0.10 148)" }}>
          {title}
        </p>
        <div className="text-sm leading-relaxed text-center flex-1" style={{ color: "oklch(0.45 0.02 160)" }}>
          <p>{shortBio}</p>
          {expanded && (
            <p className="mt-3">{fullBio}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-5 mx-auto inline-flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: "oklch(0.38 0.10 148)" }}
        >
          {expanded ? (
            <><ChevronUp size={14} /> Show Less</>
          ) : (
            <><ChevronDown size={14} /> Show More</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function About() {
  
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      {/* Hero */}
      <section className="py-20 text-center" style={{ background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.97 0.008 10) 60%)" }}>
        <div className="container max-w-3xl mx-auto">
          <span className="badge-forest mb-4 inline-block">About Us</span>
          <h1 className="font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3rem)", color: "oklch(0.22 0.02 160)" }}>
            Reclaim Your Body.
          </h1>
          <h1 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3rem)", color: "oklch(0.38 0.10 148)" }}>
            Rewire Your Mind. Reset Your Life.
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: "oklch(0.45 0.02 160)", maxWidth: "560px", margin: "0 auto" }}>
            We're a team of certified Mind & Body Coaches who've been exactly where you are — and found a better way.
          </p>
        </div>
      </section>

      {/* ── Meet Your Coaches ── */}
      <section className="py-20">
        <div className="container max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>
              Meet Your Coaches
            </h2>
            <div className="h-px" style={{ background: "oklch(0.88 0.01 160)" }} />
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CoachCard
              name="Sara"
              title="Certified Mind & Body Coach"
              shortBio="I'm Sara — a certified Mind & Body Coach and mom of two under two who knows that motherhood leaves very little time for 'perfect' wellness. After my first baby, I used hormone-aware tools to lose my baby weight in a way that actually fit my life."
              fullBio="Now, as a nursing mom after baby #2, I continue to use and adapt those same tools in the middle of diapers, naps, and real-life chaos. I help women find balance with food, weight loss, and energy — without extremes, guilt, or pressure. Real tools. Real life. Real results, even in this season."
              img={SARA_IMG}
            />
            <CoachCard
              name="Lee Anne"
              title="Certified Mind & Body Coach"
              shortBio="I'm Lee Anne — a certified Mind & Body Coach specializing in menopause, hormone health, and metabolic reset. After uncovering my own insulin resistance and transforming my health, I now guide women through evidence-based strategies."
              fullBio="These strategies restore hormonal balance, rebuild confidence, and create lasting wellbeing. As someone who's raised five children and gone through menopause, I get it. Expert guidance. Proven methods. Real transformation."
              img={LEEANNE_IMG}
            />
            <CoachCard
              name="Brittany"
              title="Certified Mind & Body Coach"
              shortBio="I'm Brittany — a certified Mind & Body Coach helping women build sustainable habits that actually stick. I believe wellness doesn't have to be complicated or all-or-nothing, and I'm here to show you a simpler, kinder path."
              fullBio="Whether you're just starting out or you've tried everything and nothing has worked, I meet you exactly where you are. My approach blends hormone-aware nutrition, mindset coaching, and practical lifestyle tools to help you create a life that feels balanced, energized, and truly yours."
              img={BRITTANY_IMG}
            />
          </div>
        </div>
      </section>


      {/* ── CTA ── */}
      <section className="py-20 text-center" style={{ background: "oklch(0.97 0.008 10)" }}>
        <div className="container max-w-2xl mx-auto">
          <h2 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", color: "oklch(0.22 0.02 160)" }}>
            Ready to Reclaim Your Life?
          </h2>
          <p className="text-base mb-8" style={{ color: "oklch(0.45 0.02 160)" }}>
            Book a free 30-minute discovery call and find out if our coaching is the right fit for you.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
          >
            Book Your Free Call →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
