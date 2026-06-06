import { useEffect, useRef } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { CheckCircle2, Calendar, Mail, ArrowRight } from "lucide-react";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { usePageTitle } from "@/hooks/usePageTitle";

const COACH_EMAIL = "coach@mindandbodyresetcoach.com";

const FPU_BOOKING_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0bkAzm-mKLEZx1FBdO_3E5FVC6wR8P1hQRNuFtZWPFT7lFtiWQC7tHupNtWlH0Wt0A_CqUuV71?gv=true";

export default function FinancialPeaceThankYou() {
  usePageTitle({
    title: "FPU Registration Confirmed | Mind and Body Reset",
    description: "Your Financial Peace University registration is confirmed. Get ready to take control of your finances with Lee Anne\'s group coaching.",
    keywords: "FPU registration, Financial Peace University confirmed, Dave Ramsey class"
  });
  const btnRef = useRef<HTMLSpanElement>(null);
  const ga = useGoogleAnalytics();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // We know they arrived here after a successful FPU coaching checkout ($249)
    ga.trackPurchase({
      transaction_id: "fpu_coaching_" + Date.now(),
      value: 249,
      currency: "USD",
      items: [{
        item_name: "FPU 1:1 Coaching Sessions",
        price: 249,
        currency: "USD"
      }]
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the Google Calendar scheduling button and attach it to our element
  useEffect(() => {
    if (!btnRef.current) return;

    const tryLoad = () => {
      // @ts-ignore — google calendar scheduling button global
      if (typeof window.calendar?.schedulingButton?.load === "function") {
        // @ts-ignore
        window.calendar.schedulingButton.load({
          url: FPU_BOOKING_URL,
          color: "#f8cfc4",
          label: "Book My First Session",
          target: btnRef.current,
        });
        return true;
      }
      return false;
    };

    // Try immediately (script may already be loaded)
    if (tryLoad()) return;

    // Otherwise poll until the script is ready (handles SPA navigation)
    const interval = setInterval(() => {
      if (tryLoad()) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      <SiteNav />

      <main className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.92 0.025 145)" }}
            >
              <CheckCircle2 size={40} style={{ color: "oklch(0.38 0.07 145)" }} />
            </div>
          </div>

          {/* Headline */}
          <h1
            className="font-bold mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "oklch(0.25 0.04 50)",
            }}
          >
            You're In! Welcome to FPU Coaching.
          </h1>

          <p
            className="text-lg mb-10 leading-relaxed"
            style={{ color: "oklch(0.4 0.03 55)", maxWidth: "520px", margin: "0 auto 2.5rem" }}
          >
            Your payment is confirmed. You've invested in 3 personal coaching sessions to make the most of Financial Peace University — and that decision is going to pay off.
          </p>

          {/* What Happens Next */}
          <div
            className="rounded-2xl p-8 mb-8 text-left"
            style={{
              background: "oklch(1 0.004 75)",
              border: "1px solid oklch(0.88 0.015 75)",
              boxShadow: "0 4px 24px oklch(0.18 0.025 50 / 0.07)",
            }}
          >
            <h2
              className="font-bold text-xl mb-6 text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.25 0.04 50)" }}
            >
              Here's What Happens Next
            </h2>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "oklch(0.92 0.03 80)", color: "oklch(0.55 0.08 80)" }}
                >
                  1
                </div>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: "oklch(0.25 0.04 50)" }}>
                    Book Your First Coaching Session
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.45 0.03 55)" }}>
                    Use the button below to pick a time that works for you. Sessions are 50 minutes and held via Google Meet.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "oklch(0.92 0.025 145)", color: "oklch(0.38 0.07 145)" }}
                >
                  2
                </div>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: "oklch(0.25 0.04 50)" }}>
                    Check Your Email for a Receipt
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.45 0.03 55)" }}>
                    Stripe will send a payment confirmation to the email you used at checkout. Keep it for your records.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "oklch(0.92 0.03 10)", color: "oklch(0.45 0.09 10)" }}
                >
                  3
                </div>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: "oklch(0.25 0.04 50)" }}>
                    After Each Session, Book the Next One
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.45 0.03 55)" }}>
                    You'll receive an email after each session with a link to schedule the next one. You have 3 sessions total — use them all!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Primary CTA — Google Calendar scheduling button (opens as popup) */}
          <div className="flex justify-center mb-4">
            {/* The Google Calendar script will replace this span with its button */}
            <span ref={btnRef} />
          </div>

          <p className="text-xs mb-10" style={{ color: "oklch(0.6 0.025 55)" }}>
            Pick any available time — sessions are 50 minutes via Google Meet
          </p>

          {/* Questions */}
          <div
            className="rounded-xl p-6"
            style={{
              background: "oklch(0.97 0.01 80)",
              border: "1px solid oklch(0.9 0.015 80)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail size={16} style={{ color: "oklch(0.55 0.08 80)" }} />
              <p className="font-bold text-sm" style={{ color: "oklch(0.25 0.04 50)" }}>
                Questions? I'm here.
              </p>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.45 0.03 55)" }}>
              Reach out anytime at{" "}
              <a
                href={`mailto:${COACH_EMAIL}`}
                className="font-semibold underline"
                style={{ color: "oklch(0.55 0.08 80)" }}
              >
                {COACH_EMAIL}
              </a>
              {" "}— I'm excited to work with you!
            </p>
          </div>

          {/* Back link */}
          <div className="mt-10">
            <Link
              href="/financial-peace"
              className="text-sm underline"
              style={{ color: "oklch(0.55 0.05 55)" }}
            >
              ← Back to Financial Peace University
            </Link>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
