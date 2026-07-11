"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BRAND, PROGRAM } from "@shared/brand";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

/** Full rate for value anchor. Intro price = PROGRAM.fullPrice ($597). */
const USUAL_PRICE = 999;
/** Intro cohort — first N enrollments at intro rate. */
const SPOTS = 10;
/**
 * Soft deadline for scarcity (honest window). Update when you open a new cohort.
 * Shown as “or by [date], whichever comes first.”
 */
const COHORT_WINDOW = "August 1, 2026";

const LEEANNE_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp";
const LIFESTYLE_IMG =
  "https://cdn.mindandbodyresetcoach.com/blog-images/calming-food-noise-drop-the-food-courtroom.jpg";

const BOOK_HREF =
  "/book?utm_source=meta&utm_medium=paid&utm_campaign=rt_reclaim&utm_content=invite_book";
const ENROLL_HREF =
  "/enroll?utm_source=meta&utm_medium=paid&utm_campaign=rt_reclaim&utm_content=invite_enroll";
const ENROLL_DEPOSIT_HREF =
  "/enroll?plan=deposit&utm_source=meta&utm_medium=paid&utm_campaign=rt_reclaim&utm_content=invite_deposit";

const RECLAIM_MECHANISM = [
  { letter: "R", word: "Reclaim", desc: "ownership of your body and story" },
  { letter: "E", word: "Empower", desc: "mindset tools that last" },
  { letter: "C", word: "Connect", desc: "to your body's real signals" },
  { letter: "L", word: "Live", desc: "instead of surviving the day" },
  { letter: "A", word: "Align", desc: "habits with your values" },
  { letter: "I", word: "Integrate", desc: "change into real life" },
  { letter: "M", word: "Maintain", desc: "results beyond the 6 weeks" },
];

const OUTCOMES = [
  "Quieter evenings — less 9pm food fight, more peace",
  "A clear plan for midlife cravings (not more willpower)",
  "Tools to interrupt \"start over Monday\" before it starts",
  "Someone in your corner for 6 weeks who knows this work",
];

const FOR_YOU_IF = [
  "You're done with diets and \"just try harder\"",
  "Night cravings or food noise still run the evenings",
  "You're 40+ and want a coach — not another free PDF",
  "You're ready for real accountability for 6 weeks",
];

const NOT_FOR_YOU = [
  "You want a meal plan, macros, or someone to police your plate",
  "You're looking for a free tip — not a private coaching commitment",
  "You're not willing to show up for yourself between sessions",
];

const INCLUDED = [
  "6 private 50-minute coaching sessions with Lee Anne",
  "A personalized plan after every session",
  "Tools to quiet food noise — not another meal plan",
  "Midlife hormone + habit education for real life",
  "Email support between sessions",
];

/** Real client reviews (also used on homepage). */
const TESTIMONIALS = [
  {
    initial: "C",
    name: "Chrissy O.",
    date: "Dec 2025",
    theme: "Obsessing over food",
    quote:
      "Lee Anne's coaching has changed the way I see myself, and food. I thought obsessing over the next meal was normal. Eating chocolate after every meal was just something I did. The thought of giving up sugar was too scary, so I just existed in the status quo of my busy life. Lee Anne showed me a different way that was do-able and I feel like I've come home to myself. Highly recommend!",
  },
  {
    initial: "N",
    name: "Nicole L.",
    date: "Jan 2026",
    theme: "Feeling like myself again",
    quote:
      "My old strategies for feeling my best were working less and less, and I felt frustrated before finding Lee Anne. Working with her has given me clarity around what was truly holding me back from my health goals. Each session leaves me with practical insights and a stronger ability to work with my mind and body. I feel more supported, informed, and like myself again.",
  },
  {
    initial: "S",
    name: "Sherylee",
    date: "Feb 2026",
    theme: "Ownership of my health",
    quote:
      "Lee Anne's coaching goes beyond typical health advice. She helps women step out of the quick-fix mindset and into a long term approach that supports your physical and mental health. You feel empowered to take ownership of your health in a way that lasts.",
  },
];

function CheckIcon({ className = "text-[#c9a96e]" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 sm:w-6 sm:h-6 mr-3 shrink-0 mt-0.5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CtaCard() {
  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#fbeee9] text-[#8a5040] border border-[#f0d4c8]">
          First {SPOTS} spots · intro rate
        </span>
      </div>

      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-[#3a5a3a] mb-1">
          R.E.C.L.A.I.M. · 6 weeks private coaching
        </p>
        <div className="flex items-baseline justify-center gap-2.5 flex-wrap">
          <span className="text-5xl sm:text-6xl font-playfair font-bold text-[#3a5a3a] leading-none">
            ${PROGRAM.fullPrice}
          </span>
          <span className="text-xl text-gray-400 line-through">${USUAL_PRICE}</span>
        </div>
        <p className="mt-2 text-sm text-gray-600 max-w-xs mx-auto leading-snug">
          Intro rate for the first {SPOTS} women who enroll — or until{" "}
          <strong className="text-[#3a5a3a]">{COHORT_WINDOW}</strong>, whichever comes first.
        </p>
        <p className="mt-1 text-xs text-gray-500">Then full rate returns to ${USUAL_PRICE}.</p>
      </div>

      {/* Outcome micro-stack near price */}
      <ul className="mb-5 space-y-1.5 text-left text-xs sm:text-sm text-gray-600 bg-[#fdfbf7] rounded-xl px-3 py-3 border border-[#f0e8e0]">
        {OUTCOMES.slice(0, 3).map((o) => (
          <li key={o} className="flex gap-2">
            <span className="text-[#c9a96e] font-bold shrink-0">→</span>
            <span>{o}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ENROLL_HREF}
        className="flex w-full min-h-[52px] sm:min-h-[56px] items-center justify-center px-4 text-center text-base sm:text-lg font-bold bg-[#c9a96e] hover:bg-[#b09055] active:bg-[#a08048] text-white rounded-full transition-colors shadow-md mb-2"
      >
        Yes — Lock My Intro Spot (${PROGRAM.fullPrice})
      </Link>
      <p className="text-center text-xs text-gray-500 mb-3 leading-relaxed px-1">
        Or hold your seat with ${PROGRAM.depositPrice} today — balance before session one.
      </p>
      <Link
        href={ENROLL_DEPOSIT_HREF}
        className="flex w-full min-h-[44px] items-center justify-center px-4 text-sm font-semibold text-[#3a5a3a] underline underline-offset-2 hover:text-[#c9a96e] mb-5"
      >
        Start with ${PROGRAM.depositPrice} deposit →
      </Link>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-center text-sm text-gray-600 mb-2">Not ready to enroll today?</p>
        <Link
          href={BOOK_HREF}
          className="flex w-full min-h-[48px] sm:min-h-[52px] items-center justify-center px-4 text-base font-bold border-2 border-[#3a5a3a] text-[#3a5a3a] hover:bg-[#f4f8f4] active:bg-[#eaf2ea] rounded-full transition-colors"
        >
          Book a Free Fit Call
        </Link>
        <p className="text-center text-xs text-gray-500 mt-2 leading-relaxed px-1">
          30 minutes. If it&apos;s not the right fit, Lee Anne will tell you — no pressure pitch.
        </p>
      </div>

      <ul className="mt-5 space-y-2 text-xs sm:text-sm text-gray-500">
        {[
          "1-on-1 with Lee Anne (not a group program)",
          "No meal plans or calorie counting",
          "Certified life & health coach · women 40+",
          `Only ${SPOTS} intro spots · secure checkout`,
        ].map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span className="text-[#c9a96e] font-bold shrink-0">✓</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReclaimInviteClient() {
  const { trackViewContent } = useMetaPixel();
  const ga = useGoogleAnalytics();

  useEffect(() => {
    trackViewContent({
      content_name: "R.E.C.L.A.I.M. Retargeting Invite",
      content_category: "Coaching",
      content_type: "product",
      value: PROGRAM.fullPrice,
      currency: "USD",
    });
    ga.trackViewContent({
      item_name: "R.E.C.L.A.I.M. Retargeting Invite",
      item_category: "Coaching",
      value: PROGRAM.fullPrice,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <Link
          href={ENROLL_HREF}
          className="flex w-full min-h-[48px] items-center justify-center text-sm sm:text-base font-bold bg-[#c9a96e] hover:bg-[#b09055] text-white rounded-full shadow-md px-3 text-center"
        >
          Lock Intro Spot — ${PROGRAM.fullPrice}
        </Link>
      </div>

      <main className="flex-1 pt-6 sm:pt-10 md:pt-14 pb-28 md:pb-16 px-4 sm:px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-[#c9a96e]/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-[#3a5a3a]/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-6xl mx-auto w-full">
          <div className="flex justify-center md:justify-start mb-6 sm:mb-8">
            <img
              src="/logo-new.jpg"
              alt={BRAND.name}
              className="h-12 sm:h-16 object-contain rounded-xl shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-14 items-start">
            <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left order-2 md:order-1">
              <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-[#f4f8f4] border border-[#c8dcc8] text-[#3a5a3a] text-xs sm:text-sm font-semibold tracking-wide uppercase mb-4 sm:mb-5 shadow-sm">
                Private coaching · Women 40+
              </div>

              <h1 className="text-[1.75rem] leading-tight sm:text-4xl md:text-5xl font-playfair font-bold text-[#3a5a3a] mb-4 sm:mb-5">
                Stop restarting every Monday.{" "}
                <span className="text-[#c9a96e] italic">Get a coach in your corner.</span>
              </h1>

              {/* 7. Emotional arc: pain → agitate → hope */}
              <p className="text-base sm:text-lg text-gray-700 mb-3 leading-relaxed">
                You already know the loop: good intentions by day, food noise by night, shame by
                morning — then another Monday promise.
              </p>
              <p className="text-base sm:text-lg text-gray-700 mb-3 leading-relaxed">
                It&apos;s not a character flaw. In midlife, hormones, stress, and old thought patterns
                team up. Another free PDF can interrupt one evening. It can&apos;t rewire the pattern.
              </p>
              <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                <strong>R.E.C.L.A.I.M.</strong> is 6 weeks of private coaching with{" "}
                {BRAND.coachFullName} — so you stop white-knuckling willpower and build a way of
                being with food and your body that actually lasts.
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3 max-w-md mx-auto md:mx-0">
                <div className="rounded-2xl overflow-hidden shadow-md aspect-[3/4] bg-gray-100">
                  <img
                    src={LEEANNE_IMG}
                    alt={`${BRAND.coachFullName}, certified life and health coach`}
                    className="w-full h-full object-cover object-top"
                    width={400}
                    height={533}
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md aspect-[3/4] bg-gray-100">
                  <img
                    src={LIFESTYLE_IMG}
                    alt="Peace with food and midlife body confidence"
                    className="w-full h-full object-cover"
                    width={400}
                    height={533}
                    loading="lazy"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2 text-center md:text-left">
                <strong className="text-[#3a5a3a]">{BRAND.coachFullName}</strong>
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-8 text-center md:text-left leading-relaxed">
                Certified Life Coach · Certified Health Coach · Specializing in women 40+
              </p>

              {/* 2. Outcomes */}
              <p className="text-sm font-semibold text-[#3a5a3a] mb-3 uppercase tracking-wide">
                What you&apos;re working toward
              </p>
              <ul className="space-y-3 mb-8 text-left">
                {OUTCOMES.map((point) => (
                  <li key={point} className="flex items-start text-gray-700">
                    <CheckIcon />
                    <span className="text-sm sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>

              {/* 8. Named mechanism */}
              <p className="text-sm font-semibold text-[#3a5a3a] mb-2 uppercase tracking-wide">
                The R.E.C.L.A.I.M. system
              </p>
              <p className="text-sm text-gray-600 mb-4 text-left leading-relaxed">
                Not random tips — a 7-part framework that rewires the{" "}
                <strong className="text-[#3a5a3a]">thought → habit → body</strong> loop:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 text-left">
                {RECLAIM_MECHANISM.map((item) => (
                  <div
                    key={item.letter}
                    className="flex items-start gap-2 rounded-lg bg-white/80 border border-gray-100 px-3 py-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f4f0e6] text-sm font-bold text-[#c9a96e] font-playfair">
                      {item.letter}
                    </span>
                    <span className="text-sm text-gray-700">
                      <strong className="text-[#3a5a3a]">{item.word}</strong>
                      <span className="text-gray-500"> — {item.desc}</span>
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-sm font-semibold text-[#3a5a3a] mb-3 uppercase tracking-wide">
                This is for you if…
              </p>
              <ul className="space-y-3 mb-8 text-left">
                {FOR_YOU_IF.map((point) => (
                  <li key={point} className="flex items-start text-gray-700">
                    <CheckIcon />
                    <span className="text-sm sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>

              {/* 3. Who it's NOT for */}
              <p className="text-sm font-semibold text-[#8a5040] mb-3 uppercase tracking-wide">
                This is not for you if…
              </p>
              <ul className="space-y-3 mb-8 text-left">
                {NOT_FOR_YOU.map((point) => (
                  <li key={point} className="flex items-start text-gray-600">
                    <span className="text-[#c47a6a] font-bold mr-3 shrink-0 mt-0.5">✕</span>
                    <span className="text-sm sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>

              <p className="text-sm font-semibold text-[#3a5a3a] mb-3 uppercase tracking-wide">
                What&apos;s included
              </p>
              <ul className="space-y-3 text-left mb-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start text-gray-700">
                    <CheckIcon className="text-[#3a5a3a]" />
                    <span className="text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 md:order-2 md:sticky md:top-6">
              <CtaCard />
            </div>
          </div>

          {/* 1. Social proof — real reviews */}
          <section className="mt-14 sm:mt-20 max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-playfair font-bold text-[#3a5a3a] text-center mb-2">
              What women just like you are saying
            </h2>
            <p className="text-center text-sm text-gray-500 mb-8">
              Real clients. Real words. Not stock quotes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="rounded-2xl bg-white border border-gray-100 p-5 sm:p-6 shadow-sm flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: "oklch(0.38 0.10 148)" }}
                    >
                      {t.initial}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#3a5a3a]">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.date}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a96e] mb-2">
                    {t.theme}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ / risk / scarcity rules */}
          <div className="mt-12 sm:mt-16 max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-playfair font-bold text-[#3a5a3a] text-center mb-6 sm:mb-8">
              Straight answers
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  q: `Is the $${PROGRAM.fullPrice} only for the first ${SPOTS}?`,
                  a: `Yes. Intro pricing of $${PROGRAM.fullPrice} is for the first ${SPOTS} women who enroll in this cohort, or until ${COHORT_WINDOW} — whichever comes first. After that, the full rate is $${USUAL_PRICE}.`,
                },
                {
                  q: "Is this a diet or meal plan?",
                  a: "No. R.E.C.L.A.I.M. is a coaching system — mindset, midlife patterns, and habits. No menus. No calorie counting. No food police.",
                },
                {
                  q: "I only got the free guide. Is this for me?",
                  a: "If the guide helped a little but nights still feel hard, yes. The guide is a spark. Private coaching is what keeps the change going for 6 weeks.",
                },
                {
                  q: "What if I'm not sure?",
                  a: "Book a free fit call. Lee Anne will be honest — if R.E.C.L.A.I.M. isn't right for you, she'll say so. No high-pressure pitch.",
                },
                {
                  q: "Can I split the payment?",
                  a: `Yes. Pay $${PROGRAM.fullPrice} in full, or hold your spot with a $${PROGRAM.depositPrice} deposit and pay the remaining $${PROGRAM.balancePrice} before your first session.`,
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl bg-white border border-gray-100 p-4 sm:p-6 shadow-sm"
                >
                  <h3 className="font-bold text-[#3a5a3a] mb-1.5 sm:mb-2 text-sm sm:text-base">
                    {item.q}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block mt-14 max-w-md mx-auto">
            <CtaCard />
          </div>

          <p className="text-center text-xs text-gray-400 mt-10 sm:mt-12 pb-2">
            © {new Date().getFullYear()} {BRAND.name}
          </p>
        </div>
      </main>
    </div>
  );
}
