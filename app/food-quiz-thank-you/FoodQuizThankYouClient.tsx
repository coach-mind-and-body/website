"use client";

import { useEffect } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";


export default function FoodQuizThankYou() {
  
  const { trackLead } = useMetaPixel();
  const ga = useGoogleAnalytics();

  // Fire Lead event when thank-you page loads (catches direct navigations and refreshes)
  useEffect(() => {
    trackLead({ content_name: "Food Quiz Thank You", content_category: "Quiz" });
    ga.trackLead({ category: "Lead Generation", label: "Food Quiz Thank You" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div
          className="w-full rounded-3xl overflow-hidden shadow-xl flex flex-wrap"
          style={{ maxWidth: "1100px", background: "#ffffff", border: "1px solid oklch(0.92 0.01 160)" }}
        >
          {/* ── LEFT: Warm content ── */}
          <div
            className="flex-1 flex flex-col justify-center p-12 md:p-16"
            style={{ minWidth: "320px", background: "#fbeee9" }}
          >
            <h1
              className="font-bold mb-3"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.4rem, 5vw, 3.5rem)",
                color: "oklch(0.22 0.02 160)",
                lineHeight: 1.1,
              }}
            >
              🎉 You're In!
            </h1>
            <h2
              className="font-bold mb-6"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.4rem",
                color: "oklch(0.22 0.02 160)",
                lineHeight: 1.4,
              }}
            >
              Your Food Freedom Quiz Results Are On the Way
            </h2>

            <p className="text-base leading-relaxed mb-5" style={{ color: "oklch(0.40 0.02 160)" }}>
              Take a breath. You did the brave thing by starting. Your Food Freedom Quiz results are headed to your inbox right now. 💛 You're officially part of the Mind & Body Reset Coaches community.
            </p>

            <h3
              className="font-bold mb-4 mt-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "oklch(0.22 0.02 160)" }}
            >
              Before You Go… Here's What to Know
            </h3>
            <p className="text-base leading-relaxed mb-4" style={{ color: "oklch(0.40 0.02 160)" }}>
              If food feels stressful… If you don't trust yourself around eating… If your body feels confusing or uncooperative lately…{" "}
              <strong style={{ color: "oklch(0.22 0.02 160)" }}>You're not broken. And you're definitely not alone.</strong>
            </p>
            <p className="text-base leading-relaxed mb-6" style={{ color: "oklch(0.40 0.02 160)" }}>
              This quiz isn't about labeling you or putting you in a box. It's about helping you understand what your body and mind need right now so you can move forward calmly.
            </p>

            <h3
              className="font-bold mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "oklch(0.22 0.02 160)" }}
            >
              ✨ What Happens Next
            </h3>
            <ul className="space-y-3 mb-8">
              {[
                "Your Food + Mindset Type",
                "Gentle insights that actually make sense",
                "A small reset you can try without pressure or guilt",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-base" style={{ color: "oklch(0.40 0.02 160)" }}>
                  <CheckCircle2 size={18} style={{ color: "oklch(0.38 0.10 148)", flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>

            <h3
              className="font-bold mb-3"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "oklch(0.22 0.02 160)" }}
            >
              🌿 Want a Calm Next Step?
            </h3>
            <p className="text-base leading-relaxed mb-6" style={{ color: "oklch(0.40 0.02 160)" }}>
              If you're feeling like "I finally feel seen… but I'm not sure what to do next," let's talk. I offer a free clarity call where we talk through what's really going on in your body.
            </p>

            <a
              href="/book"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:shadow-lg hover:-translate-y-0.5 self-start"
              style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
            >
              Book your free clarity call here <ArrowRight size={18} />
            </a>

            <p className="text-sm mt-4 italic" style={{ color: "oklch(0.60 0.02 160)" }}>
              No pressure. No fixing. Just clarity and support.
            </p>

            <div
              className="mt-10 pt-6 text-sm italic leading-relaxed"
              style={{ borderTop: "1px solid rgba(0,0,0,0.07)", color: "oklch(0.60 0.02 160)" }}
            >
              🥰 One Last Thing: You don't have to do this perfectly. You're safe here.{" "}
              <br />
              <strong style={{ color: "oklch(0.40 0.02 160)" }}>P.S. Progress beats perfection every time. And naps count. 😉</strong>
            </div>
          </div>

          {/* ── RIGHT: YouTube video ── */}
          <div
            className="flex flex-col items-center justify-center p-10"
            style={{ flex: "0.8", minWidth: "300px", background: "#ffffff" }}
          >
            <div
              className="w-full rounded-2xl overflow-hidden shadow-lg"
              style={{
                position: "relative",
                paddingBottom: "177.78%", /* 9:16 */
                maxWidth: "320px",
                height: 0,
                background: "#000",
              }}
            >
              <iframe
                src="https://youtube.com/embed/nglocFhI-WM?autoplay=1&mute=1&modestbranding=1&rel=0&controls=1&playsinline=1"
                title="Lee Anne's Welcome Message"
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
      </main>

      <SiteFooter />
    </div>
  );
}
