import { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, ShieldCheck, Calendar, Users, Clock, Loader2, Quote } from "lucide-react";
import { toast } from "sonner";
import { BRAND, GOOGLE_CALENDAR } from "../../../shared/brand";
import { trpc } from "@/lib/trpc";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { EditableBlock } from "@/components/EditableBlock";
import { FPU_CONTENT } from "./FinancialPeaceContent";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { usePageTitle } from "@/hooks/usePageTitle";

// CDN photos
const PHOTO_LEEANNE_CHAIR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6694_5487dc73.jpg";
const PHOTO_LEEANNE_TABLE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6598_af959cd9.webp";
const PHOTO_CONSULT_FORM = "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6579_90834f37.jpg";
const PHOTO_COUCH = "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6652_f211af63.webp";
const PHOTO_LEEANNE_VEGGIES = "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/fpu-can-you-relate-LRquhXRPb6JDxJMEKYRtRh.webp";
const LEEANNE_PHOTO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp";

// ── Coaching checkout button ──────────────────────────────────────────────────
function CoachingCheckoutButton({ label = "Add 1:1 Coaching — $249 →", className = "" }: { label?: string; className?: string; }) {
  const { trackInitiateCheckout } = useMetaPixel();
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
    checkoutMutation.mutate();
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={checkoutMutation.isPending}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all bg-[#d4a017] text-[#1a2e1e] shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className}`}
    >
      {checkoutMutation.isPending ? "Loading…" : label}
    </button>
  );
}

// ── Shorthand helper ──────────────────────────────────────────────────────────
function E({ k, style, className }: { k: string; style?: React.CSSProperties; className?: string }) {
  return (
    <EditableBlock
      contentKey={k}
      defaultContent={FPU_CONTENT[k] ?? ""}
      as="div"
      style={style}
      className={className}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FPULandingPage() {
  usePageTitle({
    title: "Financial Peace University | Mind and Body Reset",
    description: "Join Lee Anne's Financial Peace University group — Dave Ramsey's proven plan for budgeting, eliminating debt, and building wealth. Next cohort starts soon.",
    keywords: "Financial Peace University, FPU, Dave Ramsey, budgeting class, debt elimination, financial wellness, money management, Utah FPU"
  });
  
  return (
    <EditModeProvider page="financial-peace">
      <FPULandingPageContent />
    </EditModeProvider>
  );
}

function FPULandingPageContent() {
  const { trackViewContent } = useMetaPixel();

  useEffect(() => {
    trackViewContent({ content_name: "Financial Peace University", content_category: "Financial Coaching", content_type: "product" });
  }, [trackViewContent]);

  return (
    <div className="min-h-screen bg-[#fffef9] text-[#2c3e28] font-sans">
      {/* SIMPLE LOGO HEADER */}
      <header className="py-6 px-6 border-b border-gray-100 flex justify-center bg-[#fffef9] sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <img src={BRAND.logoUrl} alt="Mind & Body Reset" className="w-10 h-10 rounded-full object-cover" />
          <span className="font-serif text-2xl text-[#1a2e1e] font-bold cursor-pointer">
            Mind & Body Reset
          </span>
        </Link>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a2e1e] to-[#2d6a4f] text-white py-16 md:py-24">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none bg-[#52b788]/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full pointer-events-none bg-[#d4a017]/10 blur-3xl" />

        <div className="container relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left: copy */}
            <div>
              <span className="inline-block bg-[#d4a017] text-[#1a2e1e] text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-6">
                Dave Ramsey's Financial Peace University
              </span>
              <E k="hero-heading" className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5" />
              <E k="hero-subheading" className="text-lg md:text-xl text-white/90 mb-6 max-w-xl" />
              
              <div className="flex items-center gap-2 mb-8 text-[#52b788] font-medium">
                <Calendar size={18} />
                <EditableBlock contentKey="hero-cohort-date" defaultContent={FPU_CONTENT["hero-cohort-date"]} as="span" />
              </div>
              
              <div className="flex flex-col items-start gap-4">
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all bg-[#d4a017] text-[#1a2e1e] shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)]"
                >
                  Join the Class →
                </a>
              </div>
              <p className="text-sm mt-4 text-white/60">
                FPU kits start at <strong className="text-[#52b788] font-bold">~$99</strong> · <a href="#fpu-coaching" className="underline hover:text-[#d4a017] transition-colors">Optional 1:1 coaching add-on available</a>
              </p>
            </div>

            {/* Right: Lee Anne photo */}
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <img
                  src={PHOTO_LEEANNE_CHAIR}
                  alt="Lee Anne — Financial Peace Coordinator"
                  className="rounded-3xl object-cover w-full max-w-xs md:max-w-sm border-4 border-white/10 shadow-2xl"
                  style={{ objectPosition: "center 5%", aspectRatio: "3/4" }}
                  loading="eager"
                />
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 rounded-2xl px-5 py-4 text-center bg-[#fdf8f0] text-[#1a2e1e] shadow-xl border border-gray-100">
                  <p className="font-bold text-sm">Starting at ~$99</p>
                  <p className="text-xs opacity-70">9-week program</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAN YOU RELATE ── */}
      <section className="py-20 bg-[#fdf8f0]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="inline-block bg-[#1a2e1e] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Can You Relate?</span>
              <E k="relate-heading" className="font-serif text-3xl md:text-4xl text-[#1a2e1e] font-bold mb-4" />
              <E k="relate-subtext" className="text-[#2c3e28] opacity-90 mb-6" />
              <div className="prose prose-[#2c3e28] max-w-none">
                <E k="relate-pain-points" />
              </div>
              <div className="mt-6 italic border-l-4 border-[#52b788] pl-4 py-1 font-serif text-lg text-[#1a2e1e]">
                <E k="relate-quote" />
              </div>
            </div>
            <div className="hidden lg:flex items-start justify-center pt-8">
              <img
                src={PHOTO_LEEANNE_VEGGIES}
                alt="Lee Anne — warm and approachable"
                className="rounded-3xl object-cover w-full max-w-sm border-4 border-white shadow-[0_8px_40px_rgba(26,46,30,0.12)]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── MY STORY ── */}
      <section className="py-20 bg-white">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Full-width image banner */}
          <div className="rounded-3xl overflow-hidden mb-12 relative h-[380px] shadow-xl">
            <img
              src={PHOTO_LEEANNE_TABLE}
              alt="Lee Anne working with a client"
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 30%" }}
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-end p-8 bg-gradient-to-t from-[#1a2e1e]/80 to-transparent">
              <p className="text-white font-bold font-serif text-2xl md:text-3xl max-w-2xl leading-tight">
                "The moment I stopped white-knuckling it alone — everything changed."
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <span className="inline-block bg-[#d4a017] text-[#1a2e1e] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">My Story</span>
            <E k="story-heading" className="font-serif text-3xl text-[#1a2e1e] font-bold mb-6" />
            <div className="prose prose-[#2c3e28] max-w-none">
              <E k="story-body" />
            </div>
          </div>
        </div>
      </section>

      {/* ── MEET LEE ANNE ── */}
      <section className="py-20 bg-[#fdf8f0]">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
            {/* Photo */}
            <div className="md:col-span-2 flex justify-center">
              <img
                src={LEEANNE_PHOTO}
                alt="Lee Anne — Financial Peace Coordinator"
                className="rounded-3xl object-cover w-full max-w-xs border-4 border-white shadow-[0_8px_40px_rgba(26,46,30,0.12)]"
                loading="lazy"
              />
            </div>
            {/* Bio */}
            <div className="md:col-span-3">
              <span className="inline-block bg-[#52b788] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Your Coordinator</span>
              <E k="leeanne-heading" className="font-serif text-3xl text-[#1a2e1e] font-bold mb-4" />
              <div className="prose prose-[#2c3e28] max-w-none mb-6">
                <E k="leeanne-bio" />
              </div>
              {/* Credential badges */}
              <div className="flex flex-wrap gap-2 mt-6">
                {["Certified Mindset Life Coach", "Certified Health Coach", "FPU Coordinator"].map((c) => (
                  <span key={c} className="text-xs font-bold px-3 py-1.5 rounded-full bg-white text-[#1a2e1e] border border-gray-200 shadow-sm">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU'LL LEARN / THE CURRICULUM ── */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#1a2e1e] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">The Curriculum</span>
            <E k="curriculum-heading" className="font-serif text-3xl md:text-4xl text-[#1a2e1e] font-bold mb-4" />
            <E k="curriculum-subtext" className="text-[#2c3e28] opacity-90 max-w-2xl mx-auto mb-8" />
            <div className="text-left prose prose-[#2c3e28] max-w-none">
              <E k="curriculum-cards" />
            </div>
          </div>
        </div>
      </section>

      {/* ── COHORT DETAILS ── */}
      <section className="py-14 bg-[#1a2e1e] text-white text-center">
        <div className="container max-w-3xl mx-auto px-4">
          <E k="cohort-heading" className="font-serif text-3xl md:text-4xl text-[#d4a017] font-bold mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <Calendar size={24} />, label: "Starts", value: "May 12, 2026", sub: "Every Tuesday 6:30 PM to 7:15 PM" },
              { icon: <Clock size={24} />, label: "Duration", value: "9 Weeks", sub: "Interactive coaching" },
              { icon: <Users size={24} />, label: "Format", value: "Live Group Sessions", sub: "Virtual meetings" },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                <div className="flex justify-center mb-3 text-[#52b788]">{item.icon}</div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-white/50">{item.label}</p>
                <p className="font-bold text-lg text-white">{item.value}</p>
                {item.sub && <p className="text-xs mt-1 text-white/70">{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="py-20 bg-[#fdf8f0]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="hidden lg:block">
              <img
                src={PHOTO_COUCH}
                alt="Lee Anne with a client — warm and supportive"
                className="rounded-3xl object-cover w-full border-4 border-white shadow-[0_8px_40px_rgba(26,46,30,0.10)] h-[500px]"
                loading="lazy"
              />
            </div>
            {/* Content */}
            <div>
              <span className="inline-block bg-[#d4a017] text-[#1a2e1e] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Is This For You?</span>
              <E k="for-you-heading" className="font-serif text-3xl text-[#1a2e1e] font-bold mb-6" />
              <div className="prose prose-[#2c3e28] max-w-none mb-8">
                <E k="for-you-list" />
              </div>
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
      <section id="fpu-coaching" className="py-20 bg-white">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <span className="inline-block bg-[#1a2e1e] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Optional Add-On</span>
              <E k="coaching-heading" className="font-serif text-3xl text-[#1a2e1e] font-bold mb-4" />
              <div className="prose prose-[#2c3e28] max-w-none mb-8">
                <E k="coaching-intro" />
              </div>
              
              <div className="bg-[#fdf8f0] rounded-3xl p-8 mb-6 border-2 border-[#52b788] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#52b788]/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6 relative z-10">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#52b788]">
                      1:1 Accountability Coaching
                    </p>
                    <p className="font-serif font-bold text-5xl text-[#1a2e1e] leading-none mb-2">
                      $249
                    </p>
                    <p className="text-sm text-[#2c3e28] opacity-80 font-medium">
                      3 private sessions · 50 minutes each
                    </p>
                  </div>
                  <CoachingCheckoutButton label="Add Coaching — $249 →" />
                </div>
                <div className="prose prose-sm prose-[#2c3e28] max-w-none relative z-10">
                  <E k="coaching-features" />
                </div>
              </div>

              <div className="bg-[#1a2e1e]/5 rounded-2xl p-6 flex items-start gap-4 border border-[#1a2e1e]/10">
                <ShieldCheck size={28} className="flex-shrink-0 mt-0.5 text-[#52b788]" />
                <div className="prose prose-sm prose-[#2c3e28]">
                  <E k="coaching-guarantee" />
                </div>
              </div>
            </div>

            {/* Coaching photo */}
            <div className="hidden lg:flex justify-center">
              <img
                src={PHOTO_CONSULT_FORM}
                alt="Client filling out a consult form"
                className="rounded-3xl object-cover w-full max-w-sm border-4 border-white shadow-[0_8px_40px_rgba(26,46,30,0.12)] h-[480px]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── OBJECTIONS / FAQ ── */}
      <section className="py-20 bg-[#fdf8f0]">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block bg-[#d4a017] text-[#1a2e1e] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Your Questions, Answered</span>
            <E k="faq-heading" className="font-serif text-3xl md:text-4xl text-[#1a2e1e] font-bold" />
          </div>
          <div className="prose prose-[#2c3e28] max-w-none">
            <E k="faq-items" />
          </div>
        </div>
      </section>

      {/* ── PRICING & SIGN-UP ── */}
      <section id="pricing" className="py-20 bg-[#1a2e1e] text-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#52b788] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Get Started</span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#d4a017] font-bold mb-4">
              Two Simple Steps to Join
            </h2>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Purchase your FPU kit from the Dave Ramsey Store, then sign up for my class using the link below.
            </p>
          </div>

          {/* Step 1: Buy Kit */}
          <div className="mb-12">
            <h3 className="font-serif text-2xl font-bold mb-6 text-center text-white">
              Step 1: Purchase Your Kit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* All Access */}
              <div className="relative bg-white/5 border-2 border-[#d4a017] rounded-3xl p-8 text-center backdrop-blur-sm shadow-xl">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#d4a017] text-[#1a2e1e]">
                  Best Value
                </div>
                <p className="font-serif font-bold text-5xl text-[#d4a017] leading-none mt-2 mb-3">
                  $129
                </p>
                <p className="font-bold text-lg mb-4 text-white">
                  Financial Peace All Access
                </p>
                <ul className="text-sm text-left space-y-3 mb-8 opacity-90">
                  {["12 months of Financial Peace University", "12 months of EveryDollar Premium", "Additional tools and resources", "Physical + digital workbook"].map(feature => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#52b788]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="https://www.ramseysolutions.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-sm transition-all bg-[#d4a017] text-[#1a2e1e] w-full hover:-translate-y-1 hover:shadow-lg"
                >
                  Buy on Dave Ramsey Store
                </a>
              </div>

              {/* Basic */}
              <div className="bg-white/5 border-2 border-white/10 rounded-3xl p-8 text-center backdrop-blur-sm">
                <p className="font-serif font-bold text-5xl text-white leading-none mb-3">
                  $99
                </p>
                <p className="font-bold text-lg mb-4 text-white/90">
                  FPU Basic
                </p>
                <ul className="text-sm text-left space-y-3 mb-8 opacity-80">
                  {["12 months of Financial Peace University", "3 months of EveryDollar Premium", "Physical + digital workbook"].map(feature => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#52b788]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="https://www.ramseysolutions.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-sm transition-all border border-[#d4a017] text-[#d4a017] hover:bg-[#d4a017]/10 w-full"
                >
                  Buy on Dave Ramsey Store
                </a>
              </div>
            </div>
          </div>

          {/* Step 2: Sign Up for Class */}
          <div className="bg-[#2d6a4f] rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[#1a2e1e]/20" />
            <div className="relative z-10">
              <h3 className="font-serif font-bold text-2xl md:text-3xl mb-4 text-white">
                Step 2: Sign Up for My Class
              </h3>
              <p className="text-lg mb-8 opacity-90 max-w-lg mx-auto">
                Once you have your kit, sign up for my class using the link below.
              </p>
              <a
                href="https://www.financialpeace.com/app/classes/299D07"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full font-bold text-lg transition-all bg-[#d4a017] text-[#1a2e1e] shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)]"
              >
                Sign Up for Lee Anne's Class →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="py-24 text-center bg-gradient-to-t from-[#1a2e1e] to-[#2d6a4f] text-white">
        <div className="container max-w-xl mx-auto px-4">
          <div className="mb-10 flex justify-center">
            <Quote size={40} className="text-[#d4a017] opacity-60" />
          </div>
          <E k="cta-heading" className="font-serif text-4xl font-bold mb-6" />
          <div className="prose prose-invert max-w-none mb-10 opacity-90">
            <E k="cta-body" />
          </div>
          <div className="flex flex-col items-center gap-5 mb-8">
            <a
              href="https://www.financialpeace.com/app/classes/299D07"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all bg-[#d4a017] text-[#1a2e1e] shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)] w-full sm:w-auto"
            >
              Sign Up for Class →
            </a>
            <CoachingCheckoutButton label="Add 1:1 Coaching — $249" className="w-full sm:w-auto" />
          </div>
          <p className="text-sm opacity-70">
            Questions?{" "}
            <a href={GOOGLE_CALENDAR.discoveryCall} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#d4a017] transition-colors">
              Book a free call
            </a>{" "}
            — I'd love to chat.
          </p>
        </div>
      </section>

      <footer className="bg-[#111] text-white/40 py-8 text-center text-xs">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Mind and Body Reset. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
