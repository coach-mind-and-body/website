"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const CDN = "https://cdn.mindandbodyresetcoach.com/blog-images";

type Card = {
  href: string;
  title: string;
  blurb: string;
  tag: string;
  image: string;
};

const CLUSTERS: { heading: string; intro: string; cards: Card[] }[] = [
  {
    heading: "Weight, belly & the scale after 40",
    intro:
      "When eating less stops working, the answer is rarely more punishment. Start with the questions women actually type into Google at midnight.",
    cards: [
      {
        href: "/health-wellness-blog/why-am-i-gaining-weight-after-40-even-when-i-eat-less",
        title: "Why Am I Gaining Weight After 40 Even When I Eat Less?",
        blurb: "Patterns over belly panic — future you vs craving you.",
        tag: "Core guide",
        image: `${CDN}/patterns-not-the-belly-unlocking-weight-loss-success-after-40.jpg`,
      },
      {
        href: "/health-wellness-blog/menopause-belly-why-it-shows-up-and-what-actually-helps",
        title: "Menopause Belly: Why It Shows Up (And What Actually Helps)",
        blurb: "Midsection change is real. Spot reduction is not the whole story.",
        tag: "Menopause belly",
        image: `${CDN}/patterns-not-the-belly-unlocking-weight-loss-success-after-40-walk.jpg`,
      },
      {
        href: "/health-wellness-blog/how-to-stop-starting-over-every-monday-after-40",
        title: "How to Stop Starting Over Every Monday After 40",
        blurb: "End the all-or-nothing restart cycle. Build identity, not hero weeks.",
        tag: "Mindset",
        image: `${CDN}/stop-chasing-plans-lasting-health-transformation_1780341583637.jpg`,
      },
      {
        href: "/health-wellness-blog/beyond-willpower-how-to-stop-self-sabotaging-weight-loss-after-40",
        title: "Beyond Willpower: Stop Self-Sabotaging After 40",
        blurb: "When the 9 p.m. kitchen stand-off is an identity problem.",
        tag: "Patterns",
        image: `${CDN}/beyond-willpower-how-to-stop-self-sabotaging-weight-loss-after-40.png`,
      },
    ],
  },
  {
    heading: "Food noise, cravings & evenings",
    intro:
      "If your brain will not shut up about food, restriction is usually making it louder — not quieter.",
    cards: [
      {
        href: "/health-wellness-blog/calming-food-noise-drop-the-food-courtroom",
        title: "How to Calm Food Noise After 40",
        blurb: "Definitive guide: what it is, midlife amplifiers, and skills that work.",
        tag: "Pillar",
        image: `${CDN}/calming-food-noise-drop-the-food-courtroom-calm-evening.jpg`,
      },
      {
        href: "/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works",
        title: "How to Stop Sugar Cravings at Night",
        blurb: "The 9 p.m. sugar urge is a midlife strategy problem — not a moral one.",
        tag: "Night cravings",
        image: `${CDN}/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works.png`,
      },
      {
        href: "/health-wellness-blog/how-to-stop-emotional-eating-after-40-without-shame",
        title: "How to Stop Emotional Eating After 40 Without Shame",
        blurb: "Stress, habit, under-fueling, and the pause that changes the night.",
        tag: "Emotional eating",
        image: `${CDN}/weight-loss-mindset-mind-the-gap-to-find-your-peace_1780341577441.webp`,
      },
      {
        href: "/health-wellness-blog/what-if-you-did-an-exercise-snack-instead",
        title: "What If You Did an Exercise Snack Instead?",
        blurb: "Two-minute movement that can beat the afternoon pantry raid.",
        tag: "Movement",
        image: `${CDN}/what-if-you-did-an-exercise-snack-instead.jpg`,
      },
      {
        href: "/snack-hack",
        title: "Free Snack Hack Guide",
        blurb: "Practical off-ramps for late-night snacking.",
        tag: "Free tool",
        image: `${CDN}/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works.png`,
      },
    ],
  },
  {
    heading: "Insulin, metabolism & GLP-1s",
    intro:
      "Metabolic context without medical cosplay. Education, habits, and life after the shot.",
    cards: [
      {
        href: "/insulin-resistance-after-40",
        title: "Insulin Resistance After 40",
        blurb: "Why energy, cravings, and weight can feel different — coaching education.",
        tag: "Pillar hub",
        image: `${CDN}/mastering-insulin-fueling-fat-burning-and-energy-after-40.png`,
      },
      {
        href: "/life-after-glp-1",
        title: "Life After GLP-1",
        blurb: "Maintain progress when Ozempic, Wegovy, or other GLP-1s change.",
        tag: "Pillar hub",
        image: `${CDN}/when-your-body-stops-responding-finding-the-balance.png`,
      },
      {
        href: "/health-wellness-blog/food-noise-after-stopping-ozempic-or-wegovy",
        title: "Food Noise After Stopping Ozempic or Wegovy",
        blurb: "When the quiet ends — skills for the return of food chatter.",
        tag: "GLP-1",
        image: `${CDN}/calming-food-noise-drop-the-food-courtroom-balanced-plate.jpg`,
      },
      {
        href: "/unicity",
        title: "Feel Great System (Unicity)",
        blurb: "Unimate + Balance explained with midlife coaching context.",
        tag: "Product education",
        image: `${CDN}/fuel-system-reset-switching-from-sugar-to-fat-burning_1780341579953.jpg`,
      },
    ],
  },
  {
    heading: "Sleep, hormones & “what is wrong with me?”",
    intro: "The symptoms that send women googling at 3 a.m.",
    cards: [
      {
        href: "/health-wellness-blog/why-you-wake-up-at-3am-in-midlife",
        title: "Why You Wake Up at 3 a.m. in Midlife",
        blurb: "Sleep, stress, and evening patterns that steal rest.",
        tag: "Sleep",
        image: `${CDN}/the-midlife-sleep-crisis_1780341582693.jpg`,
      },
      {
        href: "/health-wellness-blog/is-it-anxiety-or-is-it-perimenopause",
        title: "Is It Anxiety or Perimenopause?",
        blurb: "When your body and mind both feel off.",
        tag: "Perimenopause",
        image: `${CDN}/is-it-anxiety-or-is-it-perimenopause_1780341580726.jpg`,
      },
      {
        href: "/health-wellness-blog/the-midlife-sleep-crisis",
        title: "The Midlife Sleep Crisis",
        blurb: "Why rest gets harder — and what supports better nights.",
        tag: "Sleep",
        image: `${CDN}/the-midlife-sleep-crisis_1780341582693.jpg`,
      },
      {
        href: "/holistic-health-and-wellness",
        title: "Holistic Health for Women Over 40",
        blurb: "Body, mind, and nervous system together.",
        tag: "Hub",
        image: `${CDN}/the-midlife-permission-slip-why-you-need-a-new-perimenopause-health-strategy_1780341585171.jpg`,
      },
    ],
  },
];

export default function MidlifeWeightHubClient() {
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      <SiteNav />
      <main>
        <section
          className="py-16 md:py-24"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.30 0.09 148) 0%, oklch(0.38 0.10 148) 100%)",
          }}
        >
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "oklch(0.85 0.06 78)" }}
            >
              Free resource hub · Women 40+
            </p>
            <h1
              className="font-bold mb-6 leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                color: "oklch(0.99 0.01 80)",
              }}
            >
              Midlife Weight Loss After 40: What Actually Helps
            </h1>
            <p
              className="text-lg leading-relaxed mb-8 max-w-2xl mx-auto"
              style={{ color: "oklch(0.93 0.02 80)" }}
            >
              Midlife weight loss after 40 is rarely a willpower problem. Menopause, insulin
              shifts, food noise, and night cravings need a different playbook than the diets
              that worked at 28. Pick the guide that matches what you actually googled.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/book">
                <Button className="rounded-full h-12 px-8 bg-[oklch(0.72_0.12_75)] hover:opacity-90 text-[oklch(0.22_0.02_160)] font-bold">
                  Book a free clarity call <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/food-quiz">
                <Button
                  variant="outline"
                  className="rounded-full h-12 px-8 border-white/80 text-white hover:bg-white/10"
                >
                  Take the free quiz
                </Button>
              </Link>
            </div>
            <p className="text-sm mt-6" style={{ color: "oklch(0.88 0.03 148)" }}>
              Coaching education only — not medical advice.
            </p>
          </div>
        </section>

        <section className="py-10 border-b" style={{ borderColor: "oklch(0.92 0.01 80)" }}>
          <div className="container max-w-4xl mx-auto px-4">
            <p className="text-center text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
              <strong style={{ color: "oklch(0.25 0.02 160)" }}>Quick start:</strong> If your brain
              will not stop talking about food, read{" "}
              <Link
                href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom"
                className="font-semibold underline"
                style={{ color: "oklch(0.38 0.10 148)" }}
              >
                how to calm food noise
              </Link>
              . If the quiet ended after Ozempic or Wegovy, start with{" "}
              <Link
                href="/health-wellness-blog/food-noise-after-stopping-ozempic-or-wegovy"
                className="font-semibold underline"
                style={{ color: "oklch(0.38 0.10 148)" }}
              >
                food noise after stopping a GLP-1
              </Link>
              . If the midsection showed up overnight, start with{" "}
              <Link
                href="/health-wellness-blog/menopause-belly-why-it-shows-up-and-what-actually-helps"
                className="font-semibold underline"
                style={{ color: "oklch(0.38 0.10 148)" }}
              >
                menopause belly
              </Link>
              . If the scale will not move even when you eat less, open{" "}
              <Link
                href="/health-wellness-blog/why-am-i-gaining-weight-after-40-even-when-i-eat-less"
                className="font-semibold underline"
                style={{ color: "oklch(0.38 0.10 148)" }}
              >
                this guide
              </Link>
              .
            </p>
          </div>
        </section>

        {CLUSTERS.map((cluster) => (
          <section key={cluster.heading} className="py-14 md:py-16">
            <div className="container max-w-6xl mx-auto px-4">
              <h2
                className="font-bold mb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                  color: "oklch(0.22 0.02 160)",
                }}
              >
                {cluster.heading}
              </h2>
              <p className="mb-8 max-w-2xl" style={{ color: "oklch(0.42 0.02 160)" }}>
                {cluster.intro}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cluster.cards.map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group rounded-2xl overflow-hidden bg-white shadow-sm border transition-shadow hover:shadow-md"
                    style={{ borderColor: "oklch(0.92 0.01 80)" }}
                  >
                    <div className="h-40 overflow-hidden bg-[oklch(0.95_0.01_80)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "oklch(0.50 0.08 148)" }}
                      >
                        {card.tag}
                      </span>
                      <h3
                        className="font-bold text-lg mt-1 mb-2 leading-snug group-hover:underline"
                        style={{ color: "oklch(0.22 0.02 160)" }}
                      >
                        {card.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "oklch(0.45 0.02 160)" }}>
                        {card.blurb}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="py-16" style={{ background: "oklch(0.96 0.02 148)" }}>
          <div className="container max-w-2xl mx-auto px-4 text-center">
            <h2
              className="font-bold mb-4"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                color: "oklch(0.22 0.02 160)",
              }}
            >
              Ready for support that is not another meal plan?
            </h2>
            <p className="mb-8" style={{ color: "oklch(0.40 0.02 160)" }}>
              R.E.C.L.A.I.M. is 1:1 coaching for women 40+ — mindset, habits, and midlife patterns.
              Or start free with the quiz.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/reclaim">
                <Button className="rounded-full h-12 px-8 font-bold" style={{ background: "oklch(0.38 0.10 148)" }}>
                  Explore R.E.C.L.A.I.M.
                </Button>
              </Link>
              <Link href="/book">
                <Button variant="outline" className="rounded-full h-12 px-8 font-bold">
                  Book a free call
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
