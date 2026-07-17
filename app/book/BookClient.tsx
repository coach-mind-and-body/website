"use client";

import { CheckCircle2, Calendar } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { GOOGLE_CALENDAR } from "@shared/brand";

/**
 * Discovery call booking is calendar-only.
 * Google Appointment Schedule collects name + email (required for Meet).
 * Our calendar sync pulls that guest into the `leads` CRM and merges with any
 * existing snack-hack / quiz journey for the same email in Admin → Contacts.
 */
export default function Book() {
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      <section
        className="py-12 sm:py-16 text-center"
        style={{
          background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.97 0.008 10) 60%)",
        }}
      >
        <div className="container max-w-2xl mx-auto">
          <span className="badge-gold mb-4 inline-block">Free · 30 Minutes · No Commitment</span>
          <h1
            className="font-bold mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)",
              color: "oklch(0.22 0.02 160)",
            }}
          >
            Book Your Free Discovery Call
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ color: "oklch(0.45 0.02 160)", maxWidth: "480px", margin: "0 auto" }}
          >
            Pick a time that works for you. Google will ask for your name and email so we can send
            the Meet link. In this free 30-minute call, you&apos;ll learn a new way women just like
            you are losing the weight and keeping it off — and whether R.E.C.L.A.I.M. is right for
            you.
          </p>
        </div>
      </section>

      <section className="pb-16 pt-4">
        <div className="container max-w-4xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden shadow-lg mb-10"
            style={{ border: "1px solid oklch(0.90 0.01 160)" }}
          >
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{ background: "oklch(0.38 0.10 148)" }}
            >
              <Calendar size={16} style={{ color: "white" }} />
              <span className="text-sm font-bold" style={{ color: "white" }}>
                Select a Date &amp; Time
              </span>
            </div>
            <iframe
              src={GOOGLE_CALENDAR.discoveryCall}
              style={{ border: 0, display: "block" }}
              width="100%"
              height="700"
              frameBorder="0"
              title="Book a Free Discovery Call with Lee Anne"
            />
          </div>

          <div className="max-w-xl mx-auto space-y-3">
            <h2
              className="font-bold text-xl mb-2 text-center"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "oklch(0.22 0.02 160)",
              }}
            >
              What to expect
            </h2>
            {[
              "No sales pressure — just a real conversation",
              "Learn what's actually keeping you stuck",
              "Find out if R.E.C.L.A.I.M. is right for you",
              "Walk away with at least one actionable insight",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 justify-center sm:justify-start">
                <CheckCircle2
                  size={14}
                  style={{ color: "oklch(0.38 0.10 148)", flexShrink: 0, marginTop: 2 }}
                />
                <span className="text-sm" style={{ color: "oklch(0.45 0.02 160)" }}>
                  {item}
                </span>
              </div>
            ))}
            <p
              className="text-xs pt-4 text-center leading-relaxed"
              style={{ color: "oklch(0.55 0.02 160)" }}
            >
              After you book, Google emails you a confirmation with the Google Meet link. Your name
              and email are pulled into our admin so we can connect it to any free guide or quiz
              you already signed up for.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
