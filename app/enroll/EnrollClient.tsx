"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Lock } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { PROGRAM, GOOGLE_CALENDAR } from "@shared/brand";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { getMetaParams, generateMetaEventId } from "@/hooks/useMetaParams";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

type Step = "choose" | "pay" | "schedule";

export default function Enroll() {
  const searchParams = useSearchParams();
  const planParam = searchParams?.get("plan");

  const [step, setStep] = useState<Step>(planParam === "full" || planParam === "deposit" ? "pay" : "choose");
  const [plan, setPlan] = useState<"full" | "deposit">(planParam === "deposit" ? "deposit" : "full");
  const [paymentDone, setPaymentDone] = useState(false);

  const { trackInitiateCheckout } = useMetaPixel();
  const ga = useGoogleAnalytics();

  // Check for Stripe success redirect
  useEffect(() => {
    if (searchParams?.get("success") === "1") {
      setPaymentDone(true);
      setStep("schedule");
      
      // We don't have the exact plan from URL, but we know they bought Reclaim
      ga.trackPurchase({
        transaction_id: "reclaim_" + Date.now(), // Generate a unique ID to prevent duplicate tracking
        value: 597, // Approximate or full value
        currency: "USD",
        items: [{
          item_name: "R.E.C.L.A.I.M. Program Checkout Success",
          price: 597,
          currency: "USD"
        }]
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCheckout = trpc.payment.createDepositCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to secure checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => toast.error(err.message || "Could not start checkout. Please try again."),
  });

  const handlePay = () => {
    trackInitiateCheckout({
      content_name: plan === "full" ? "R.E.C.L.A.I.M. Program - Full Payment" : "R.E.C.L.A.I.M. Program - Deposit",
      content_category: "Coaching Program",
      value: plan === "full" ? 597 : 200,
      currency: "USD",
      num_items: 1,
    });
    ga.trackInitiateCheckout({
      items: [{
        item_name: plan === "full" ? "R.E.C.L.A.I.M. Program - Full Payment" : "R.E.C.L.A.I.M. Program - Deposit",
        price: plan === "full" ? 597 : 200,
        currency: "USD",
      }],
      value: plan === "full" ? 597 : 200,
      currency: "USD"
    });
    const eventId = generateMetaEventId();
    const meta = getMetaParams();
    createCheckout.mutate({ plan, ...meta, eventId });
  };

  const selectPlan = (p: "full" | "deposit") => {
    setPlan(p);
    setStep("pay");
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      {/* Hero */}
      <section className="py-14 text-center" style={{ background: "oklch(0.22 0.02 160)" }}>
        <div className="container max-w-2xl mx-auto">
          <span className="badge-gold mb-4 inline-block">Enrollment</span>
          <h1 className="font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3rem)", color: "oklch(0.97 0.008 10)" }}>
            Join the {PROGRAM.fullName}
          </h1>
          <p className="text-base" style={{ color: "oklch(0.65 0.02 160)" }}>
            Secure your spot and take the first step toward reclaiming your mind and body.
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mt-8">
            {(["choose", "pay", "schedule"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                    background: step === s ? "oklch(0.72 0.12 75)" : (["choose", "pay", "schedule"].indexOf(step) > i ? "oklch(0.38 0.10 148)" : "oklch(0.42 0.02 160)"),
                    color: step === s ? "oklch(0.22 0.02 160)" : "white",
                  }}>
                    {["choose", "pay", "schedule"].indexOf(step) > i ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block" style={{ color: step === s ? "oklch(0.72 0.12 75)" : "oklch(0.60 0.02 160)" }}>
                    {s === "choose" ? "Choose Plan" : s === "pay" ? "Payment" : "Book Session 1"}
                  </span>
                </div>
                {i < 2 && <div className="w-8 h-px" style={{ background: "oklch(0.40 0.02 160)" }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-3xl mx-auto">

          {/* Step 1: Choose plan */}
          {step === "choose" && (
            <div>
              <h2 className="font-bold text-center mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "oklch(0.22 0.02 160)" }}>
                Choose Your Payment Option
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full payment */}
                <div className="rounded-2xl p-8 text-center relative overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1" style={{ background: "oklch(0.22 0.02 160)", border: "2px solid oklch(0.72 0.12 75)" }} onClick={() => selectPlan("full")}>
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>BEST VALUE</div>
                  <h3 className="font-bold text-xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Pay in Full</h3>
                  <div className="text-5xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.72 0.12 75)" }}>${PROGRAM.fullPrice}</div>
                  <div className="text-sm line-through mb-4" style={{ color: "oklch(0.55 0.02 160)" }}>${PROGRAM.originalPrice}</div>
                  <p className="text-sm mb-6" style={{ color: "oklch(0.65 0.02 160)" }}>One payment. Full access. Immediate enrollment.</p>
                  <button className="w-full py-3 rounded-full font-bold text-sm transition-all hover:shadow-lg" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
                    Select — Pay in Full <ArrowRight size={14} className="inline ml-1" />
                  </button>
                </div>
                {/* Deposit */}
                <div className="rounded-2xl p-8 text-center cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 card-brand" onClick={() => selectPlan("deposit")}>
                  <h3 className="font-bold text-xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>Deposit Option</h3>
                  <div className="text-5xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.45 0.12 65)" }}>${PROGRAM.depositPrice}</div>
                  <div className="text-sm mb-1" style={{ color: "oklch(0.55 0.02 160)" }}>today, then ${PROGRAM.balancePrice} before Session 1</div>
                  <div className="text-xs mb-4 px-3 py-1 rounded-full inline-block" style={{ background: "oklch(0.93 0.03 10)", color: "oklch(0.45 0.09 10)" }}>Non-refundable deposit</div>
                  <p className="text-sm mb-6" style={{ color: "oklch(0.45 0.02 160)" }}>Secure your spot now, pay balance before your first session.</p>
                  <button className="w-full py-3 rounded-full font-bold text-sm border-2 transition-all hover:shadow-md" style={{ borderColor: "oklch(0.45 0.12 65)", color: "oklch(0.45 0.12 65)", background: "transparent" }}>
                    Select — ${PROGRAM.depositPrice} Deposit <ArrowRight size={14} className="inline ml-1" />
                  </button>
                </div>
              </div>
              <p className="text-center text-xs mt-4" style={{ color: "oklch(0.55 0.02 160)" }}>
                Not ready? <Link href="/book" className="underline font-semibold">Book a free discovery call first</Link>.
              </p>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === "pay" && !paymentDone && (
            <div className="max-w-lg mx-auto">
              <button onClick={() => setStep("choose")} className="inline-flex items-center gap-1 text-xs font-bold mb-6" style={{ color: "oklch(0.38 0.10 148)" }}>
                â† Change Plan
              </button>
              <div className="card-brand rounded-2xl p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Lock size={16} style={{ color: "oklch(0.38 0.10 148)" }} />
                  <span className="text-sm font-bold" style={{ color: "oklch(0.38 0.10 148)" }}>Secure Checkout via Stripe</span>
                </div>
                <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>
                  {plan === "full" ? "Pay in Full" : "Pay Deposit"}
                </h2>
                <div className="flex items-center justify-between p-4 rounded-xl mb-6" style={{ background: "oklch(0.93 0.06 75)" }}>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "oklch(0.22 0.02 160)" }}>{PROGRAM.fullName}</p>
                    <p className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>
                      {plan === "deposit" ? `$${PROGRAM.depositPrice} deposit (non-refundable) + $${PROGRAM.balancePrice} balance before Session 1` : `Full program — ${PROGRAM.sessionCount} sessions × ${PROGRAM.sessionDurationMins} min`}
                    </p>
                  </div>
                  <span className="font-bold text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.45 0.12 65)" }}>
                    ${plan === "full" ? PROGRAM.fullPrice : PROGRAM.depositPrice}
                  </span>
                </div>
                <button
                  onClick={handlePay}
                  disabled={createCheckout.isPending}
                  className="w-full py-4 rounded-full font-bold text-base transition-all hover:shadow-xl disabled:opacity-60"
                  style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.97 0.008 10)" }}
                >
                  {createCheckout.isPending ? "Opening Checkout..." : `Pay $${plan === "full" ? PROGRAM.fullPrice : PROGRAM.depositPrice} Securely →`}
                </button>
                <p className="text-xs text-center mt-3" style={{ color: "oklch(0.60 0.02 160)" }}>
                  You'll be redirected to Stripe's secure checkout. After payment, return here to book Session 1.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Schedule Session 1 */}
          {(step === "schedule" || paymentDone) && (
            <div>
              {paymentDone && (
                <div className="flex items-center gap-3 p-4 rounded-xl mb-8 max-w-lg mx-auto" style={{ background: "oklch(0.92 0.04 148)", border: "1px solid oklch(0.38 0.10 148)" }}>
                  <CheckCircle2 size={20} style={{ color: "oklch(0.38 0.10 148)" }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: "oklch(0.22 0.02 160)" }}>Payment Confirmed!</p>
                    <p className="text-xs" style={{ color: "oklch(0.45 0.02 160)" }}>Welcome to R.E.C.L.A.I.M. Now let's book your first session.</p>
                  </div>
                </div>
              )}
              <h2 className="font-bold text-center mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "oklch(0.22 0.02 160)" }}>
                Book Your First Session
              </h2>
              <p className="text-center text-sm mb-8" style={{ color: "oklch(0.55 0.02 160)" }}>
                Select a date and time for Session 1 of your 6-Week R.E.C.L.A.I.M. program.
              </p>
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: "1px solid oklch(0.90 0.01 160)" }}>
                <div className="flex items-center gap-2 px-5 py-3" style={{ background: "oklch(0.22 0.02 160)" }}>
                  <span className="text-sm font-bold" style={{ color: "oklch(0.72 0.12 75)" }}>R.E.C.L.A.I.M. Session 1 — 50 Minutes</span>
                </div>
                <iframe
                  src={GOOGLE_CALENDAR.reclaimSession}
                  style={{ border: 0, display: "block" }}
                  width="100%"
                  height="600"
                  frameBorder="0"
                  title="Book R.E.C.L.A.I.M. Session 1"
                />
              </div>
              <p className="text-center text-xs mt-4" style={{ color: "oklch(0.55 0.02 160)" }}>
                After booking, you'll receive a Google Calendar confirmation with a Google Meet link.
              </p>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

