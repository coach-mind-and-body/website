"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BRAND, PROGRAM } from "@shared/brand";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

/** Ad-facing usual price (intro is PROGRAM.fullPrice = $597). */
const USUAL_PRICE = 999;

/** Stable coach portrait (same asset as /about — CloudFront). */
const LEEANNE_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp";
/** Midlife lifestyle image for visual warmth (R2 CDN). */
const LIFESTYLE_IMG =
  "https://cdn.mindandbodyresetcoach.com/blog-images/calming-food-noise-drop-the-food-courtroom.jpg";

const INCLUDED = [
  "6 private 50-minute coaching sessions with Lee Anne",
  "Personalized action plan after each session",
  "Mindset tools that quiet food noise — not another meal plan",
  "Midlife hormone + habit education for real life",
  "Email support between sessions",
];

const FOR_YOU_IF = [
  "You're done with diets and \"just try harder\"",
  "Night cravings or food noise still run the show",
  "You're 40+ and want coaching, not a meal plan PDF",
  "You're ready for accountability — not another free download",
];

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
      <main className="flex-1 py-10 md:py-16 px-4 sm:px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a96e]/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3a5a3a]/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-6xl mx-auto w-full">
          <div className="flex justify-center md:justify-start mb-8 md:mb-10">
            <img
              src="/logo-new.jpg"
              alt={BRAND.name}
              className="h-16 object-contain rounded-xl shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Copy */}
            <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left">
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#f4f8f4] border border-[#c8dcc8] text-[#3a5a3a] text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm">
                Private coaching · Women 40+
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-[#3a5a3a] mb-5 leading-tight">
                You already raised your hand.{" "}
                <span className="text-[#c9a96e] italic">Here’s the full path.</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-5 leading-relaxed">
                A free guide can interrupt one evening.{" "}
                <strong>R.E.C.L.A.I.M.</strong> is 6 weeks of 1-on-1 coaching to rewire the
                midlife patterns behind food noise, night cravings, and starting over every Monday.
              </p>
              <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                No meal plans. No food police. Real accountability with {BRAND.coachFullName}.
              </p>

              {/* Coach + lifestyle photos */}
              <div className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto md:mx-0">
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
                    alt="Calm midlife mindset and food peace"
                    className="w-full h-full object-cover"
                    width={400}
                    height={533}
                    loading="lazy"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-8 text-center md:text-left">
                <strong className="text-[#3a5a3a]">{BRAND.coachFullName}</strong> — your coach for R.E.C.L.A.I.M.
              </p>

              <p className="text-sm font-semibold text-[#3a5a3a] mb-3 uppercase tracking-wide">
                This is for you if…
              </p>
              <ul className="space-y-3 mb-8 text-left">
                {FOR_YOU_IF.map((point) => (
                  <li key={point} className="flex items-start text-gray-700">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-[#c9a96e] mr-3 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>

              <p className="text-sm font-semibold text-[#3a5a3a] mb-3 uppercase tracking-wide">
                What’s included
              </p>
              <ul className="space-y-3 text-left">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start text-gray-700">
                    <svg
                      className="w-5 h-5 text-[#3a5a3a] mr-3 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA card — snack-hack style “form” column */}
            <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 relative max-w-md mx-auto w-full md:sticky md:top-8">
              <div className="text-center mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#3a5a3a] mb-2">
                  Intro pricing
                </p>
                <div className="flex items-baseline justify-center gap-3 mb-1">
                  <span className="text-5xl font-playfair font-bold text-[#3a5a3a]">
                    ${PROGRAM.fullPrice}
                  </span>
                  <span className="text-lg text-gray-400 line-through">${USUAL_PRICE}</span>
                </div>
                <p className="text-sm text-gray-500">
                  Usually ${USUAL_PRICE} · or ${PROGRAM.depositPrice} deposit to start
                </p>
              </div>

              <div className="rounded-xl bg-[#f4f8f4] border border-[#c8dcc8] px-4 py-3 mb-6 text-center">
                <p className="text-sm text-[#3a5a3a] font-medium">
                  Recommended first: free 30-minute discovery call — no pressure, just fit.
                </p>
              </div>

              <Link
                href="/book?utm_source=meta&utm_medium=paid&utm_campaign=rt_reclaim&utm_content=invite_book"
                className="flex w-full h-12 sm:h-14 items-center justify-center text-base font-bold bg-[#c9a96e] hover:bg-[#b09055] text-white rounded-full transition-colors shadow-md mb-3"
              >
                Book Free Discovery Call
              </Link>
              <Link
                href="/enroll?utm_source=meta&utm_medium=paid&utm_campaign=rt_reclaim&utm_content=invite_enroll"
                className="flex w-full h-12 sm:h-14 items-center justify-center text-base font-bold border-2 border-[#3a5a3a] text-[#3a5a3a] hover:bg-[#f4f8f4] rounded-full transition-colors mb-6"
              >
                Enroll Now — ${PROGRAM.fullPrice}
              </Link>

              <p className="text-xs text-center text-gray-400 leading-relaxed">
                Prefer details first?{" "}
                <Link href="/reclaim" className="underline text-gray-500 hover:text-[#3a5a3a]">
                  Full program page
                </Link>
                . Same R.E.C.L.A.I.M. program — this page is the short path from the ad.
              </p>
            </div>
          </div>

          {/* Short FAQ */}
          <div className="mt-16 md:mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-playfair font-bold text-[#3a5a3a] text-center mb-8">
              Quick answers
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Is this a diet or meal plan?",
                  a: "No. R.E.C.L.A.I.M. is coaching — mindset, midlife patterns, and habits. We don’t hand you a menu or count your food.",
                },
                {
                  q: "I only downloaded the free guide. Is this for me?",
                  a: "If the guide helped a little but evenings still feel hard, this is the next step: private support so the change sticks.",
                },
                {
                  q: "What if I’m not sure?",
                  a: "Book the free discovery call. It’s 30 minutes to see if it’s a fit — no high-pressure pitch.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl bg-white border border-gray-100 p-5 sm:p-6 shadow-sm"
                >
                  <h3 className="font-bold text-[#3a5a3a] mb-2 text-sm sm:text-base">{item.q}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-12 pb-4">
            © {new Date().getFullYear()} {BRAND.name} ·{" "}
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
