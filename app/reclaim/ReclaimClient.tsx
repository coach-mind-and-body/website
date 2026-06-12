"use client";

import { useEffect } from "react";
import Link from 'next/link';
;
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { BRAND, PROGRAM, GOOGLE_CALENDAR } from "@shared/brand";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";


const RECLAIM_LETTERS = [
  { letter: "R", word: "Reclaim", desc: "Take back ownership of your body and your story." },
  { letter: "E", word: "Empower", desc: "Build the mindset tools that make lasting change possible." },
  { letter: "C", word: "Connect", desc: "Reconnect with your body's signals and your own wisdom." },
  { letter: "L", word: "Live", desc: "Stop surviving and start truly living in your body." },
  { letter: "A", word: "Align", desc: "Align your habits with your values, not diet culture." },
  { letter: "I", word: "Integrate", desc: "Integrate sustainable practices that fit your real life." },
  { letter: "M", word: "Maintain", desc: "Build the foundation to maintain your results forever." },
];

const WHAT_INCLUDED = [
  "6 private 50-minute coaching sessions with Lee Anne",
  "Personalized action plan after each session",
  "Thought work and mindset tools you keep forever",
  "Hormonal health education tailored to your stage",
  "Mindful eating strategies — no meal plans, no counting",
  "Email support between sessions",
  "Post-program follow-up and resources",
];

const FAQ = [
  {
    q: "Is this a diet program?",
    a: "No. R.E.C.L.A.I.M. is a coaching program focused on the mind-body connection. We don't give you a meal plan or tell you what to eat. Instead, we work on the thoughts, beliefs, and patterns that are keeping you stuck — which is what actually creates lasting change.",
  },
  {
    q: "What if I've tried everything and nothing has worked?",
    a: "That's exactly who this program is designed for. If you've done the diets, the challenges, and the programs and still feel stuck, it's not because you lack willpower. It's because those approaches don't address the root cause. We do.",
  },
  {
    q: "How are the sessions conducted?",
    a: "All sessions are conducted via Google Meet — a video call you can join from your computer, tablet, or phone. Sessions are 50 minutes and scheduled at a time that works for you.",
  },
  {
    q: "What is the $200 deposit option?",
    a: "You can secure your spot with a non-refundable $200 deposit and pay the remaining $397 balance before your first session. The full $597 payment is also available if you prefer to pay upfront.",
  },
  {
    q: "How quickly will I see results?",
    a: "Most clients notice a shift in their relationship with food and their body within the first 2–3 sessions. Lasting physical changes depend on consistency, but the mental shifts — which drive everything else — happen quickly.",
  },
  {
    q: "Is this right for me if I'm in perimenopause or menopause?",
    a: "Absolutely. Lee Anne specializes in women 40+ navigating hormonal shifts. Understanding how your hormones affect your hunger, cravings, and mood is a core part of the program.",
  },
];

export default function Reclaim() {
  
  const { trackViewContent } = useMetaPixel();
  const ga = useGoogleAnalytics();

  useEffect(() => {
    // Fire ViewContent when visitor views the R.E.C.L.A.I.M. program page
    trackViewContent({ content_name: "R.E.C.L.A.I.M. Coaching Program", content_category: "Coaching", content_type: "product" });
    ga.trackViewContent({ item_name: "R.E.C.L.A.I.M. Coaching Program", item_category: "Coaching" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      {/* Hero */}
      <section className="py-20 relative overflow-hidden" style={{ background: "oklch(0.22 0.02 160)" }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: "oklch(0.72 0.12 75)", transform: "translate(30%, -30%)" }} />
        <div className="container max-w-3xl mx-auto text-center relative z-10">
          <span className="badge-gold mb-4 inline-block">Introductory Offer</span>
          <h1 className="font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.4rem, 5vw, 3.8rem)", color: "oklch(0.97 0.008 10)", lineHeight: 1.15 }}>
            {PROGRAM.fullName}
          </h1>
          <p className="text-xl italic mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.72 0.12 75)" }}>
            Experience transformation and empowerment. Unleash your full potential and reclaim control over your mind and body.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.72 0.12 75)" }}>${PROGRAM.fullPrice}</div>
              <div className="text-sm line-through" style={{ color: "oklch(0.60 0.02 160)" }}>${PROGRAM.originalPrice}</div>
            </div>
            <div className="px-4 py-2 rounded-full font-bold text-sm" style={{ background: "oklch(0.38 0.10 148)", color: "white" }}>
              SAVE {PROGRAM.savingsPercent}%
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/enroll" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
              Enroll Now — ${PROGRAM.fullPrice} <ArrowRight size={18} />
            </Link>
            <Link href="/book" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base border-2 transition-all hover:shadow-md" style={{ borderColor: "oklch(0.72 0.12 75)", color: "oklch(0.72 0.12 75)", background: "transparent" }}>
              Book Free Discovery Call First
            </Link>
          </div>
        </div>
      </section>

      {/* R.E.C.L.A.I.M. Acronym */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge-forest mb-3 inline-block">The Framework</span>
            <h2 className="font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "oklch(0.22 0.02 160)" }}>
              What Does R.E.C.L.A.I.M. Mean?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RECLAIM_LETTERS.map((item) => (
              <div key={item.letter} className="flex items-start gap-4 p-5 rounded-xl card-brand">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl" style={{ background: "oklch(0.93 0.06 75)", color: "oklch(0.45 0.12 65)", fontFamily: "'Cormorant Garamond', serif" }}>
                  {item.letter}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ color: "oklch(0.22 0.02 160)" }}>{item.word}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.45 0.02 160)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20" style={{ background: "oklch(0.93 0.06 75)" }}>
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="badge-gold mb-3 inline-block">Everything Included</span>
            <h2 className="font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "oklch(0.22 0.02 160)" }}>
              What You Get in the 6-Week Program
            </h2>
          </div>
          <div className="space-y-3">
            {WHAT_INCLUDED.map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl bg-white/70">
                <CheckCircle2 size={18} style={{ color: "oklch(0.38 0.10 148)", flexShrink: 0, marginTop: 2 }} />
                <span className="text-base" style={{ color: "oklch(0.42 0.02 160)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="badge-gold mb-3 inline-block">Investment</span>
            <h2 className="font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "oklch(0.22 0.02 160)" }}>
              Choose Your Payment Option
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full payment */}
            <div className="rounded-2xl p-8 text-center relative overflow-hidden" style={{ background: "oklch(0.22 0.02 160)", border: "2px solid oklch(0.72 0.12 75)" }}>
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>BEST VALUE</div>
              <h3 className="font-bold text-xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Pay in Full</h3>
              <div className="text-5xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.72 0.12 75)" }}>${PROGRAM.fullPrice}</div>
              <div className="text-sm line-through mb-4" style={{ color: "oklch(0.60 0.02 160)" }}>${PROGRAM.originalPrice}</div>
              <p className="text-sm mb-6" style={{ color: "oklch(0.65 0.02 160)" }}>One payment. Full access. Immediate enrollment.</p>
              <Link href="/enroll?plan=full" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:shadow-lg w-full justify-center" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
                Enroll — Pay in Full <ArrowRight size={16} />
              </Link>
            </div>
            {/* Deposit */}
            <div className="rounded-2xl p-8 text-center card-brand">
              <h3 className="font-bold text-xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>Deposit Option</h3>
              <div className="text-5xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.45 0.12 65)" }}>${PROGRAM.depositPrice}</div>
              <div className="text-sm mb-1" style={{ color: "oklch(0.55 0.02 160)" }}>today, then ${PROGRAM.balancePrice} before Session 1</div>
              <div className="text-xs mb-4 px-3 py-1 rounded-full inline-block" style={{ background: "oklch(0.93 0.03 10)", color: "oklch(0.45 0.09 10)" }}>Non-refundable deposit</div>
              <p className="text-sm mb-6" style={{ color: "oklch(0.45 0.02 160)" }}>Secure your spot now, pay balance before your first session.</p>
              <Link href="/enroll?plan=deposit" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm border-2 transition-all hover:shadow-md w-full justify-center" style={{ borderColor: "oklch(0.45 0.12 65)", color: "oklch(0.45 0.12 65)", background: "transparent" }}>
                Enroll — ${PROGRAM.depositPrice} Deposit <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <p className="text-center text-xs mt-4" style={{ color: "oklch(0.55 0.02 160)" }}>
            Not sure yet? <Link href="/book" className="underline font-semibold">Book a free discovery call first</Link> — no commitment required.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ background: "oklch(0.97 0.008 10)" }}>
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="badge-forest mb-3 inline-block">FAQ</span>
            <h2 className="font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "oklch(0.22 0.02 160)" }}>
              Common Questions
            </h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl p-6 card-brand">
                <h3 className="font-bold text-base mb-2" style={{ color: "oklch(0.22 0.02 160)" }}>{item.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.45 0.02 160)" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center" style={{ background: "oklch(0.38 0.10 148)" }}>
        <div className="container max-w-xl mx-auto">
          <h2 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", color: "oklch(0.97 0.008 10)" }}>
            Ready to Reclaim Your Life?
          </h2>
          <p className="text-base mb-8" style={{ color: "oklch(0.85 0.03 148)" }}>
            Limited spots available. Enroll today or book a free call to learn more.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/enroll" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
              Enroll Now <ArrowRight size={18} />
            </Link>
            <Link href="/book" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base border-2 transition-all hover:shadow-md" style={{ borderColor: "oklch(0.97 0.008 10)", color: "oklch(0.97 0.008 10)", background: "transparent" }}>
              Free Discovery Call
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
