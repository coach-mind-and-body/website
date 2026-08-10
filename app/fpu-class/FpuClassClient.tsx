"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BRAND } from "@shared/brand";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { generateMetaEventId, captureFbclidFromUrl } from "@/hooks/useMetaParams";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

/** Official class page: buy kit + join this cohort */
export const FPU_CLASS_URL = "https://www.financialpeace.com/app/classes/833B7A";

const LEEANNE_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp";

const PAIN = [
  "You’re tired of dreading the bank app",
  "Paycheck-to-paycheck feels like a permanent sentence",
  "Money fights (or silent tension) keep showing up at home",
  "You’ve tried “budgeting” and it never sticks",
  "You want a real plan — not more shame",
];

const YOU_GET = [
  "Dave Ramsey’s Financial Peace University curriculum",
  "Physical + digital workbook (with your kit)",
  "Lee Anne’s live virtual class — Tuesdays 6:30 PM MT",
  "Discussion, accountability, and real talk (not lecture-only)",
  "A coordinator who’s lived debt stress and found a way out",
];

const SCHEDULE = [
  { label: "Optional orientation", value: "Tuesday, Aug 25, 2026 · 6:30 PM MT" },
  { label: "First lesson", value: "Tuesday, Sep 1, 2026 · 6:30 PM MT" },
  { label: "Class nights", value: "Tuesdays · about 45–60 minutes" },
  { label: "Ends", value: "Tuesday, Oct 27, 2026" },
  { label: "Format", value: "Virtual — watch lessons on your own, meet for discussion" },
];

const FAQS = [
  {
    q: "How much does it cost?",
    a: "You purchase your FPU kit when you join the class page: $99 (FPU + workbook + access) or $129 All Access (extra tools + longer EveryDollar Premium). That same checkout enrolls you in Lee Anne’s cohort.",
  },
  {
    q: "Is the class free if I buy the kit?",
    a: "Yes — Lee Anne’s live group is included when you join through her class link. You’re not paying a separate “class fee” on top of the kit.",
  },
  {
    q: "What if I can’t make every Tuesday?",
    a: "Life happens. You’ll still have the curriculum and materials. Come when you can — consistency beats perfection.",
  },
  {
    q: "What if my spouse isn’t on board?",
    a: "Common. You don’t need perfect buy-in on day one. Many partners come around when they see calm and progress. We talk about money conversations in class.",
  },
  {
    q: "Is this only for people in deep debt?",
    a: "No. If money feels chaotic, stressful, or stuck — whether debt is huge or “we should be fine but we’re not” — you’re welcome.",
  },
];

function Check({ className = "text-[#d4a0a8]" }: { className?: string }) {
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

function PrimaryCta({
  label = "Buy Kit & Join My Class →",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const { trackInitiateCheckout } = useMetaPixel();
  const ga = useGoogleAnalytics();

  const onClick = () => {
    const eventId = generateMetaEventId();
    trackInitiateCheckout(
      {
        content_name: "FPU Class Fall 2026",
        content_category: "Financial Peace",
        content_type: "product",
        value: 99,
        currency: "USD",
        num_items: 1,
      },
      eventId
    );
    ga.trackEvent("begin_checkout", {
      item_name: "FPU Class Fall 2026",
      value: 99,
      currency: "USD",
    });
  };

  return (
    <a
      href={FPU_CLASS_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`flex w-full min-h-[52px] sm:min-h-[56px] items-center justify-center px-4 text-center text-base sm:text-lg font-bold bg-[#d4a0a8] hover:bg-[#c48a94] active:bg-[#b87a86] text-[#1a2e1e] rounded-full transition-colors shadow-md ${className}`}
    >
      {label}
    </a>
  );
}

function CtaCard() {
  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-[#f0d4c8] w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#fbeee9] text-[#8a5040] border border-[#f0d4c8]">
          Fall 2026 · Virtual
        </span>
      </div>

      <div className="text-center mb-5">
        <p className="text-sm font-semibold text-[#3a5a3a] mb-1">
          Financial Peace University
        </p>
        <p className="text-lg font-bold text-[#3a5a3a] leading-snug">
          Tuesdays · 6:30 PM MT
        </p>
        <p className="mt-2 text-sm text-gray-600 leading-snug">
          Orientation <strong>Aug 25</strong>
          <br />
          First lesson <strong>Sep 1</strong> · Ends <strong>Oct 27</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border-2 border-[#d4a0a8] bg-[#fdf0ee] p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a5a62] mb-0.5">
            Best value
          </p>
          <p className="text-2xl font-playfair font-bold text-[#3a5a3a]">$129</p>
          <p className="text-[11px] text-gray-600 mt-0.5 leading-tight">All Access</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-[#fdfbf7] p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-0.5">
            Standard
          </p>
          <p className="text-2xl font-playfair font-bold text-[#3a5a3a]">$99</p>
          <p className="text-[11px] text-gray-600 mt-0.5 leading-tight">FPU + workbook</p>
        </div>
      </div>

      <ul className="mb-5 space-y-1.5 text-left text-xs sm:text-sm text-gray-600 bg-[#fdfbf7] rounded-xl px-3 py-3 border border-[#f0d4c8]">
        {[
          "Workbook included (physical + digital)",
          "Join Lee Anne’s Tuesday class",
          "One link: buy kit + enroll",
        ].map((o) => (
          <li key={o} className="flex gap-2">
            <span className="text-[#d4a0a8] font-bold shrink-0">→</span>
            <span>{o}</span>
          </li>
        ))}
      </ul>

      <PrimaryCta />
      <p className="text-center text-xs text-gray-500 mt-3 leading-relaxed px-1">
        Opens Dave Ramsey’s secure class page for this cohort
      </p>

      <ul className="mt-5 space-y-2 text-xs sm:text-sm text-gray-500">
        {[
          "Led by Lee Anne Chapman · Sandy, UT",
          "I’ve been broke — I know the way out",
          "No shame · progress over perfection",
        ].map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span className="text-[#d4a0a8] font-bold shrink-0">✓</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FpuClassClient() {
  const { trackViewContent } = useMetaPixel();
  const ga = useGoogleAnalytics();

  useEffect(() => {
    captureFbclidFromUrl();
    const eventId = generateMetaEventId();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("meta_fpu_class_vc_id", eventId);
    }
    trackViewContent(
      {
        content_name: "FPU Class Fall 2026 Landing",
        content_category: "Financial Peace",
        content_type: "product",
        value: 99,
        currency: "USD",
      },
      eventId
    );
    ga.trackViewContent({
      item_name: "FPU Class Fall 2026 Landing",
      item_category: "Financial Peace",
      value: 99,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf0ee]">
      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-[#f0d4c8] bg-[#fdf8f6]/95 backdrop-blur-sm px-3 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(180,100,110,0.12)]">
        <PrimaryCta label="Join Class — From $99 →" className="min-h-[48px] text-sm" />
      </div>

      <main className="flex-1 pt-6 sm:pt-10 md:pt-14 pb-28 md:pb-16 px-4 sm:px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-[#e8b4b8]/35 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-[#f8d8d8]/50 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-6xl mx-auto w-full">
          <div className="flex justify-center md:justify-start mb-6 sm:mb-8">
            <img
              src="/logo-new.jpg"
              alt={BRAND.name}
              className="h-12 sm:h-16 object-contain rounded-xl shadow-sm"
            />
          </div>

          {/* Hero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start mb-16 md:mb-20">
            <div className="text-center md:text-left max-w-xl mx-auto md:mx-0">
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#fbeee9] border border-[#f0d4c8] text-[#8a5040] text-xs sm:text-sm font-semibold tracking-wide uppercase mb-5 shadow-sm">
                Dave Ramsey&apos;s FPU · Live with Lee Anne
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-[#3a5a3a] mb-5 leading-tight">
                Stop dreading your{" "}
                <span className="text-[#c47a7a] italic">bank account</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-4 leading-relaxed">
                Virtual <strong>Financial Peace University</strong> — Tuesdays at{" "}
                <strong>6:30 PM Mountain</strong>. I lead the class. You get the plan, the
                community, and a coach who&apos;s cried over a $10 lunch and found a way out.
              </p>
              <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
                Orientation <strong>Aug 25</strong> · First lesson <strong>Sep 1</strong> · Ends{" "}
                <strong>Oct 27, 2026</strong>
              </p>
              <ul className="space-y-3 mb-8 text-left">
                {[
                  "Kits from $99 — physical workbook included",
                  "Watch lessons on your own · meet for discussion",
                  "One link: buy your kit and join this cohort",
                ].map((point) => (
                  <li key={point} className="flex items-start text-gray-700">
                    <Check />
                    <span className="text-sm sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block max-w-md">
                <PrimaryCta />
                <p className="text-xs text-gray-500 mt-2 text-center md:text-left">
                  Secure enrollment on the official class page →
                </p>
              </div>
            </div>

            <div className="w-full">
              <CtaCard />
            </div>
          </div>

          {/* Pain */}
          <section className="mb-16 md:mb-20 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-[#3a5a3a] text-center mb-3">
              Be honest. Nobody&apos;s watching.
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              If any of these hit home, you&apos;re in the right place.
            </p>
            <ul className="space-y-3">
              {PAIN.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 bg-white/90 rounded-xl px-4 py-3.5 border border-[#f0d4c8] shadow-sm"
                >
                  <span className="text-[#d4a0a8] font-bold shrink-0">→</span>
                  <span className="text-gray-700 text-sm sm:text-base">{p}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Story */}
          <section className="mb-16 md:mb-20 grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
            <div className="order-2 md:order-1">
              <img
                src={LEEANNE_IMG}
                alt="Lee Anne Chapman — Financial Peace coordinator"
                className="rounded-2xl shadow-lg w-full max-w-md mx-auto object-cover object-top aspect-[4/5]"
              />
            </div>
            <div className="order-1 md:order-2 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-[#3a5a3a] mb-4">
                I looked for free food boxes. I know the way out.
              </h2>
              <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
                <p>
                  I&apos;m not going to pretend I&apos;ve always had it together. Crippling credit
                  card debt. Tension over lunch out. Telling my kids Christmas would be small.
                  Exhausted from pretending everything was fine.
                </p>
                <p>
                  <strong className="text-[#3a5a3a]">Financial Peace University</strong> gave me
                  the step-by-step roadmap. Mindset work helped it stick. Within months we paid
                  off our first debt, built a starter emergency fund, and I felt{" "}
                  <em>hope</em> when I opened the bank app.
                </p>
                <p>
                  That feeling? I want it for you. That&apos;s why I lead this class.
                </p>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="mb-16 md:mb-20 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-[#3a5a3a] text-center mb-8">
              Class schedule
            </h2>
            <div className="bg-white rounded-2xl border border-[#f0d4c8] shadow-sm overflow-hidden divide-y divide-[#fbeee9]">
              {SCHEDULE.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-5 py-4"
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-[#c47a7a]">
                    {row.label}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-[#3a5a3a] sm:text-right">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">
              Classes last about 45–60 minutes. We watch videos on our own and meet for discussion
              and activities.
            </p>
          </section>

          {/* What you get */}
          <section className="mb-16 md:mb-20 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-[#3a5a3a] text-center mb-8">
              What you walk away with
            </h2>
            <ul className="space-y-3">
              {YOU_GET.map((item) => (
                <li key={item} className="flex items-start text-gray-700">
                  <Check />
                  <span className="text-sm sm:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pricing mid-page CTA */}
          <section className="mb-16 md:mb-20 max-w-lg mx-auto">
            <CtaCard />
          </section>

          {/* FAQ */}
          <section className="mb-16 md:mb-20 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-[#3a5a3a] text-center mb-8">
              Real questions
            </h2>
            <div className="space-y-4">
              {FAQS.map((f) => (
                <div
                  key={f.q}
                  className="bg-white rounded-xl border border-[#f0d4c8] shadow-sm px-5 py-4"
                >
                  <h3 className="font-bold text-[#3a5a3a] text-sm sm:text-base mb-2">{f.q}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="max-w-xl mx-auto text-center pb-8">
            <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-[#3a5a3a] mb-3">
              This is your year for financial peace
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
              No perfection required. Just show up. I&apos;ll walk with you.
            </p>
            <PrimaryCta />
            <p className="text-xs text-gray-500 mt-4">
              Questions?{" "}
              <a
                href="mailto:coach@mindandbodyresetcoach.com"
                className="underline font-semibold text-[#3a5a3a]"
              >
                coach@mindandbodyresetcoach.com
              </a>
            </p>
            <p className="text-xs text-gray-400 mt-6">
              <Link href="/financial-peace" className="underline hover:text-gray-600">
                Full FPU overview
              </Link>
              {" · "}
              <Link href="/" className="underline hover:text-gray-600">
                Home
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
