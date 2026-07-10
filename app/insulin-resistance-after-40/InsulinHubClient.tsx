"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Activity, Brain, Utensils, Dumbbell } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

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
  },
  {
    href: "/health-wellness-blog/mastering-insulin-fueling-fat-burning-and-energy-after-40",
    title: "Mastering Insulin: Fueling Energy After 40",
    blurb: "Practical midlife fueling concepts for steadier energy.",
  },
  {
    href: "/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works",
    title: "How to Stop Sugar Cravings at Night",
    blurb: "Evening cravings strategy for midlife bodies and brains.",
  },
  {
    href: "/health-wellness-blog/calming-food-noise-drop-the-food-courtroom",
    title: "How to Calm Food Noise",
    blurb: "Quiet the mental food fight without more restriction.",
  },
  {
    href: "/life-after-glp-1",
    title: "Life After GLP-1",
    blurb: "Maintain progress when medication support changes.",
  },
  {
    href: "/food-quiz",
    title: "Free Food & Mindset Quiz",
    blurb: "60 seconds to spot what is keeping you stuck.",
  },
];

export default function InsulinHubClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      <SiteNav />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/metabolism_after_40_1780339113905.png"
              alt="Midlife metabolic health and insulin resistance"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.22 0.02 160 / 0.88) 0%, oklch(0.30 0.06 148 / 0.82) 100%)",
              }}
            />
          </div>
          <div className="container relative z-10 max-w-3xl mx-auto px-4 text-center py-20 md:py-28">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "oklch(1 0 0 / 0.15)", color: "oklch(0.95 0.03 80)" }}
            >
              Midlife metabolic health
            </span>
            <h1
              className="font-bold mb-6 leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                color: "oklch(0.98 0.01 80)",
              }}
            >
              Insulin Resistance After 40: Why You Feel Stuck — and What Helps
            </h1>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: "oklch(0.92 0.02 80)" }}>
              If your energy, cravings, and weight feel different than they did a decade ago, you are not
              imagining it. This hub explains midlife insulin resistance in plain language — and connects you
              to practical next steps. Coaching education only; not a diagnosis.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/book">
                <Button className="rounded-full h-12 px-8 bg-[oklch(0.72_0.12_75)] hover:opacity-90 text-[oklch(0.22_0.02_160)] font-bold">
                  Book a free call <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/food-quiz">
                <Button variant="outline" className="rounded-full h-12 px-8 border-white text-white hover:bg-white/10">
                  Take the free quiz
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-3xl mx-auto px-4 space-y-5 text-lg leading-relaxed" style={{ color: "oklch(0.38 0.02 160)" }}>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
            >
              What insulin resistance can feel like in midlife
            </h2>
            <p>
              Insulin is a hormone that helps move glucose into cells for energy. When cells become less
              responsive over time, the body may produce more insulin to compensate. Women often notice the
              shift in perimenopause and beyond — not because they suddenly “lack willpower,” but because
              biology, stress, sleep, and decades of diet culture collide.
            </p>
            <p>
              Common experiences (not a checklist for self-diagnosis): afternoon energy crashes, intense
              carb cravings, feeling hungry soon after meals, difficulty losing weight despite effort, and a
              loud mental debate about food. If this sounds familiar, talk with your clinician about
              appropriate evaluation.
            </p>
          </div>
        </section>

        <section className="py-16" style={{ background: "oklch(0.97 0.01 148)" }}>
          <div className="container max-w-5xl mx-auto px-4">
            <h2
              className="text-3xl font-bold text-center mb-12"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
            >
              Why “just eat less” often backfires
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Utensils,
                  title: "Under-fueling raises food noise",
                  body: "Chronic restriction can make the brain obsess about food. Noise is not cured by harsher rules — see our food noise pillar.",
                },
                {
                  icon: Activity,
                  title: "Stress chemistry matters",
                  body: "Sleep debt and high stress influence hunger hormones and cravings. Midlife load is real; your plan must account for it.",
                },
                {
                  icon: Dumbbell,
                  title: "Muscle is metabolic currency",
                  body: "Losing muscle while chasing the scale can worsen energy. Strength and protein are part of a midlife strategy.",
                },
                {
                  icon: Brain,
                  title: "Identity keeps the cycle alive",
                  body: "If you are “someone always starting over,” habits collapse under pressure. Coaching rewires the decision-maker.",
                },
              ].map((card) => (
                <div key={card.title} className="bg-white rounded-2xl p-7 border border-[oklch(0.92_0.01_148)] shadow-sm">
                  <card.icon className="w-8 h-8 mb-4 text-[oklch(0.38_0.10_148)]" />
                  <h3 className="font-bold text-xl mb-2" style={{ color: "oklch(0.22 0.02 160)" }}>
                    {card.title}
                  </h3>
                  <p style={{ color: "oklch(0.42 0.02 160)" }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-3xl mx-auto px-4 space-y-5 text-lg leading-relaxed" style={{ color: "oklch(0.38 0.02 160)" }}>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
            >
              Food noise, sugar cravings, and the insulin story
            </h2>
            <p>
              Metabolic volatility and mental food fights often travel together. Stabilizing meals (protein,
              fiber, regularity) can reduce evening urgency — while mindset work prevents the courtroom
              drama that keeps you stuck.
            </p>
            <p>
              Deep dives:{" "}
              <Link href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom" className="underline font-semibold text-[oklch(0.38_0.10_148)]">
                calm food noise
              </Link>
              {" · "}
              <Link href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works" className="underline font-semibold text-[oklch(0.38_0.10_148)]">
                stop night sugar cravings
              </Link>
              {" · "}
              <Link href="/life-after-glp-1" className="underline font-semibold text-[oklch(0.38_0.10_148)]">
                life after GLP-1
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="py-16" style={{ background: "oklch(0.22 0.02 160)" }}>
          <div className="container max-w-3xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              What actually helps (the coaching lens)
            </h2>
            <ul className="text-left max-w-xl mx-auto space-y-3 text-white/85 mb-8">
              <li>• Steady, satisfying meals — not heroic under-eating</li>
              <li>• Strength training and daily movement you will keep</li>
              <li>• Sleep and stress skills as metabolic tools</li>
              <li>• Thought work for food rules and self-talk</li>
              <li>• Medical partnership for labs and medications when needed</li>
              <li>• Optional tools (e.g. <Link href="/unicity" className="underline text-white">Feel Great System</Link>) inside a bigger lifestyle plan</li>
            </ul>
            <Link href="/reclaim">
              <Button className="rounded-full h-12 px-8 bg-[oklch(0.72_0.12_75)] text-[oklch(0.22_0.02_160)] hover:opacity-90 font-bold">
                Explore R.E.C.L.A.I.M. coaching
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-5xl mx-auto px-4">
            <h2
              className="text-3xl font-bold text-center mb-10"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
            >
              Related reading
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {RELATED.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="block rounded-2xl p-6 bg-white border border-[oklch(0.92_0.01_80)] shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold mb-2 leading-snug" style={{ color: "oklch(0.22 0.02 160)" }}>
                    {r.title}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: "oklch(0.45 0.02 160)" }}>
                    {r.blurb}
                  </p>
                  <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: "oklch(0.38 0.10 148)" }}>
                    Read <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

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
                <div key={i} className="rounded-xl bg-white border border-[oklch(0.92_0.01_80)] overflow-hidden">
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

        <section className="py-20 text-center">
          <div className="container max-w-2xl mx-auto px-4">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
            >
              Ready for support that includes body and mind?
            </h2>
            <p className="mb-8" style={{ color: "oklch(0.42 0.02 160)" }}>
              Start with a free call or the quiz — then decide if R.E.C.L.A.I.M. is the right next step.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/book">
                <Button className="rounded-full h-12 px-8 bg-[oklch(0.38_0.10_148)] text-white">Book free call</Button>
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
