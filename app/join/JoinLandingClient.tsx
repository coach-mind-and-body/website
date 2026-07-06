"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { getMetaParams, generateMetaEventId } from "@/hooks/useMetaParams";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";


const WELLNESS_IMG =
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop";

export default function JoinLanding() {
  const submitJoinLead = trpc.leadgen.submitJoin.useMutation({
    onSuccess: (_data, variables) => {
      setLoading(false);
      trackLead({ content_name: "Join the Community - Email Sign-Up", content_category: "Lead Magnet" }, variables.eventId);
      ga.trackLead({ category: "Lead Magnet", label: "Join the Community — Email Sign-Up" });
      router.push("/join-thank-you");
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    },
  });
  
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { trackViewContent, trackLead } = useMetaPixel();
  const ga = useGoogleAnalytics();

  // Fire ViewContent when the page loads — tells Meta someone saw the lead magnet offer
  useEffect(() => {
    trackViewContent({
      content_name: "Join the Community — Email Sign-Up",
      content_category: "Lead Magnet",
      content_type: "product",
    });
    ga.trackViewContent({ item_name: "Join the Community — Email Sign-Up", item_category: "Lead Magnet" });
  }, []);

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);

    const eventId = generateMetaEventId();
    const meta = getMetaParams();
    try {
      await submitJoinLead.mutateAsync({
        email,
        firstName,
        contentName: "Join the Community - Email Sign-Up",
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        ...meta,
        eventId,
      });
    } catch {
      // Error handled in onError
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "#fcfaf9", fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Card */}
      <div
        className="w-full flex flex-wrap overflow-hidden rounded-3xl"
        style={{
          maxWidth: "1100px",
          background: "#ffffff",
          boxShadow: "0 20px 50px rgba(0,0,0,0.06)",
          border: "1px solid #eee",
        }}
      >
        {/* Left — Peach opt-in */}
        <div
          className="flex flex-col justify-center items-center text-center px-10 py-16"
          style={{ flex: "0.8", minWidth: "320px", background: "#fbeee9" }}
        >
          <img
            src={BRAND.logoUrl}
            alt="Mind & Body Reset"
            className="mb-6"
            style={{ width: "90px", height: "90px", objectFit: "contain" }}
          />
          <h2
            className="font-bold mb-8"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              color: "oklch(0.22 0.02 160)",
            }}
          >
            Join the Reset
          </h2>

          <div className="flex flex-col gap-4 w-full" style={{ maxWidth: "340px" }}>
            <input
              type="text"
              placeholder="First Name"
              aria-label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full text-center text-base rounded-xl px-5 py-5 outline-none"
              style={{
                border: "1px solid #ddd",
                fontFamily: "'Montserrat', sans-serif",
                background: "#fff",
                color: "oklch(0.22 0.02 160)",
              }}
            />
            <input
              type="email"
              placeholder="Email Address"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full text-center text-base rounded-xl px-5 py-5 outline-none"
              style={{
                border: "1px solid #ddd",
                fontFamily: "'Montserrat', sans-serif",
                background: "#fff",
                color: "oklch(0.22 0.02 160)",
              }}
            />

            {error && (
              <p className="text-sm font-semibold" style={{ color: "oklch(0.45 0.15 25)" }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full font-bold text-lg rounded-xl py-5 transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{
                background: "oklch(0.38 0.10 148)",
                color: "#fff",
                fontFamily: "'Montserrat', sans-serif",
                boxShadow: "0 10px 20px rgba(62,84,70,0.2)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Sending…" : "Count Me In →"}
            </button>
          </div>

          <p className="mt-8 text-xs leading-relaxed" style={{ color: "#999", maxWidth: "280px" }}>
            No extreme plans. No spam.
            <br />
            Just steady support for your mind and body.
          </p>
        </div>

        {/* Right — Copy + image */}
        <div
          className="flex flex-col justify-center px-14 py-16"
          style={{ flex: "1", minWidth: "320px", background: "#ffffff" }}
        >
          <h1
            className="font-bold leading-tight mb-6"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "oklch(0.22 0.02 160)",
            }}
          >
            Reclaim Your Body.
            <br />
            Rewire Your Mind.
            <br />
            Reset Your Life.
          </h1>
          <p className="text-lg leading-relaxed mb-8" style={{ color: "#555" }}>
            Join our community for honest conversations, mentorship, and the steady support you need to finally feel like yourself again.
          </p>
          <img
            src={WELLNESS_IMG}
            alt="Mind and Body Wellness"
            className="w-full rounded-xl"
            style={{ maxWidth: "400px", objectFit: "cover" }}
          />
        </div>
      </div>
    </div>
  );
}


