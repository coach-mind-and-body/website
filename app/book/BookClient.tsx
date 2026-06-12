"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Calendar } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { GOOGLE_CALENDAR } from "@shared/brand";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";


export default function Book() {
  
  const { trackLead } = useMetaPixel();
  const ga = useGoogleAnalytics();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitLead = trpc.leads.submit.useMutation({
    onSuccess: () => {
      // Fire Meta Pixel and GA Lead events when discovery call is booked
      trackLead({ content_name: "Discovery Call Booking", content_category: "Book a Call" });
      ga.trackLead({ category: "Book a Call", label: "Discovery Call Booking" });
      setSubmitted(true);
    },
    onError: (err) => toast.error(err.message || "Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    submitLead.mutate({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined });
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      {/* Hero */}
      <section className="py-16 text-center" style={{ background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.97 0.008 10) 60%)" }}>
        <div className="container max-w-2xl mx-auto">
          <span className="badge-gold mb-4 inline-block">Free · 30 Minutes · No Commitment</span>
          <h1 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)", color: "oklch(0.22 0.02 160)" }}>
            Book Your Free Discovery Call
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "oklch(0.45 0.02 160)", maxWidth: "480px", margin: "0 auto" }}>
            In this free 30-minute call, you'll learn a new way that women just like you are losing the weight and keeping it off forever — and whether the R.E.C.L.A.I.M. program is right for you.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">

          {/* ── STEP 1: Form (shown until submitted) ── */}
          {!submitted && (
            <div className="max-w-xl mx-auto">
              <div className="card-brand rounded-2xl p-8">
                <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>
                  Let Us Know You're Coming
                </h2>
                <p className="text-sm mb-6" style={{ color: "oklch(0.55 0.02 160)" }}>
                  Fill in your details and we'll get you set up — then you'll pick a time that works for you.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: "oklch(0.45 0.02 160)" }}>Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                      style={{ borderColor: "oklch(0.88 0.01 160)", background: "oklch(1 0 0)", color: "oklch(0.22 0.02 160)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: "oklch(0.45 0.02 160)" }}>Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                      style={{ borderColor: "oklch(0.88 0.01 160)", background: "oklch(1 0 0)", color: "oklch(0.22 0.02 160)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: "oklch(0.45 0.02 160)" }}>Phone (optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(801) 555-0000"
                      className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                      style={{ borderColor: "oklch(0.88 0.01 160)", background: "oklch(1 0 0)", color: "oklch(0.22 0.02 160)" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitLead.isPending}
                    className="w-full py-3 rounded-full font-bold text-sm transition-all hover:shadow-lg disabled:opacity-60"
                    style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
                  >
                    {submitLead.isPending ? "Saving..." : "Save My Info & Pick a Time →"}
                  </button>
                </form>
              </div>

              {/* What to expect */}
              <div className="mt-6 space-y-3">
                {[
                  "No sales pressure — just a real conversation",
                  "Learn what's actually keeping you stuck",
                  "Find out if R.E.C.L.A.I.M. is right for you",
                  "Walk away with at least one actionable insight",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={14} style={{ color: "oklch(0.38 0.10 148)", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-sm" style={{ color: "oklch(0.45 0.02 160)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Calendar (shown only after form submitted) ── */}
          {submitted && (
            <div className="max-w-4xl mx-auto">
              {/* Success message */}
              <div className="text-center mb-8">
                <CheckCircle2 size={52} className="mx-auto mb-4" style={{ color: "oklch(0.38 0.10 148)" }} />
                <h3 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>
                  You're on the list, {name}!
                </h3>
                <p className="text-base" style={{ color: "oklch(0.45 0.02 160)" }}>
                  Now pick a date and time that works for you below. We look forward to speaking with you!
                </p>
              </div>

              {/* Calendar embed */}
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: "1px solid oklch(0.90 0.01 160)" }}>
                <div className="flex items-center gap-2 px-5 py-3" style={{ background: "oklch(0.38 0.10 148)" }}>
                  <Calendar size={16} style={{ color: "white" }} />
                  <span className="text-sm font-bold" style={{ color: "white" }}>Select a Date &amp; Time</span>
                </div>
                <iframe
                  src={GOOGLE_CALENDAR.discoveryCall}
                  style={{ border: 0, display: "block" }}
                  width="100%"
                  height="650"
                  frameBorder="0"
                  title="Book a Free Discovery Call with Lee Anne"
                />
              </div>
            </div>
          )}

        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
