"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BRAND, PROGRAM } from "@shared/brand";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

/** Full rate for value anchor. Intro price = PROGRAM.fullPrice ($597). */
const USUAL_PRICE = 999;
/** Founding / intro cohort size — keep honest. */
const SPOTS = 10;

const LEEANNE_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp";
const LIFESTYLE_IMG =
  "https://cdn.mindandbodyresetcoach.com/blog-images/calming-food-noise-drop-the-food-courtroom.jpg";

const BOOK_HREF =
  "/book?utm_source=meta&utm_medium=paid&utm_campaign=rt_reclaim&utm_content=invite_book";
const ENROLL_HREF =
  "/enroll?utm_source=meta&utm_medium=paid&utm_campaign=rt_reclaim&utm_content=invite_enroll";

const INCLUDED = [
  "6 private 50-minute coaching sessions with Lee Anne",
  "A personalized plan after every session",
  "Tools to quiet food noise — not another meal plan",
  "Midlife hormone + habit education for real life",
  "Email support between sessions",
];

const FOR_YOU_IF = [
  "You're done with diets and \"just try harder\"",
  "Night cravings or food noise still run the evenings",
  "You're 40+ and want a coach — not another free PDF",
  "You're ready for real accountability for 6 weeks",
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
      {/* Scarcity */}
      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#fbeee9] text-[#8a5040] border border-[#f0d4c8]">
          Only {SPOTS} spots at this intro rate
        </span>
      </div>

      {/* One clear price story */}
      <div className="text-center mb-5">
        <p className="text-sm font-semibold text-[#3a5a3a] mb-1">R.E.C.L.A.I.M. · 6 weeks private coaching</p>
        <div className="flex items-baseline justify-center gap-2.5 flex-wrap">
          <span className="text-5xl sm:text-6xl font-playfair font-bold text-[#3a5a3a] leading-none">
            ${PROGRAM.fullPrice}
          </span>
          <span className="text-xl text-gray-400 line-through">${USUAL_PRICE}</span>
        </div>
        <p className="mt-2 text-sm text-gray-600 max-w-xs mx-auto leading-snug">
          Intro rate for the first {SPOTS} women in this cohort.
          <br />
          <span className="text-gray-500">Full rate is ${USUAL_PRICE}.</span>
        </p>
      </div>

      {/* Primary path = lowest friction */}
      <p className="text-center text-sm font-semibold text-[#3a5a3a] mb-2">
        Not sure yet? Start here (free)
      </p>
      <Link
        href={BOOK_HREF}
        className="flex w-full min-h-[52px] sm:min-h-[56px] items-center justify-center px-4 text-base sm:text-lg font-bold bg-[#c9a96e] hover:bg-[#b09055] active:bg-[#a08048] text-white rounded-full transition-colors shadow-md mb-2"
      >
        Book My Free 30-Min Call
      </Link>
      <p className="text-center text-xs text-gray-500 mb-5 leading-relaxed px-1">
        No pressure. We&apos;ll see if it&apos;s a fit — then you decide.
      </p>

      {/* Secondary = ready buyers */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-center text-sm text-gray-600 mb-2">Already know you want in?</p>
        <Link
          href={ENROLL_HREF}
          className="flex w-full min-h-[48px] sm:min-h-[52px] items-center justify-center px-4 text-base font-bold border-2 border-[#3a5a3a] text-[#3a5a3a] hover:bg-[#f4f8f4] active:bg-[#eaf2ea] rounded-full transition-colors"
        >
          Enroll Now — ${PROGRAM.fullPrice}
        </Link>
      </div>

      <ul className="mt-5 space-y-2 text-xs sm:text-sm text-gray-500">
        {[
          "1-on-1 with Lee Anne (not a group program)",
          "No meal plans or calorie counting",
          "Secure checkout · spots are limited",
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
      {/* Mobile sticky CTA — high conversion, thumb-friendly */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <Link
          href={BOOK_HREF}
          className="flex w-full min-h-[48px] items-center justify-center text-base font-bold bg-[#c9a96e] hover:bg-[#b09055] text-white rounded-full shadow-md"
        >
          Book Free Call — See If It&apos;s a Fit
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

          {/* Mobile: offer card first (order). Desktop: copy | card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-14 items-start">
            {/* Copy column */}
            <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left order-2 md:order-1">
              <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-[#f4f8f4] border border-[#c8dcc8] text-[#3a5a3a] text-xs sm:text-sm font-semibold tracking-wide uppercase mb-4 sm:mb-5 shadow-sm">
                Private coaching · Women 40+
              </div>
              <h1 className="text-[1.75rem] leading-tight sm:text-4xl md:text-5xl font-playfair font-bold text-[#3a5a3a] mb-4 sm:mb-5">
                Stop restarting every Monday.{" "}
                <span className="text-[#c9a96e] italic">Get a coach in your corner.</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-3 sm:mb-4 leading-relaxed">
                You already took a step (the free guide). A PDF can help for one night.{" "}
                <strong>R.E.C.L.A.I.M.</strong> is 6 weeks of 1-on-1 coaching to rewire the midlife
                patterns behind food noise, night cravings, and feeling stuck in your body.
              </p>
              <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                No meal plans. No food police. Real accountability with {BRAND.coachFullName}.
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3 max-w-md mx-auto md:mx-0">
                <div className="rounded-2xl overflow-hidden shadow-md aspect-[3/4] bg-gray-100">
                  <img
                    src={LEEANNE_IMG}
                    alt={`${BRAND.coachFullName}, midlife health coach`}
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
              <p className="text-sm text-gray-500 mb-8 text-center md:text-left">
                <strong className="text-[#3a5a3a]">{BRAND.coachFullName}</strong> — your R.E.C.L.A.I.M.
                coach
              </p>

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

              <p className="text-sm font-semibold text-[#3a5a3a] mb-3 uppercase tracking-wide">
                What you get
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

            {/* CTA — first on mobile for conversions */}
            <div className="order-1 md:order-2 md:sticky md:top-6">
              <CtaCard />
            </div>
          </div>

          {/* Objection killers */}
          <div className="mt-12 sm:mt-16 md:mt-20 max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-playfair font-bold text-[#3a5a3a] text-center mb-6 sm:mb-8">
              Straight answers
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  q: "Is the $597 only for the first 10?",
                  a: `Yes. The intro rate of $${PROGRAM.fullPrice} is for the first ${SPOTS} women who enroll in this cohort. After that, the program returns to the full rate of $${USUAL_PRICE}.`,
                },
                {
                  q: "Is this a diet or meal plan?",
                  a: "No. R.E.C.L.A.I.M. is coaching — mindset, midlife patterns, and habits. No menus. No calorie counting. No food police.",
                },
                {
                  q: "I only got the free guide. Is this for me?",
                  a: "If the guide helped a little but nights still feel hard, yes. The guide is a spark. Coaching is what keeps the change going.",
                },
                {
                  q: "What if I'm not ready to pay today?",
                  a: "Book the free 30-minute call. No pitch pressure — just an honest conversation about your goals and whether R.E.C.L.A.I.M. is right. You decide after.",
                },
                {
                  q: "Can I split the payment?",
                  a: `Yes — after you enroll you can pay in full ($${PROGRAM.fullPrice}) or start with a $${PROGRAM.depositPrice} deposit and pay the rest before session one. The free call can walk you through it.`,
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

          {/* Bottom CTA repeat (desktop; mobile has sticky bar) */}
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
