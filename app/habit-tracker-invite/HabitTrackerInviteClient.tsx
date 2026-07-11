"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BRAND } from "@shared/brand";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import HabitTrackerInstallPrompt from "@/components/HabitTrackerInstallPrompt";

const TRACKER_HREF =
  "/habit-tracker?utm_source=meta&utm_medium=paid&utm_campaign=ht_invite&utm_content=open_app";
const OG_IMG = "/og-habit-tracker.jpg";
const LEEANNE_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp";

const PILLARS = [
  {
    name: "Dashboard",
    title: "Daily habits that stick",
    body: "Check off what matters each day — sleep, water, movement, mindset, or your own custom habits. See your week at a glance and build real momentum.",
    href: "/habit-tracker",
    points: ["One-tap daily check-ins", "Custom habits & numeric targets", "Streaks and weekly view"],
  },
  {
    name: "Macros",
    title: "Meals & macros — your way",
    body: "Log breakfast through snacks with calories, protein, carbs, fat, and fiber. Optional AI photo estimate helps when you don't want to hunt labels.",
    href: "/habit-tracker/calories",
    points: ["Meal-by-meal logging", "Full macro breakdown", "Snap a photo for AI estimates"],
  },
  {
    name: "Fitness",
    title: "Workouts & video library",
    body: "Log sets, reps, weight, and duration — or follow guided videos and mark workouts complete when you're signed in.",
    href: "/habit-tracker/fitness",
    points: ["Simple workout log", "Video library on-device", "Ties into your habit progress"],
  },
];

const WHY_US = [
  "Built for midlife women — not a bro-app clone",
  "Free to start — track on your device, no credit card",
  "Optional free account to sync across phones",
  "Challenges, reminders, and coach-friendly privacy options",
  "From the same team as the Snack Hack & R.E.C.L.A.I.M. coaching",
];

const FOR_YOU = [
  "You want structure without a rigid diet cult",
  "You're 40+ and tired of restarting every Monday",
  "You like tracking habits, food, or workouts — on your terms",
  "You want one simple place instead of three apps",
];

function CheckIcon({ className = "text-[#c9a96e]" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${className}`}
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
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#f4f8f4] text-[#3a5a3a] border border-[#c8dcc8]">
          Free · No account needed
        </span>
      </div>
      <h2 className="text-center font-playfair text-2xl sm:text-3xl font-bold text-[#3a5a3a] mb-2">
        Open your free tracker
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6 leading-relaxed">
        Habits, meals, and movement in one place. Tap below and start — no signup wall.
      </p>
      <Link
        href={TRACKER_HREF}
        className="flex w-full min-h-[52px] sm:min-h-[56px] items-center justify-center px-4 text-center text-base sm:text-lg font-bold bg-[#c9a96e] hover:bg-[#b09055] text-white rounded-full transition-colors shadow-md mb-4"
      >
        Start Free Tracker →
      </Link>
      {/* Home-screen icon is optional & hard on iPhone — never the main CTA */}
      <HabitTrackerInstallPrompt variant="button" />
      <p className="text-center text-[11px] text-gray-400 mt-4 leading-relaxed">
        Works in the browser. Home-screen icon is optional (and on iPhone takes a few Safari taps —
        Apple doesn&apos;t allow a one-button install).
      </p>
    </div>
  );
}

export default function HabitTrackerInviteClient() {
  const { trackViewContent } = useMetaPixel();
  const ga = useGoogleAnalytics();

  useEffect(() => {
    trackViewContent({
      content_name: "Habit Tracker Invite Landing",
      content_category: "Habit Tracker",
      content_type: "product",
    });
    ga.trackViewContent({
      item_name: "Habit Tracker Invite Landing",
      item_category: "Habit Tracker",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      {/* Mobile sticky CTA — open app only (no install / sign-in) */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <Link
          href={TRACKER_HREF}
          className="flex w-full min-h-[48px] items-center justify-center text-base font-bold bg-[#c9a96e] hover:bg-[#b09055] text-white rounded-full shadow-md"
        >
          Start Free Tracker →
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
                Free wellness tracker · Women 40+
              </div>
              <h1 className="text-[1.75rem] leading-tight sm:text-4xl md:text-5xl font-playfair font-bold text-[#3a5a3a] mb-4 sm:mb-5">
                One free app for{" "}
                <span className="text-[#c9a96e] italic">habits, meals & movement</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-3 leading-relaxed">
                Midlife health isn&apos;t one number on a scale. It&apos;s the small things you do
                most days — water, protein, a walk, a good night&apos;s sleep, logging the meal that
                actually satisfied you.
              </p>
              <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                The <strong>{BRAND.name} Habit Tracker</strong> puts daily habits, macro-friendly
                meal logging, and fitness in one calm place — free, simple, and built for real life.
              </p>

              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 mb-6 max-w-md mx-auto md:mx-0">
                <img
                  src={OG_IMG}
                  alt="Habit tracker dashboard preview"
                  className="w-full h-auto object-cover"
                  width={1200}
                  height={630}
                />
              </div>

              <p className="text-sm font-semibold text-[#3a5a3a] mb-3 uppercase tracking-wide">
                This is for you if…
              </p>
              <ul className="space-y-3 mb-8 text-left">
                {FOR_YOU.map((point) => (
                  <li key={point} className="flex items-start text-gray-700">
                    <CheckIcon />
                    <span className="text-sm sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>

              <p className="text-sm font-semibold text-[#3a5a3a] mb-3 uppercase tracking-wide">
                Why women use ours
              </p>
              <ul className="space-y-3 text-left mb-2">
                {WHY_US.map((point) => (
                  <li key={point} className="flex items-start text-gray-700">
                    <CheckIcon className="text-[#3a5a3a]" />
                    <span className="text-sm sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 md:order-2 md:sticky md:top-6">
              <CtaCard />
            </div>
          </div>

          {/* Three pillars */}
          <section className="mt-14 sm:mt-20">
            <h2 className="text-xl sm:text-2xl font-playfair font-bold text-[#3a5a3a] text-center mb-2">
              Everything in one tracker
            </h2>
            <p className="text-center text-sm text-gray-500 mb-8 max-w-xl mx-auto">
              Three tabs. Same free tool. Switch between Dashboard, Macros, and Fitness anytime.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {PILLARS.map((p) => (
                <div
                  key={p.name}
                  className="rounded-2xl bg-white border border-gray-100 p-5 sm:p-6 shadow-sm flex flex-col"
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-[#c9a96e] mb-2">
                    {p.name}
                  </span>
                  <h3 className="font-playfair text-xl font-bold text-[#3a5a3a] mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">{p.body}</p>
                  <ul className="space-y-2 mb-5">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start text-sm text-gray-700">
                        <span className="text-[#c9a96e] font-bold mr-2 shrink-0">✓</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`${p.href}?utm_source=meta&utm_medium=paid&utm_campaign=ht_invite&utm_content=${p.name.toLowerCase()}`}
                    className="text-sm font-bold text-[#3a5a3a] underline underline-offset-2 hover:text-[#c9a96e]"
                  >
                    Open {p.name} →
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Coach strip */}
          <section className="mt-14 sm:mt-16 max-w-3xl mx-auto rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8 p-5 sm:p-8">
              <img
                src={LEEANNE_IMG}
                alt={`${BRAND.coachFullName}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover object-top shadow-md shrink-0"
                width={112}
                height={112}
              />
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-[#c9a96e] mb-1">
                  From {BRAND.coachFullName}
                </p>
                <p className="font-playfair text-xl font-bold text-[#3a5a3a] mb-2">
                  Tracking that supports you — not shames you
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Use habits, food logging, or workouts as tools for awareness. Skip what doesn&apos;t
                  serve you. The tracker is free; coaching is available if you want a human in your
                  corner later.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-12 sm:mt-16 max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-playfair font-bold text-[#3a5a3a] text-center mb-6 sm:mb-8">
              Quick answers
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  q: "Is it really free?",
                  a: "Yes. Open the tracker and start. No credit card and no account required to try it.",
                },
                {
                  q: "Do I need an account?",
                  a: "No. Open the tracker and start. An account is optional later if you want the same data on more than one device.",
                },
                {
                  q: "Why isn't there an Install button on iPhone?",
                  a: "Apple doesn't let websites add a one-tap install. In Safari: Share → Add to Home Screen → Add. Or just use the tracker in the browser — install is optional.",
                },
                {
                  q: "Is this only calorie counting?",
                  a: "No. You can track habits only, use macros when helpful, log workouts, or mix all three. Optional AI photo estimates are there when you want them — not required.",
                },
                {
                  q: "Is this a diet program?",
                  a: "No. It's a free tracking tool from Mind & Body Reset. Coaching (like R.E.C.L.A.I.M.) is separate if you want 1-on-1 support later.",
                },
                {
                  q: "Will my coach see my data?",
                  a: "Only if you choose to share habits with your coach in settings. Privacy is yours to control.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl bg-white border border-gray-100 p-4 sm:p-6 shadow-sm"
                >
                  <h3 className="font-bold text-[#3a5a3a] mb-1.5 text-sm sm:text-base">{item.q}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="hidden md:block mt-14 max-w-md mx-auto">
            <CtaCard />
          </div>

          <p className="text-center text-xs text-gray-400 mt-10 sm:mt-12 pb-2">
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
