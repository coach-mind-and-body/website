"use client";

import { useEffect } from "react";
import { CheckCircle2, ShieldCheck, Calendar, Users, Clock, Loader2, Quote } from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { GOOGLE_CALENDAR } from "@shared/brand";
import { trpc } from "@/lib/trpc";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { EditableBlock } from "@/components/EditableBlock";
import { FPU_CONTENT } from "./FinancialPeaceContent";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";


// CDN photos
const PHOTO_LEEANNE_CHAIR =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6694_5487dc73.jpg";
const PHOTO_LEEANNE_TABLE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6598_af959cd9.webp";
const PHOTO_CONSULT_FORM =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6579_90834f37.jpg";
const PHOTO_COUCH =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6652_f211af63.webp";
const PHOTO_LEEANNE_VEGGIES =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/fpu-can-you-relate-LRquhXRPb6JDxJMEKYRtRh.webp";
const LEEANNE_PHOTO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp";

// ── FPU Group Sign-Up Form ───────────────────────────────────────────────────
function CoachingCheckoutButton({
  label = "Add 1:1 Coaching — $249 →",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const { trackInitiateCheckout } = useMetaPixel();
  const ga = useGoogleAnalytics();
  const checkoutMutation = trpc.fpu.createCoachingCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to secure checkout…");
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      toast.error("Something went wrong. Please try again.");
      console.error("[FPU Coaching Checkout]", err);
    },
  });

  const handleCheckout = () => {
    trackInitiateCheckout({
      content_name: "FPU 1:1 Coaching Sessions",
      content_category: "Coaching Program",
      value: 249,
      currency: "USD",
      num_items: 1,
    });
    ga.trackInitiateCheckout({
      items: [{ item_name: "FPU 1:1 Coaching Sessions", price: 249, currency: "USD" }],
      value: 249,
      currency: "USD"
    });
    checkoutMutation.mutate();
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={checkoutMutation.isPending}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      style={{ background: "oklch(0.72 0.11 78)", color: "oklch(0.20 0.015 50)" }}
    >
      {checkoutMutation.isPending ? "Loading…" : label}
    </button>
  );
}

// ── Shorthand helper ──────────────────────────────────────────────────────────
function E({ k, style }: { k: string; style?: React.CSSProperties }) {
  return (
    <EditableBlock
      contentKey={k}
      defaultContent={FPU_CONTENT[k] ?? ""}
      as="div"
      style={style}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FinancialPeace() {
  
  const isAdminEdit = new URLSearchParams(window.location.search).get("admin_edit") === "1";
  return (
    <EditModeProvider page="financial-peace">
      <FinancialPeaceContent hideNav={isAdminEdit} />
    </EditModeProvider>
  );
}

function FinancialPeaceContent({ hideNav = false }: { hideNav?: boolean }) {
  const { trackViewContent } = useMetaPixel();
  const ga = useGoogleAnalytics();

  useEffect(() => {
    // Fire ViewContent when visitor views the Financial Peace University page
    trackViewContent({ content_name: "Financial Peace University", content_category: "Financial Coaching", content_type: "product" });
    ga.trackViewContent({ item_name: "Financial Peace University", item_category: "Financial Coaching" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      {!hideNav && <SiteNav />}

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, oklch(0.22 0.05 148) 0%, oklch(0.38 0.09 148) 100%)",
          minHeight: "560px",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "oklch(0.72 0.11 78 / 0.12)" }}
        />
        <div
          className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: "oklch(0.72 0.09 145 / 0.10)" }}
        />

        <div className="container relative z-10 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left: copy */}
            <div>
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-6"
                style={{ background: "oklch(0.72 0.11 78)", color: "oklch(0.20 0.015 50)" }}
              >
                Dave Ramsey's Financial Peace University
              </span>
              <E
                k="hero-heading"
                style={{
                  color: "oklch(1 0 0)",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(2rem, 5vw, 3.4rem)",
                  fontWeight: "bold",
                  lineHeight: "1.2",
                  marginBottom: "20px",
                }}
              />
              <E
                k="hero-subheading"
                style={{
                  color: "oklch(0.92 0.015 148)",
                  maxWidth: "580px",
                  fontSize: "1.125rem",
                  marginBottom: "12px",
                }}
              />
              <div className="flex items-center gap-2 mb-8">
                <Calendar size={16} style={{ color: "oklch(0.72 0.11 78)" }} />
                <EditableBlock
                  contentKey="hero-cohort-date"
                  defaultContent={FPU_CONTENT["hero-cohort-date"]}
                  as="span"
                />
              </div>
              <div className="flex flex-col items-start gap-4">
                <a
                  href="https://www.financialpeace.com/app/classes/299D07"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all hover:opacity-80"
                  style={{
                    background: "transparent",
                    color: "oklch(0.72 0.09 145)",
                    border: "2px solid oklch(0.72 0.09 145)",
                  }}
                >
                  Sign Up for Class →
                </a>
              </div>
              <p className="text-sm mt-4" style={{ color: "oklch(0.75 0.015 148)" }}>
                FPU kits start at{" "}
                <strong style={{ color: "oklch(0.72 0.11 78)" }}>$99</strong> · <a href="#fpu-coaching" className="underline transition-colors hover:opacity-80" style={{ color: "oklch(0.72 0.11 78)" }}>Optional 1:1
                coaching add-on available</a>
              </p>
            </div>

            {/* Right: Lee Anne photo */}
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <img
                  src={PHOTO_LEEANNE_CHAIR}
                  alt="Lee Anne — Financial Peace Coordinator"
                  className="rounded-3xl object-cover w-full max-w-xs md:max-w-sm"
                  style={{
                    boxShadow: "0 20px 60px oklch(0.10 0.05 148 / 0.5)",
                    border: "4px solid oklch(1 0 0 / 0.15)",
                    objectPosition: "center 5%",
                    aspectRatio: "3/4",
                  }}
                  loading="eager"
                />
                {/* Floating badge */}
                <div
                  className="absolute -bottom-4 -left-4 rounded-2xl px-4 py-3 text-center"
                  style={{
                    background: "oklch(0.72 0.11 78)",
                    color: "oklch(0.20 0.015 50)",
                    boxShadow: "0 4px 20px oklch(0.10 0.05 148 / 0.4)",
                  }}
                >
                  <p className="font-bold text-sm">Starting at $99</p>
                  <p className="text-xs opacity-80">9-week program</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAN YOU RELATE ── */}
      <section className="py-20" style={{ background: "oklch(0.97 0.012 80)" }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
            {/* Left: pain points */}
            <div>
              <span className="badge-gold mb-3 inline-block">Can You Relate?</span>
              <E k="relate-heading" />
              <E k="relate-subtext" />
              <E k="relate-pain-points" />
              <E k="relate-quote" />
            </div>
            {/* Right: image */}
            <div className="hidden lg:flex items-start justify-center pt-8">
              <img
                src={PHOTO_LEEANNE_VEGGIES}
                alt="Lee Anne — warm and approachable"
                className="rounded-3xl object-cover w-full max-w-sm"
                style={{
                  boxShadow: "0 8px 40px oklch(0.20 0.015 50 / 0.12)",
                  border: "4px solid oklch(1 0 0)",
                }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── MY STORY ── */}
      <section className="py-20" style={{ background: "oklch(1 0 0)" }}>
        <div className="container max-w-5xl mx-auto">
          {/* Full-width image banner */}
          <div className="rounded-3xl overflow-hidden mb-12 relative" style={{ maxHeight: "380px" }}>
            <img
              src={PHOTO_LEEANNE_TABLE}
              alt="Lee Anne working with a client"
              className="w-full object-cover"
              style={{ maxHeight: "380px", objectPosition: "center 30%" }}
              loading="lazy"
            />
            <div
              className="absolute inset-0 flex items-end p-8"
              style={{
                background:
                  "linear-gradient(to top, oklch(0.20 0.015 50 / 0.75) 0%, transparent 60%)",
              }}
            >
              <p
                className="text-white font-bold text-xl max-w-lg"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)" }}
              >
                "The moment I stopped white-knuckling it alone — everything changed."
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <span className="badge-olive mb-3 inline-block">My Story</span>
            <E k="story-heading" />
            <E k="story-body" />
          </div>
        </div>
      </section>

      {/* ── MEET LEE ANNE ── */}
      <section className="py-20" style={{ background: "oklch(0.97 0.012 80)" }}>
        <div className="container max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
            {/* Photo */}
            <div className="md:col-span-2 flex justify-center">
              <img
                src={LEEANNE_PHOTO}
                alt="Lee Anne — Financial Peace Coordinator"
                className="rounded-3xl object-cover w-full max-w-xs"
                style={{
                  border: "4px solid oklch(1 0 0)",
                  boxShadow: "0 8px 40px oklch(0.20 0.015 50 / 0.12)",
                }}
                loading="lazy"
              />
            </div>
            {/* Bio */}
            <div className="md:col-span-3">
              <span className="badge-gold mb-3 inline-block">Your Coordinator</span>
              <E k="leeanne-heading" />
              <E k="leeanne-bio" />
              {/* Credential badges */}
              <div className="flex flex-wrap gap-2 mt-6">
                {[
                  "Certified Mindset Life Coach",
                  "Certified Health Coach",
                  "FPU Coordinator",
                ].map((c) => (
                  <span
                    key={c}
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: "oklch(0.95 0.03 148 / 0.5)",
                      color: "oklch(0.38 0.09 148)",
                      border: "1px solid oklch(0.72 0.09 145 / 0.3)",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU'LL LEARN ── */}
      <section className="py-20" style={{ background: "oklch(1 0 0)" }}>
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge-gold mb-3 inline-block">The Curriculum</span>
            <E k="curriculum-heading" />
            <E k="curriculum-subtext" />
          </div>
          <E k="curriculum-cards" />
        </div>
      </section>

      {/* ── COHORT DETAILS ── */}
      <section className="py-14 text-center" style={{ background: "oklch(0.38 0.09 148)" }}>
        <div className="container max-w-2xl mx-auto">
          <E
            k="cohort-heading"
            style={{
              color: "oklch(1 0 0)",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
              fontWeight: "bold",
              marginBottom: "32px",
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <Calendar size={24} />, label: "Starts", value: "May 12, 2026", sub: "Every Tuesday 6:30 PM to 7:15 PM" },
              { icon: <Clock size={24} />, label: "Duration", value: "9 Weeks", sub: "" },
              { icon: <Users size={24} />, label: "Format", value: "Live Group Sessions", sub: "" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl p-5 text-center"
                style={{
                  background: "oklch(1 0 0 / 0.10)",
                  border: "1px solid oklch(1 0 0 / 0.15)",
                }}
              >
                <div className="flex justify-center mb-2" style={{ color: "oklch(0.72 0.11 78)" }}>
                  {item.icon}
                </div>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: "oklch(0.75 0.015 148)" }}
                >
                  {item.label}
                </p>
                <p className="font-bold text-base" style={{ color: "oklch(1 0 0)" }}>
                  {item.value}
                </p>
                {item.sub && (
                  <p className="text-xs mt-1" style={{ color: "oklch(0.85 0.015 148)" }}>
                    {item.sub}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="py-20" style={{ background: "oklch(0.97 0.012 80)" }}>
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="hidden lg:block">
              <img
                src={PHOTO_COUCH}
                alt="Lee Anne with a client — warm and supportive"
                className="rounded-3xl object-cover w-full"
                style={{
                  boxShadow: "0 8px 40px oklch(0.20 0.015 50 / 0.10)",
                  border: "4px solid oklch(1 0 0)",
                  maxHeight: "500px",
                  objectFit: "cover",
                }}
                loading="lazy"
              />
            </div>
            {/* Content */}
            <div>
              <span className="badge-olive mb-3 inline-block">Is This For You?</span>
              <E k="for-you-heading" />
              <E k="for-you-list" />
              <a
                href="https://www.financialpeace.com/app/classes/299D07"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all bg-[#d4a017] text-[#1a2e1e] shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)]"
              >
                Sign Up for Class →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 1:1 COACHING ADD-ON ── */}
      <section id="fpu-coaching" className="py-20" style={{ background: "oklch(0.985 0.008 80)" }}>
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <span className="badge-gold mb-3 inline-block">Optional Add-On</span>
              <E k="coaching-heading" />
              <E k="coaching-intro" />
              <div
                className="rounded-3xl p-8 mb-6"
                style={{
                  background: "oklch(1 0 0)",
                  border: "2px solid oklch(0.72 0.11 78)",
                  boxShadow: "0 4px 24px oklch(0.20 0.015 50 / 0.08)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-1"
                      style={{ color: "oklch(0.52 0.015 50)" }}
                    >
                      1:1 Accountability Coaching
                    </p>
                    <p
                      className="font-bold"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "2.4rem",
                        color: "oklch(0.72 0.11 78)",
                        lineHeight: 1,
                      }}
                    >
                      $249
                    </p>
                    <p className="text-sm mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>
                      3 private sessions · 50 minutes each
                    </p>
                  </div>
                  <CoachingCheckoutButton label="Add Coaching — $249 →" />
                </div>
                <E k="coaching-features" />
              </div>
              <div
                className="rounded-2xl p-6 flex items-start gap-4"
                style={{
                  border: "1px solid oklch(0.72 0.09 145 / 0.40)",
                  background: "oklch(0.97 0.015 148 / 0.3)",
                }}
              >
                <ShieldCheck
                  size={28}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "oklch(0.38 0.09 148)" }}
                />
                <E k="coaching-guarantee" />
              </div>
            </div>

            {/* Coaching photo */}
            <div className="hidden lg:flex justify-center">
              <img
                src={PHOTO_CONSULT_FORM}
                alt="Client filling out a consult form"
                className="rounded-3xl object-cover w-full max-w-sm"
                style={{
                  boxShadow: "0 8px 40px oklch(0.20 0.015 50 / 0.12)",
                  border: "4px solid oklch(1 0 0)",
                  maxHeight: "480px",
                  objectFit: "cover",
                }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── OBJECTIONS / FAQ ── */}
      <section className="py-20" style={{ background: "oklch(0.97 0.012 80)" }}>
        <div className="container max-w-2xl mx-auto">
          <span className="badge-gold mb-3 inline-block">Your Questions, Answered</span>
          <E k="faq-heading" />
          <E k="faq-items" />
        </div>
      </section>

      {/* ── PRICING & SIGN-UP ── */}
      <section className="py-20" style={{ background: "oklch(1 0 0)" }}>
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge-gold mb-3 inline-block">Get Started</span>
            <h2
              className="font-bold mb-4"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
                color: "oklch(0.20 0.015 50)",
              }}
            >
              Two Simple Steps to Join
            </h2>
            <p className="text-base" style={{ color: "oklch(0.52 0.015 50)", maxWidth: "600px", margin: "0 auto" }}>
              Purchase your FPU kit from the Dave Ramsey Store, then sign up for my class using the link below.
            </p>
          </div>

          {/* Step 1: Buy Kit */}
          <div className="mb-10">
            <h3
              className="font-bold text-lg mb-6 text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
            >
              Step 1: Purchase Your Kit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* All Access */}
              <div
                className="relative rounded-2xl p-8 text-center"
                style={{
                  background: "oklch(0.97 0.012 80)",
                  border: "2px solid oklch(0.72 0.11 78)",
                  boxShadow: "0 4px 24px oklch(0.20 0.015 50 / 0.08)",
                }}
              >
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
                  style={{ background: "oklch(0.72 0.11 78)", color: "oklch(0.20 0.015 50)" }}
                >
                  Best Value
                </div>
                <p
                  className="font-bold mt-2"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "2.4rem",
                    color: "oklch(0.38 0.09 148)",
                    lineHeight: 1,
                  }}
                >
                  $129
                </p>
                <p className="font-bold text-base mt-2 mb-3" style={{ color: "oklch(0.20 0.015 50)" }}>
                  Financial Peace All Access
                </p>
                <ul className="text-sm text-left space-y-2 mb-6" style={{ color: "oklch(0.42 0.015 50)" }}>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.38 0.09 148)" }} />
                    12 months of Financial Peace University
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.38 0.09 148)" }} />
                    12 months of EveryDollar Premium
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.38 0.09 148)" }} />
                    Additional tools and resources
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.38 0.09 148)" }} />
                    Physical + digital workbook
                  </li>
                </ul>
                <a
                  href="https://www.ramseysolutions.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 w-full"
                  style={{ background: "oklch(0.72 0.11 78)", color: "oklch(0.20 0.015 50)" }}
                >
                  Buy on Dave Ramsey Store
                </a>
              </div>

              {/* Basic */}
              <div
                className="rounded-2xl p-8 text-center"
                style={{
                  background: "oklch(0.97 0.012 80)",
                  border: "2px solid oklch(0.88 0.015 75)",
                  boxShadow: "0 2px 12px oklch(0.20 0.015 50 / 0.05)",
                }}
              >
                <p
                  className="font-bold"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "2.4rem",
                    color: "oklch(0.38 0.09 148)",
                    lineHeight: 1,
                  }}
                >
                  $99
                </p>
                <p className="font-bold text-base mt-2 mb-3" style={{ color: "oklch(0.20 0.015 50)" }}>
                  FPU Basic
                </p>
                <ul className="text-sm text-left space-y-2 mb-6" style={{ color: "oklch(0.42 0.015 50)" }}>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.38 0.09 148)" }} />
                    12 months of Financial Peace University
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.38 0.09 148)" }} />
                    3 months of EveryDollar Premium
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.38 0.09 148)" }} />
                    Physical + digital workbook
                  </li>
                </ul>
                <a
                  href="https://www.ramseysolutions.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:shadow-md w-full border"
                  style={{ borderColor: "oklch(0.38 0.09 148)", color: "oklch(0.38 0.09 148)", background: "transparent" }}
                >
                  Buy on Dave Ramsey Store
                </a>
              </div>
            </div>
          </div>

          {/* Step 2: Sign Up for Class */}
          <div
            className="rounded-3xl p-8 md:p-10 text-center"
            style={{
              background: "oklch(0.38 0.09 148)",
              boxShadow: "0 8px 40px oklch(0.20 0.015 50 / 0.15)",
            }}
          >
            <h3
              className="font-bold text-lg mb-3"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(1 0 0)", fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)" }}
            >
              Step 2: Sign Up for My Class
            </h3>
            <p className="text-sm mb-6" style={{ color: "oklch(0.85 0.015 148)", maxWidth: "480px", margin: "0 auto 24px" }}>
              Once you have your kit, sign up for my class using the link below.
            </p>
            <a
              href="https://www.financialpeace.com/app/classes/299D07"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1"
              style={{ background: "oklch(0.72 0.11 78)", color: "oklch(0.20 0.015 50)" }}
            >
              Sign Up for Lee Anne's Class →
            </a>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section
        className="py-20 text-center"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.38 0.09 148) 0%, oklch(0.22 0.05 148) 100%)",
        }}
      >
        <div className="container max-w-xl mx-auto">
          {/* Pull quote */}
          <div className="mb-10 flex justify-center">
            <Quote size={36} style={{ color: "oklch(0.72 0.11 78)", opacity: 0.6 }} />
          </div>
          <E k="cta-heading" />
          <E k="cta-body" />
          <div className="flex flex-col items-center gap-4 mb-6">
            <a
              href="https://www.financialpeace.com/app/classes/299D07"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1"
              style={{ background: "oklch(0.72 0.11 78)", color: "oklch(0.20 0.015 50)" }}
            >
              Sign Up for Class →
            </a>
            <CoachingCheckoutButton label="Add 1:1 Coaching — $249" />
          </div>
          <p className="text-sm" style={{ color: "oklch(0.65 0.015 148)" }}>
            Questions?{" "}
            <a
              href={GOOGLE_CALENDAR.discoveryCall}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "oklch(0.72 0.09 145)" }}
            >
              Book a free call
            </a>{" "}
            — I'd love to chat.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
