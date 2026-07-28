"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Calendar } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { GOOGLE_CALENDAR, PROGRAM } from "@shared/brand";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { generateMetaEventId, captureFbclidFromUrl } from "@/hooks/useMetaParams";

/**
 * Discovery call booking is calendar-only.
 * Google Appointment Schedule collects name + email (required for Meet).
 * Actual Schedule conversion fires server-side via GCal sync (CAPI).
 * Browser pixel: ViewContent + Schedule intent when user engages the calendar.
 */
export default function Book() {
  const searchParams = useSearchParams();
  const { trackViewContent, trackSchedule, trackLead } = useMetaPixel();
  const ga = useGoogleAnalytics();
  const engagedRef = useRef(false);

  const fromReclaim = useMemo(() => {
    const c = (searchParams?.get("utm_campaign") || "").toLowerCase();
    const content = (searchParams?.get("utm_content") || "").toLowerCase();
    const source = (searchParams?.get("utm_source") || "").toLowerCase();
    return (
      c.includes("reclaim") ||
      c.includes("rt_reclaim") ||
      content.includes("invite") ||
      content.includes("book") ||
      source === "meta"
    );
  }, [searchParams]);

  useEffect(() => {
    captureFbclidFromUrl();
    const eventId = generateMetaEventId();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("meta_schedule_page_event_id", eventId);
    }
    trackViewContent(
      {
        content_name: fromReclaim
          ? "Discovery Call — RECLAIM traffic"
          : "Discovery Call Booking Page",
        content_category: "Coaching",
        content_type: "product",
        value: PROGRAM.fullPrice,
        currency: "USD",
      },
      eventId
    );
    ga.trackViewContent({
      item_name: "Discovery Call",
      item_category: "Coaching",
      value: PROGRAM.fullPrice,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Fire Schedule when user actually interacts with the booking widget (best browser signal). */
  const markCalendarEngaged = () => {
    if (engagedRef.current) return;
    engagedRef.current = true;
    const eventId =
      (typeof window !== "undefined" &&
        sessionStorage.getItem("meta_schedule_page_event_id")) ||
      generateMetaEventId();
    // Browser Schedule = strong optimization signal; CAPI Schedule fires again on real booking with different event_id
    trackSchedule(
      {
        content_name: "Discovery Call — calendar engaged",
        content_category: "Coaching",
        value: 0,
        currency: "USD",
      },
      `${eventId}_engaged`
    );
    trackLead(
      {
        content_name: "Discovery Call — calendar engaged",
        content_category: "Coaching",
        value: 0,
        currency: "USD",
      },
      `${eventId}_engaged_lead`
    );
    ga.trackLead({
      category: "Coaching",
      label: "Discovery Call Calendar Engaged",
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      <section
        className="py-12 sm:py-16 text-center"
        style={{
          background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.97 0.008 10) 60%)",
        }}
      >
        <div className="container max-w-2xl mx-auto px-4">
          <span className="badge-gold mb-4 inline-block">Free · 30 Minutes · No Commitment</span>
          <h1
            className="font-bold mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)",
              color: "oklch(0.22 0.02 160)",
            }}
          >
            {fromReclaim
              ? "Book your free R.E.C.L.A.I.M. fit call"
              : "Book Your Free Discovery Call"}
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ color: "oklch(0.45 0.02 160)", maxWidth: "480px", margin: "0 auto" }}
          >
            {fromReclaim
              ? "Pick a time below. In this free 30-minute call, Lee Anne will help you see if private 6-week coaching is the right next step — no pressure pitch."
              : "Pick a time that works for you. Google will ask for your name and email so we can send the Meet link. In this free 30-minute call, you'll learn a new way women just like you are losing the weight and keeping it off — and whether R.E.C.L.A.I.M. is right for you."}
          </p>
          {fromReclaim && (
            <p className="mt-3 text-sm font-semibold" style={{ color: "oklch(0.38 0.10 148)" }}>
              Intro rate still available for the first 10 enrollments · ${PROGRAM.fullPrice}
            </p>
          )}
        </div>
      </section>

      <section className="pb-16 pt-4">
        <div className="container max-w-4xl mx-auto px-4">
          <div
            className="rounded-2xl overflow-hidden shadow-lg mb-10"
            style={{ border: "1px solid oklch(0.90 0.01 160)" }}
            onClick={markCalendarEngaged}
            onFocusCapture={markCalendarEngaged}
            onPointerDown={markCalendarEngaged}
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
              onLoad={markCalendarEngaged}
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
