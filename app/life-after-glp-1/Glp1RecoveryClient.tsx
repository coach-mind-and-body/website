"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
  Activity,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Moon,
  Brain,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const FAQ = [
  {
    q: "What happens when you stop a GLP-1 medication?",
    a: "Many people experience increased appetite, return of food noise, and potential weight regain if lifestyle foundations — protein, strength, sleep, stress, and habits — are not in place. Planning before or during a taper with your prescribing clinician is essential.",
  },
  {
    q: "How can I maintain weight loss after Ozempic or Wegovy?",
    a: "Focus on protein-forward meals, resistance training, sleep, stress regulation, and mindset work around food — not another crash diet. Coaching supports habits and food noise while you work with your medical team on medication decisions.",
  },
  {
    q: "Is coaching a replacement for medical care on GLP-1s?",
    a: "No. Lee Anne is a certified health and life coach, not a medical provider. Always work with your prescribing clinician for medication decisions. Coaching supports habits, mindset, and lifestyle.",
  },
  {
    q: "Why does food noise come back after GLP-1s?",
    a: "GLP-1 medications often quiet appetite and food preoccupation. When the medication effect lessens, the old mental patterns and biology can return. Skills for calming food noise become critical — see our food noise pillar for practical tools.",
  },
  {
    q: "Can natural approaches help after injections?",
    a: "Some women explore lifestyle strategies and product systems (such as the Feel Great System) alongside coaching. Results vary. Nothing replaces personalized medical guidance — use tools as support, not magic.",
  },
];

export default function Glp1Recovery() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main>
        {/* Hero */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-[oklch(0.97_0.01_160)]">
          <div className="container relative z-10 px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[oklch(0.90_0.01_160)] text-sm font-medium text-[oklch(0.40_0.02_160)] mb-4">
                <Leaf className="w-4 h-4" /> Life After GLP-1
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-[oklch(0.22_0.02_160)] leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Life After GLP-1: Maintain Weight Loss Without White-Knuckling
              </h1>
              <p className="text-lg md:text-xl text-[oklch(0.45_0.02_160)] leading-relaxed">
                Coming off Ozempic, Wegovy, or other GLP-1s — or planning ahead — does not have to mean
                rebound chaos. Build metabolic foundations, quiet returning food noise, and create habits
                that last. Coaching education, not medical advice.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/book">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[oklch(0.45_0.08_160)] hover:bg-[oklch(0.40_0.08_160)] text-white h-12 px-8 text-base shadow-lg rounded-full"
                  >
                    Book a free strategy call <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/insulin-resistance-after-40">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 text-base border-[oklch(0.45_0.08_160)] text-[oklch(0.45_0.08_160)] rounded-full hover:bg-[oklch(0.97_0.01_160)]"
                  >
                    Read: insulin after 40
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <h2
                  className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)] mb-6"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  The rebound reality — without the shame
                </h2>
                <div className="space-y-4 text-[oklch(0.45_0.02_160)] leading-relaxed">
                  <p>
                    GLP-1 medications can be powerful tools. Many women finally experience quieter appetite
                    and food noise. The hard part often comes next: what happens when the dose changes, a
                    supply gap hits, or you and your clinician decide to taper.
                  </p>
                  <p>
                    <strong>Weight regain is common when lifestyle foundations were never installed.</strong>{" "}
                    That is not proof you “failed.” It is a signal that biology and habits need a bridge —
                    not another crash diet.
                  </p>
                </div>
                <div className="mt-8 space-y-3">
                  {[
                    "Return of appetite and food noise",
                    "Unresolved insulin resistance patterns",
                    "Lost muscle if protein and strength were neglected",
                    "Old all-or-nothing diet thinking flooding back",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[oklch(0.95_0.02_15)] flex items-center justify-center">
                        <XIcon className="w-3 h-3 text-[oklch(0.55_0.15_15)]" />
                      </div>
                      <span className="text-[oklch(0.35_0.02_160)] font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.95_0.02_160)] to-[oklch(0.90_0.05_160)] rounded-2xl transform rotate-3" />
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                  alt="Woman navigating midlife health after GLP-1 medications"
                  className="relative z-10 rounded-2xl shadow-xl w-full object-cover h-[400px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Food noise return */}
        <section className="py-20 bg-[oklch(0.98_0.005_160)] border-y border-[oklch(0.90_0.01_160)]">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)] mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              When food noise comes roaring back
            </h2>
            <div className="space-y-4 text-[oklch(0.45_0.02_160)] leading-relaxed text-lg">
              <p>
                One of the most disorienting parts of life after GLP-1 is the return of mental chatter about
                food. For months, the volume was lower. Then the old soundtrack returns — and panic says
                “I need a stricter plan.”
              </p>
              <p>
                Stricter plans often make noise louder. Skills make it quieter. Learn practical tools in{" "}
                <Link href="/health-wellness-blog/calming-food-noise-drop-the-food-courtroom" className="underline font-semibold text-[oklch(0.38_0.10_148)]">
                  how to calm food noise
                </Link>{" "}
                and{" "}
                <Link href="/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works" className="underline font-semibold text-[oklch(0.38_0.10_148)]">
                  how to stop sugar cravings at night
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Foundations grid */}
        <section className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2
                className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)] mb-4"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                The holistic bridge: foundations that travel with you
              </h2>
              <p className="text-[oklch(0.45_0.02_160)] text-lg">
                Whether you are on a GLP-1, tapering, or finished, these levers support metabolic health and
                sanity.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Activity,
                  title: "Address insulin resistance patterns",
                  desc: "Steady meals, fiber, protein, and movement support blood sugar stability — the context many midlife women were missing before the shot.",
                  link: "/insulin-resistance-after-40",
                  linkText: "Insulin resistance after 40",
                },
                {
                  icon: Dumbbell,
                  title: "Protect muscle with strength",
                  desc: "Muscle is metabolic insurance. Resistance training and adequate protein help preserve lean mass during and after weight loss.",
                  link: "/habit-tracker",
                  linkText: "Track daily habits",
                },
                {
                  icon: Brain,
                  title: "Rewire food rules and identity",
                  desc: "If your identity is still “someone always on a diet,” regain is more likely. Thought work and coaching rewrite the script.",
                  link: "/reclaim",
                  linkText: "R.E.C.L.A.I.M. coaching",
                },
                {
                  icon: Moon,
                  title: "Sleep and stress are metabolic",
                  desc: "Cortisol and sleep debt amplify cravings. Nervous system skills are not optional fluff after GLP-1s.",
                  link: "/holistic-health-and-wellness",
                  linkText: "Holistic midlife health",
                },
                {
                  icon: ShieldCheck,
                  title: "Optional natural support tools",
                  desc: "Some women explore systems like Feel Great (Unimate + Balance) with coaching support as part of a broader lifestyle bridge.",
                  link: "/unicity",
                  linkText: "Feel Great System",
                },
                {
                  icon: Leaf,
                  title: "Know your stuck pattern",
                  desc: "Start with clarity: the free food and mindset quiz highlights what is driving the loop — not just what to eat.",
                  link: "/food-quiz",
                  linkText: "Take the free quiz",
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-[oklch(0.95_0.01_160)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[oklch(0.95_0.02_160)] flex items-center justify-center mb-6">
                    <card.icon className="w-6 h-6 text-[oklch(0.45_0.08_160)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[oklch(0.22_0.02_160)] mb-3">{card.title}</h3>
                  <p className="text-[oklch(0.45_0.02_160)] mb-6 leading-relaxed">{card.desc}</p>
                  <Link
                    href={card.link}
                    className="inline-flex items-center text-[oklch(0.45_0.08_160)] font-semibold hover:text-[oklch(0.35_0.08_160)] transition-colors"
                  >
                    {card.linkText} <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Habits not white-knuckling */}
        <section className="py-20 bg-[oklch(0.97_0.01_160)]">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-6 text-[oklch(0.40_0.02_160)] leading-relaxed text-lg">
            <h2
              className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Habits beat white-knuckling
            </h2>
            <p>
              White-knuckling works until life gets hard. The women who maintain progress treat health like a
              set of practiced skills: meal structure, movement they will actually do, evening rituals, and
              self-talk that does not collapse into shame.
            </p>
            <p>
              That is the heart of midlife coaching — not a meal plan you abandon in three weeks. If you want
              structured support, explore{" "}
              <Link href="/reclaim" className="underline font-semibold text-[oklch(0.38_0.10_148)]">
                R.E.C.L.A.I.M.
              </Link>{" "}
              or{" "}
              <Link href="/book" className="underline font-semibold text-[oklch(0.38_0.10_148)]">
                book a free discovery call
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Unicity bridge */}
        <section className="py-24 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="order-2 lg:order-1 relative">
                <div className="absolute inset-0 bg-[oklch(0.95_0.02_160)] rounded-full blur-3xl opacity-50" />
                <img
                  src="https://images.unsplash.com/photo-1542442828-287217bfb829?q=80&w=2070&auto=format&fit=crop"
                  alt="Natural metabolic support lifestyle"
                  className="relative z-10 rounded-2xl shadow-2xl object-cover w-full h-[420px]"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 text-[oklch(0.45_0.08_160)] font-semibold tracking-wide uppercase text-sm mb-4">
                  Optional support tool
                </div>
                <h2
                  className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)] mb-6 leading-tight"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Feel Great System — coaching-informed, not a miracle claim
                </h2>
                <div className="space-y-6 text-[oklch(0.45_0.02_160)] text-lg leading-relaxed">
                  <p>
                    Some clients explore the{" "}
                    <Link href="/unicity" className="text-[oklch(0.45_0.08_160)] underline">
                      Unicity Feel Great System
                    </Link>{" "}
                    (Unimate + Balance) as part of a broader midlife strategy for satiety and consistency.
                    It is a tool — not a replacement for medical care, strength training, or mindset work.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Pair any product with real food skills and habits",
                      "Keep your prescribing clinician in the loop on all decisions",
                      "Use coaching when food noise or identity patterns return",
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-[oklch(0.55_0.15_145)] shrink-0" />
                        <span className="font-medium text-[oklch(0.35_0.02_160)]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <Link href="/unicity">
                      <Button className="bg-[oklch(0.45_0.08_160)] hover:bg-[oklch(0.40_0.08_160)] text-white h-12 px-8 rounded-full">
                        Explore Feel Great with coaching context
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visible FAQ */}
        <section className="py-20 bg-[oklch(0.98_0.005_160)]">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)] mb-10 text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white border border-[oklch(0.92_0.01_160)] overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 p-5 text-left font-semibold text-[oklch(0.22_0.02_160)]"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    {item.q}
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-[oklch(0.45_0.02_160)] leading-relaxed">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm mt-8 text-[oklch(0.50_0.02_160)]">
              See also our{" "}
              <Link href="/disclaimer" className="underline">
                disclaimer
              </Link>
              . Coaching is not medical care.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-[oklch(0.22_0.02_160)] text-white relative overflow-hidden">
          <div className="container relative z-10 px-4 text-center max-w-3xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Build your exit strategy — or your stay-strong plan
            </h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              Whether you are preparing to taper or already off medication, you do not have to figure out
              habits and food noise alone.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/book">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg bg-white text-[oklch(0.22_0.02_160)] hover:bg-[oklch(0.95_0.02_160)] rounded-full"
                >
                  Book your free call
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 text-lg border-white text-white hover:bg-white/10 rounded-full"
                >
                  Meet Lee Anne
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

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
