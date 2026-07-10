"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Activity, Brain, Utensils, Dumbbell } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const CDN = "https://cdn.mindandbodyresetcoach.com/blog-images";
const CF = "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG";

const FAQ = [
  {
    q: "What does insulin resistance feel like after 40?",
    a: "Many women notice energy crashes, stubborn midsection weight, intense cravings, brain fog, and the sense that diets that used to “work” no longer do. Only a clinician can diagnose insulin resistance with appropriate evaluation.",
  },
  {
    q: "Why do diets fail when insulin resistance is in the picture?",
    a: "Extreme restriction can raise stress load and food noise while under-fueling muscle. Midlife often needs steadier meals, protein, strength, sleep, and mindset support — not another crash plan.",
  },
  {
    q: "How does this connect to food noise and night sugar cravings?",
    a: "Blood sugar volatility and under-eating can amplify mental chatter about food and evening urgency. Calming food noise and stabilizing meals usually work together.",
  },
  {
    q: "What about GLP-1 medications?",
    a: "GLP-1s can be useful tools under medical care. Lifestyle foundations still matter for energy, muscle, and life after the medication. See our life after GLP-1 guide for a coaching perspective.",
  },
  {
    q: "Is this medical advice?",
    a: "No. This is health and life coaching education. Work with your healthcare provider for labs, diagnosis, and treatment decisions.",
  },
];

const RELATED = [
  {
    href: "/health-wellness-blog/stop-food-shame-healing-midlife-insulin-resistance",
    title: "Stop Food Shame: Healing Midlife Insulin Resistance",
    blurb: "Mindset and biochemistry — why shame makes metabolic change harder.",
    image: `${CDN}/stop-food-shame-healing-midlife-insulin-resistance.png`,
  },
  {
    href: "/health-wellness-blog/mastering-insulin-fueling-fat-burning-and-energy-after-40",
    title: "Mastering Insulin: Fueling Energy After 40",
    blurb: "Practical midlife fueling concepts for steadier energy.",
    image: `${CDN}/mastering-insulin-fueling-fat-burning-and-energy-after-40.png`,
  },
  {
    href: "/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works",
    title: "How to Stop Sugar Cravings at Night",
    blurb: "Evening cravings strategy for midlife bodies and brains.",
    image: `${CDN}/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works.png`,
  },
  {
    href: "/health-wellness-blog/calming-food-noise-drop-the-food-courtroom",
    title: "How to Calm Food Noise",
    blurb: "Quiet the mental food fight without more restriction.",
    image: `${CDN}/calming-food-noise-drop-the-food-courtroom.jpg`,
  },
  {
    href: "/life-after-glp-1",
    title: "Life After GLP-1",
    blurb: "Maintain progress when medication support changes.",
    image: "/healing_balance_hormones_1780339100250.png",
  },
  {
    href: "/food-quiz",
    title: "Free Food & Mindset Quiz",
    blurb: "60 seconds to spot what is keeping you stuck.",
    image: `${CF}/QuizResultsImageTransparent_917137c5.webp`,
  },
];

const FOUNDATIONS = [
  {
    icon: Utensils,
    title: "Under-fueling raises food noise",
    body: "Chronic restriction can make the brain obsess about food. Noise is not cured by harsher rules.",
    image: `${CDN}/calming-food-noise-drop-the-food-courtroom.jpg`,
  },
  {
    icon: Activity,
    title: "Stress chemistry matters",
    body: "Sleep debt and high stress influence hunger hormones and cravings. Midlife load is real.",
    image: `${CDN}/the-midlife-sleep-crisis.jpg`,
  },
  {
    icon: Dumbbell,
    title: "Muscle is metabolic currency",
    body: "Losing muscle while chasing the scale can worsen energy. Strength and protein matter.",
    image: `${CDN}/stop-chasing-plans-lasting-health-transformation.jpg`,
  },
  {
    icon: Brain,
    title: "Identity keeps the cycle alive",
    body: "If you are “someone always starting over,” habits collapse under pressure. Coaching rewires the decision-maker.",
    image: `${CDN}/reclaim-rewire-reset-become-a-different-decision-maker.png`,
  },
];

export default function InsulinHubClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      <SiteNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden min-h-[520px] flex items-center">
          <div className="absolute inset-0">
            <img
              src={`${CDN}/mastering-insulin-fueling-fat-burning-and-energy-after-40.png`}
              alt="Midlife metabolic health and insulin resistance"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, oklch(0.18 0.03 160 / 0.92) 0%, oklch(0.28 0.06 148 / 0.75) 55%, oklch(0.35 0.05 75 / 0.45) 100%)",
              }}
            />
          </div>
          <div className="container relative z-10 max-w-3xl mx-auto px-4 text-center py-24 md:py-32">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
              style={{ background: "oklch(1 0 0 / 0.18)", color: "oklch(0.97 0.03 80)" }}
            >
              Midlife metabolic health
            </span>
            <h1
              className="font-bold mb-6 leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.1rem, 5vw, 3.4rem)",
                color: "oklch(0.99 0.01 80)",
              }}
            >
              Insulin Resistance After 40: Why You Feel Stuck — and What Helps
            </h1>
            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: "oklch(0.93 0.02 80)" }}>
              If your energy, cravings, and weight feel different than a decade ago, you are not imagining it.
              Plain-language midlife guidance — coaching education, not a diagnosis.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/book">
                <Button className="rounded-full h-12 px-8 bg-[oklch(0.72_0.12_75)] hover:opacity-90 text-[oklch(0.22_0.02_160)] font-bold shadow-lg">
                  Book a free call <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/food-quiz">
                <Button variant="outline" className="rounded-full h-12 px-8 border-white/80 text-white hover:bg-white/10">
                  Take the free quiz
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* What it feels like — image + copy */}
        <section className="py-16 md:py-24">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
              <div className="relative">
                <div
                  className="absolute -inset-3 rounded-[2rem] -rotate-2"
                  style={{ background: "oklch(0.92 0.04 148 / 0.5)" }}
                />
                <img
                  src={`${CDN}/is-it-anxiety-or-is-it-perimenopause.jpg`}
                  alt="Woman in midlife navigating energy and hormonal shifts"
                  className="relative z-10 w-full h-[380px] md:h-[440px] object-cover rounded-[1.5rem] shadow-xl"
                />
              </div>
              <div className="space-y-5 text-lg leading-relaxed" style={{ color: "oklch(0.38 0.02 160)" }}>
                <h2
                  className="text-3xl md:text-4xl font-bold leading-snug"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
                >
                  What insulin resistance can feel like in midlife
                </h2>
                <p>
                  Insulin helps move glucose into cells for energy. When cells become less responsive, the body may
                  produce more insulin to compensate. Many women notice the shift in perimenopause and beyond — not
                  because they “lack willpower,” but because biology, stress, sleep, and decades of diet culture collide.
                </p>
                <p>
                  Common experiences (not a checklist for self-diagnosis): afternoon crashes, intense carb cravings,
                  feeling hungry soon after meals, difficulty losing weight despite effort, and a loud mental debate
                  about food. Talk with your clinician about appropriate evaluation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Photo strip */}
        <section className="pb-4">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { src: `${CDN}/fuel-system-reset-switching-from-sugar-to-fat-burning.jpg`, alt: "Fuel and energy after 40" },
                { src: `${CDN}/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works.png`, alt: "Sugar cravings at night" },
                { src: `${CDN}/the-midlife-permission-slip-why-you-need-a-new-perimenopause-health-strategy.jpg`, alt: "Perimenopause health strategy" },
                { src: `${CF}/fpu-can-you-relate-LRquhXRPb6JDxJMEKYRtRh.webp`, alt: "Lee Anne — real midlife coaching" },
              ].map((img) => (
                <div key={img.src} className="rounded-2xl overflow-hidden h-36 md:h-44 shadow-sm">
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why diets fail — visual cards */}
        <section className="py-16 md:py-24" style={{ background: "oklch(0.97 0.01 148)" }}>
          <div className="container max-w-6xl mx-auto px-4">
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
            >
              Why “just eat less” often backfires
            </h2>
            <p className="text-center max-w-2xl mx-auto mb-12 text-lg" style={{ color: "oklch(0.45 0.02 160)" }}>
              Restriction without support can raise stress, food noise, and the start-over cycle.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {FOUNDATIONS.map((card) => (
                <div
                  key={card.title}
                  className="group rounded-2xl overflow-hidden bg-white border border-[oklch(0.92_0.01_148)] shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="h-44 overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className="w-5 h-5 text-[oklch(0.38_0.10_148)]" />
                      <h3 className="font-bold text-xl" style={{ color: "oklch(0.22 0.02 160)" }}>
                        {card.title}
                      </h3>
                    </div>
                    <p style={{ color: "oklch(0.42 0.02 160)" }}>{card.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Food noise + cravings link section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
              <div className="order-2 md:order-1 space-y-5 text-lg leading-relaxed" style={{ color: "oklch(0.38 0.02 160)" }}>
                <h2
                  className="text-3xl md:text-4xl font-bold"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
                >
                  Food noise, sugar cravings, and the insulin story
                </h2>
                <p>
                  Metabolic volatility and mental food fights often travel together. Stabilizing meals (protein,
                  fiber, regularity) can reduce evening urgency — while mindset work prevents the courtroom drama
                  that keeps you stuck.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <Link
                    href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom"
                    className="inline-flex items-center gap-2 font-bold"
                    style={{ color: "oklch(0.38 0.10 148)" }}
                  >
                    How to calm food noise <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works"
                    className="inline-flex items-center gap-2 font-bold"
                    style={{ color: "oklch(0.38 0.10 148)" }}
                  >
                    Stop night sugar cravings <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/life-after-glp-1"
                    className="inline-flex items-center gap-2 font-bold"
                    style={{ color: "oklch(0.38 0.10 148)" }}
                  >
                    Life after GLP-1 <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
              <div className="order-1 md:order-2 relative">
                <img
                  src={`${CDN}/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works.png`}
                  alt="Nighttime cravings and food noise in midlife"
                  className="w-full h-[360px] md:h-[420px] object-cover rounded-[1.5rem] shadow-xl"
                  loading="lazy"
                />
                <div
                  className="absolute -bottom-4 -left-4 md:-left-6 rounded-2xl overflow-hidden shadow-lg border-4 border-white w-36 h-36 md:w-44 md:h-44"
                >
                  <img
                    src={`${CDN}/calming-food-noise-drop-the-food-courtroom.jpg`}
                    alt="Calming food noise"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What helps CTA band with photo */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={`${CF}/3542web-rigeljackson(2)_83b0d4af.webp`}
              alt="Lee Anne Chapman — midlife health coach"
              className="w-full h-full object-cover object-top"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.18 0.03 160 / 0.94) 0%, oklch(0.22 0.04 148 / 0.88) 50%, oklch(0.25 0.03 160 / 0.75) 100%)",
              }}
            />
          </div>
          <div className="container relative z-10 max-w-3xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              What actually helps (the coaching lens)
            </h2>
            <ul className="text-left max-w-md mx-auto space-y-3 text-white/90 mb-10 text-lg">
              <li>• Steady, satisfying meals — not heroic under-eating</li>
              <li>• Strength training and daily movement you will keep</li>
              <li>• Sleep and stress skills as metabolic tools</li>
              <li>• Thought work for food rules and self-talk</li>
              <li>• Medical partnership for labs and medications when needed</li>
            </ul>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/reclaim">
                <Button className="rounded-full h-12 px-8 bg-[oklch(0.72_0.12_75)] text-[oklch(0.22_0.02_160)] hover:opacity-90 font-bold">
                  Explore R.E.C.L.A.I.M.
                </Button>
              </Link>
              <Link href="/unicity">
                <Button variant="outline" className="rounded-full h-12 px-8 border-white text-white hover:bg-white/10">
                  Feel Great System
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related reading with images */}
        <section className="py-16 md:py-24">
          <div className="container max-w-6xl mx-auto px-4">
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
            >
              Related reading
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {RELATED.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="group block rounded-2xl overflow-hidden bg-white border border-[oklch(0.92_0.01_80)] shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="h-44 overflow-hidden">
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold mb-2 leading-snug text-lg" style={{ color: "oklch(0.22 0.02 160)" }}>
                      {r.title}
                    </h3>
                    <p className="text-sm mb-3" style={{ color: "oklch(0.45 0.02 160)" }}>
                      {r.blurb}
                    </p>
                    <span
                      className="text-xs font-bold inline-flex items-center gap-1"
                      style={{ color: "oklch(0.38 0.10 148)" }}
                    >
                      Read more <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16" style={{ background: "oklch(0.97 0.01 80)" }}>
          <div className="container max-w-3xl mx-auto px-4">
            <h2
              className="text-3xl font-bold text-center mb-8"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
            >
              FAQ
            </h2>
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <div key={i} className="rounded-xl bg-white border border-[oklch(0.92_0.01_80)] overflow-hidden shadow-sm">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 p-5 text-left font-semibold"
                    style={{ color: "oklch(0.22 0.02 160)" }}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {item.q}
                    <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 leading-relaxed" style={{ color: "oklch(0.42 0.02 160)" }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm mt-8" style={{ color: "oklch(0.50 0.02 160)" }}>
              <Link href="/disclaimer" className="underline">
                Disclaimer
              </Link>
              : Lee Anne is a certified coach, not a medical provider.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 text-center">
          <div className="container max-w-2xl mx-auto px-4">
            <img
              src={`${CF}/3542web-rigeljackson(2)_83b0d4af.webp`}
              alt="Lee Anne Chapman"
              className="w-24 h-24 rounded-full object-cover object-top mx-auto mb-6 shadow-md border-4 border-white"
            />
            <h2
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
            >
              Ready for support that includes body and mind?
            </h2>
            <p className="mb-8 text-lg" style={{ color: "oklch(0.42 0.02 160)" }}>
              Start with a free call or the quiz — then decide if R.E.C.L.A.I.M. is the right next step.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/book">
                <Button className="rounded-full h-12 px-8 bg-[oklch(0.38_0.10_148)] text-white font-bold">
                  Book free call
                </Button>
              </Link>
              <Link href="/midlife-health-podcast">
                <Button variant="outline" className="rounded-full h-12 px-8">
                  Listen to the podcast
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
