"use client";

import { ArrowRight, Check } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Link from 'next/link';
;


const UNIMATE_IMG =
  "https://cosmic-assets.unicity.com/shop2/USA/configurable_product_images/61c339582f1941e08b1da35af1372998/Unimate_benefits__Lemon_Ginger_.webp";

const SHOP_URL = "https://ufeelgreat.com/c/mindbodyresetgals";

export default function FeelGreat() {
  
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.985 0.005 75)" }}>
      <SiteNav />

      {/* ── Hero ── */}
      <section className="py-20 md:py-28" style={{ background: "#ffffff", borderBottom: "1px solid oklch(0.92 0.01 160)" }}>
        <div className="container">
          <div className="flex flex-wrap items-center gap-12">
            {/* Text */}
            <div className="flex-1" style={{ minWidth: "320px" }}>
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
                style={{ background: "oklch(0.93 0.04 148)", color: "oklch(0.30 0.10 148)" }}
              >
                Unicity Feel Great System
              </span>
              <h1
                className="font-bold mb-6 leading-tight"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
                  color: "oklch(0.22 0.02 160)",
                }}
              >
                The Feel Great System
              </h1>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "oklch(0.40 0.02 160)", maxWidth: "500px" }}>
                Bridge the gap between where you are and where you want to be. Achieve the results of time-based eating without the struggle.
              </p>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1"
                style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
              >
                Shop the Feel Great Pack <ArrowRight size={18} />
              </a>
            </div>

            {/* Image */}
            <div className="flex-1" style={{ minWidth: "300px" }}>
              <img
                src={UNIMATE_IMG}
                alt="Unimate Feel Great System"
                className="w-full rounded-2xl shadow-2xl"
                style={{ maxHeight: "480px", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── The Gap ── */}
      <section className="py-20 text-center" style={{ background: "#fbeee9" }}>
        <div className="container">
          <h2
            className="font-bold mb-6"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              color: "oklch(0.22 0.02 160)",
            }}
          >
            Fasting is Powerful. It's also HARD.
          </h2>
          <p className="text-lg leading-relaxed mx-auto" style={{ maxWidth: "860px", color: "oklch(0.40 0.02 160)" }}>
            Intermittent fasting supports healthy blood pressure, heart health, and body composition. But most people quit because the hunger is overwhelming.{" "}
            <strong style={{ color: "oklch(0.22 0.02 160)" }}>The Feel Great System is the bridge.</strong>
          </p>
        </div>
      </section>

      {/* ── Product Cards ── */}
      <section className="py-20" style={{ background: "#ffffff" }}>
        <div className="container">
          <h2
            className="font-bold text-center mb-12"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              color: "oklch(0.22 0.02 160)",
            }}
          >
            Two Products. One Powerful System.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Unimate */}
            <div
              className="rounded-2xl p-10 shadow-sm"
              style={{ background: "oklch(0.985 0.005 75)", borderTop: "6px solid oklch(0.38 0.10 148)" }}
            >
              <h3
                className="font-bold mb-3 text-2xl"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
              >
                Unimate: Morning Focus
              </h3>
              <p className="text-base leading-relaxed mb-6" style={{ color: "oklch(0.40 0.02 160)" }}>
                Start your day with yerba mate to sharpen your mind and boost energy without breaking your fast.
              </p>
              <ul className="space-y-3">
                {[
                  "Promotes natural production of GLP-1.",
                  "Supports the body's natural ketone production.",
                  "Maintains endurance and stamina.",
                  "Supports metabolic health and mood.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base" style={{ color: "oklch(0.40 0.02 160)" }}>
                    <Check size={18} style={{ color: "oklch(0.38 0.10 148)", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Balance */}
            <div
              className="rounded-2xl p-10 shadow-sm"
              style={{ background: "oklch(0.985 0.005 75)", borderTop: "6px solid oklch(0.38 0.10 148)" }}
            >
              <h3
                className="font-bold mb-3 text-2xl"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
              >
                Balance: Mealtime Satiety
              </h3>
              <p className="text-base leading-relaxed mb-6" style={{ color: "oklch(0.40 0.02 160)" }}>
                Your pre-meal essential. Formulated to provide critical fiber and reduce carbohydrate impact on the body.
              </p>
              <ul className="space-y-3">
                {[
                  "Supports normal, healthy blood glucose levels.",
                  "Helps reduce carbohydrate absorption.",
                  "Curbs appetite between meals.",
                  "Strikes the right nutritional balance.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base" style={{ color: "oklch(0.40 0.02 160)" }}>
                    <Check size={18} style={{ color: "oklch(0.38 0.10 148)", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20" style={{ background: "oklch(0.985 0.005 75)" }}>
        <div className="container text-center">
          <h2
            className="font-bold mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              color: "oklch(0.22 0.02 160)",
            }}
          >
            Choose Your Path to Feeling Great
          </h2>
          <p className="text-base mb-12" style={{ color: "oklch(0.50 0.02 160)" }}>
            Both options include a 30-day supply of Unimate + Balance.
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {/* Featured: Subscription */}
            <div
              className="relative rounded-2xl p-10 text-left shadow-lg"
              style={{
                flex: "1",
                minWidth: "300px",
                maxWidth: "400px",
                background: "#ffffff",
                border: "2px solid oklch(0.38 0.10 148)",
                transform: "scale(1.03)",
              }}
            >
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full"
                style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
              >
                Best Value
              </div>
              <h3
                className="font-bold text-xl mb-2 mt-2"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
              >
                Monthly Subscription
              </h3>
              <p className="text-sm line-through mb-1" style={{ color: "oklch(0.65 0.02 160)" }}>
                Retail: $235.00
              </p>
              <p
                className="font-bold mb-6"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "3rem", color: "oklch(0.22 0.02 160)" }}
              >
                $159<span className="text-xl">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Save an extra $10 every month",
                  "Free Hand Mixer (First order)",
                  "Free Delivery",
                  "Cancel or Pause anytime",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.40 0.02 160)" }}>
                    <Check size={16} style={{ color: "oklch(0.38 0.10 148)", flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-4 rounded-xl font-bold transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
              >
                Subscribe & Save
              </a>
            </div>

            {/* One-Time */}
            <div
              className="rounded-2xl p-10 text-left shadow-sm"
              style={{
                flex: "1",
                minWidth: "300px",
                maxWidth: "400px",
                background: "#ffffff",
                border: "2px solid oklch(0.90 0.01 160)",
              }}
            >
              <h3
                className="font-bold text-xl mb-2 mt-2"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
              >
                One-Time Purchase
              </h3>
              <p className="text-sm line-through mb-1" style={{ color: "oklch(0.65 0.02 160)" }}>
                Retail: $235.00
              </p>
              <p
                className="font-bold mb-6"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "3rem", color: "oklch(0.22 0.02 160)" }}
              >
                $169
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Complete 30-Day Supply",
                  "Standard Delivery",
                  "Feel Great Money-Back Guarantee",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.40 0.02 160)" }}>
                    <Check size={16} style={{ color: "oklch(0.38 0.10 148)", flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-4 rounded-xl font-bold border transition-all hover:shadow-md"
                style={{ borderColor: "oklch(0.38 0.10 148)", color: "oklch(0.38 0.10 148)", background: "transparent" }}
              >
                Order Once
              </a>
            </div>
          </div>

          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1 mb-8"
            style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
          >
            Order Your Pack Now <ArrowRight size={18} />
          </a>

          <p className="text-base font-semibold mb-2" style={{ color: "oklch(0.22 0.02 160)" }}>
            Have questions about the flavors or the science?
          </p>
          <Link
            href="/book"
            className="text-base font-bold underline"
            style={{ color: "oklch(0.38 0.10 148)" }}
          >
            Book a Free Clarity Call with Lee Anne
          </Link>
        </div>
      </section>

      {/* ── Daily Practice ── */}
      <section className="py-20" style={{ background: "#fbeee9" }}>
        <div className="container">
          <h2
            className="font-bold text-center mb-12"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              color: "oklch(0.22 0.02 160)",
            }}
          >
            The Simple Daily Practice
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Morning Focus",
                body: "Drink Unimate to extend your fast and sharpen your mind.",
              },
              {
                step: "2",
                title: "Pre-Meal Balance",
                body: "Drink Balance 15 minutes before your largest meal.",
              },
              {
                step: "3",
                title: "Feel Great",
                body: "Enjoy the results of metabolic health without the hunger.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.6)" }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4"
                  style={{ background: "oklch(0.38 0.10 148)", color: "white", fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {s.step}
                </div>
                <h3
                  className="font-bold text-xl mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
                >
                  {s.title}
                </h3>
                <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Legal Disclaimer ── */}
      <div className="py-10 px-6 text-center text-sm" style={{ background: "oklch(0.92 0.01 160)", color: "oklch(0.50 0.02 160)" }}>
        <div className="mx-auto" style={{ maxWidth: "900px" }}>
          <p className="mb-3">
            *These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.
          </p>
          <p className="font-semibold" style={{ color: "oklch(0.35 0.02 160)" }}>
            The Feel Great Money-Back Guarantee: We stand behind our science. If you don't feel the difference, we've got you covered.
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
