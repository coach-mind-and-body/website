import { Link } from "wouter";
import { useEffect } from "react";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { BRAND } from "../../../shared/brand";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function JoinThankYou() {
  usePageTitle({
    title: "Welcome to the Community | Mind and Body Reset",
    description: "Welcome! You\'ve joined the Mind & Body Reset community. Check your inbox for your first wellness resources.",
    keywords: "welcome, community joined, wellness resources, mind body reset"
  });
  const { trackLead } = useMetaPixel();

  // Fire Lead on the thank-you page as a confirmation signal —
  // this is the most reliable place to fire since the form submit may race with navigation
  useEffect(() => {
    trackLead({
      content_name: "Join the Community — Email Sign-Up",
      content_category: "Lead Magnet",
    });
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
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
        {/* Left — Peach confirmation */}
        <div
          className="flex flex-col justify-center items-center text-center px-12 py-14"
          style={{ flex: "1", minWidth: "320px", background: "#fbeee9" }}
        >
          <img
            src={BRAND.logoUrl}
            alt="Mind & Body Reset"
            className="mb-5"
            style={{ width: "90px", height: "90px", objectFit: "contain" }}
          />
          <p
            className="font-semibold uppercase tracking-widest mb-4 text-sm"
            style={{ color: "#999" }}
          >
            Success
          </p>
          <h1
            className="font-bold leading-tight mb-5"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              color: "oklch(0.22 0.02 160)",
            }}
          >
            You're In!
          </h1>
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: "#555", maxWidth: "340px" }}
          >
            Check your inbox for your first update. While you're here, watch the video and book your free{" "}
            <strong>30-minute Clarity Call</strong> below.
          </p>

          <Link
            href="/book"
            className="inline-block font-bold text-lg rounded-xl px-10 py-5 transition-all hover:-translate-y-0.5"
            style={{
              background: "oklch(0.38 0.10 148)",
              color: "#fff",
              boxShadow: "0 10px 20px rgba(62,84,70,0.2)",
            }}
          >
            Book Your 30-Min Call →
          </Link>
        </div>

        {/* Right — 9:16 YouTube video */}
        <div
          className="flex flex-col justify-center items-center px-10 py-10"
          style={{ flex: "0.9", minWidth: "320px", background: "#ffffff" }}
        >
          {/* 9:16 aspect ratio wrapper */}
          <div
            style={{
              position: "relative",
              paddingBottom: "177.78%",
              width: "100%",
              maxWidth: "340px",
              height: 0,
              overflow: "hidden",
              borderRadius: "16px",
              background: "#000",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            <iframe
              src="https://youtube.com/embed/nglocFhI-WM?autoplay=1&mute=1&modestbranding=1&rel=0&controls=1&playsinline=1"
              title="Mind & Body Reset Coaching"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile responsive overrides via inline style tag */}
      <style>{`
        @media (max-width: 850px) {
          .join-ty-card { flex-direction: column !important; border-radius: 0 !important; }
          .join-ty-left, .join-ty-right { padding: 40px 25px !important; width: 100% !important; box-sizing: border-box !important; }
        }
      `}</style>
    </div>
  );
}
