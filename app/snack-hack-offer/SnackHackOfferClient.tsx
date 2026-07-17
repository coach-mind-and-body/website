"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BRAND } from "@shared/brand";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

const PDF_HREF = "/late-night-snack-hack.pdf";
const BOOK_HREF =
  "/book?utm_source=snack_hack&utm_medium=thank_you&utm_campaign=snack_hack_offer&utm_content=book_call";

export default function SnackHackOfferClient() {
  const { trackViewContent } = useMetaPixel();
  const ga = useGoogleAnalytics();

  useEffect(() => {
    trackViewContent({
      content_name: "Snack Hack Offer / Thank You",
      content_category: "Lead Generation",
      content_type: "product",
    });
    ga.trackViewContent({
      item_name: "Snack Hack Offer Thank You",
      item_category: "Lead Generation",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <main className="flex-1 flex flex-col items-center py-12 sm:py-16 px-4 sm:px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a96e]/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3a5a3a]/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-3xl mx-auto w-full text-center">
          <div className="flex justify-center mb-8">
            <img
              src="/logo-new.jpg"
              alt={BRAND.name}
              className="h-14 object-contain rounded-xl shadow-sm"
            />
          </div>

          <div className="inline-block px-4 py-1.5 rounded-full bg-[#f4f8f4] border border-[#c8dcc8] text-[#3a5a3a] text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm">
            Step 1 Complete
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-[#3a5a3a] mb-4 leading-tight">
            Your free guide is on its way!
          </h1>

          <p className="text-lg sm:text-xl text-gray-700 mb-8 leading-relaxed font-semibold">
            Check your inbox in a few minutes — and grab the PDF below if you want it right now.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-10">
            <a
              href={PDF_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-base sm:text-lg font-bold bg-[#c9a96e] hover:bg-[#b09055] text-white rounded-full transition-colors shadow-md"
            >
              Download the PDF Guide
            </a>
            <Link
              href={BOOK_HREF}
              className="inline-flex items-center justify-center px-8 py-4 text-base sm:text-lg font-bold bg-[#3a5a3a] hover:bg-[#2c452c] text-white rounded-full transition-colors shadow-md"
            >
              Book Your Free Discovery Call
            </Link>
          </div>

          <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-gray-100 relative text-left">
            <h2 className="text-2xl font-playfair font-bold text-[#3a5a3a] mb-5">
              A PDF can only get you so far.
            </h2>

            <p className="text-gray-700 mb-4 leading-relaxed text-base sm:text-lg">
              The <strong>Midlife Mindset Guide</strong> gives you real strategies to quiet evening food
              noise. But knowing <em>what</em> to do and actually doing it at 9:00 PM are two very
              different things.
            </p>

            <p className="text-gray-700 mb-5 leading-relaxed text-base sm:text-lg">
              If late-night snacking, emotional eating, or hormonal shifts have been a multi-year
              fight… you don&apos;t just need another PDF.{" "}
              <strong>You need someone in your corner.</strong>
            </p>

            <div className="bg-[#f9f5f0] border-l-4 border-[#c9a96e] p-5 sm:p-6 my-6 rounded-r-lg">
              <h3 className="text-lg sm:text-xl font-bold text-[#5a3e28] mb-2">
                Free 30-minute Discovery Call
              </h3>
              <p className="text-gray-700 mb-0 leading-relaxed">
                No pressure, no hard sell — just a real conversation about what&apos;s going on for you
                and whether 1-on-1 coaching is a fit.
              </p>
            </div>

            <div className="bg-[#f4f8f4] border-l-4 border-[#3a5a3a] p-5 sm:p-6 my-6 rounded-r-lg">
              <h3 className="text-lg sm:text-xl font-bold text-[#2c452c] mb-2">
                Bonus: free habit tracker
              </h3>
              <p className="text-gray-700 mb-0 leading-relaxed">
                Track daily wins in 30 seconds a day while you wait for your call (or while you try
                the guide tonight).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
              <Link
                href={BOOK_HREF}
                className="inline-flex items-center justify-center px-8 py-4 text-base sm:text-lg font-bold bg-[#3a5a3a] hover:bg-[#2c452c] text-white rounded-full transition-colors shadow-md text-center"
              >
                Book Your Free Call
              </Link>
              <Link
                href="/habit-tracker"
                className="inline-flex items-center justify-center px-8 py-4 text-base sm:text-lg font-bold bg-white border-2 border-[#3a5a3a] text-[#3a5a3a] hover:bg-gray-50 rounded-full transition-colors text-center"
              >
                Open The Habit Tracker
              </Link>
            </div>

            <p className="text-center text-sm text-gray-400 mt-8">
              Spots for discovery calls are limited each week.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
