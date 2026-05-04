import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export default function Disclaimer() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#ffffff" }}>
      <SiteNav />

      <main className="flex-1 py-20 px-6">
        <div className="mx-auto" style={{ maxWidth: "860px" }}>
          {/* Header */}
          <div className="text-center mb-14">
            <h1
              className="font-bold mb-3"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.4rem, 5vw, 3.5rem)",
                color: "oklch(0.22 0.02 160)",
              }}
            >
              Health &amp; Financial Disclaimer
            </h1>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "oklch(0.38 0.10 148)" }}>
              Last Updated: January 12, 2026
            </p>
          </div>

          {/* Intro */}
          <p className="text-base leading-relaxed mb-10" style={{ color: "oklch(0.40 0.02 160)" }}>
            Mind and Body Reset provides coaching, education, and tools for mindset, wellness, and financial awareness only.
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {/* Medical */}
            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid #fbeee9",
                }}
              >
                Medical Disclaimer
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: "oklch(0.40 0.02 160)" }}>
                We are not doctors, nurses, dietitians, or licensed healthcare providers. Nothing on this website should be interpreted as medical advice or treatment. Always consult your physician before making dietary changes or addressing metabolic health.
              </p>

              {/* Alert box */}
              <div
                className="px-8 py-6 rounded-r-xl italic text-base leading-relaxed"
                style={{
                  borderLeft: "5px solid oklch(0.38 0.10 148)",
                  background: "oklch(0.985 0.005 75)",
                  color: "oklch(0.35 0.02 160)",
                }}
              >
                Never ignore professional medical advice because of something you read or learned through Mind and Body Reset.
              </div>
            </div>

            {/* Financial */}
            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid #fbeee9",
                }}
              >
                Financial Disclaimer
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                We are not licensed financial advisors. Any financial discussions or tools are for educational purposes only. Consult a qualified financial professional before making significant financial decisions.
              </p>
            </div>

            {/* No Guarantees */}
            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid #fbeee9",
                }}
              >
                No Guarantees
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                Results vary based on individual effort and circumstances. By using our services, you accept full responsibility for your health, financial decisions, and well-being.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
