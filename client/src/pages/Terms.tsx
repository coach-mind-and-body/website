import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const sections = [
  {
    title: "1. Services Provided",
    body: "Mind and Body Reset provides coaching, education, tools, and resources related to mindset, wellness, health habits, and financial awareness. Coaching is educational and supportive in nature and is not therapy, medical care, or financial advising.",
  },
  {
    title: "2. Coaching Relationship",
    body: "Coaching is a collaborative process designed to help clients clarify goals, explore habits, and build awareness. You understand that you are fully responsible for your decisions, actions, and results.",
  },
  {
    title: "3. No Professional Advice",
    body: "Content provided is not a substitute for professional medical, psychological, legal, or financial advice. Consult with qualified professionals before making significant health, medical, dietary, exercise, or financial changes.",
  },
  {
    title: "4. Health and Financial Responsibility",
    body: "Any health or wellness changes carry inherent risks. Any financial decisions are made at your own discretion. Mind and Body Reset is not responsible for outcomes related to your decisions.",
  },
  {
    title: "5. Intellectual Property",
    body: "All content on this website is the property of Mind and Body Reset and may not be copied, distributed, or reused without written permission.",
  },
];

export default function Terms() {
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
              Terms and Conditions
            </h1>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "oklch(0.38 0.10 148)" }}>
              Last Updated: January 12, 2026
            </p>
          </div>

          {/* Intro */}
          <p className="text-base leading-relaxed mb-10" style={{ color: "oklch(0.40 0.02 160)" }}>
            Welcome to Mind and Body Reset. By accessing or using this website, programs, services, or content, you agree to the following Terms and Conditions.
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((s) => (
              <div key={s.title}>
                <h2
                  className="font-bold text-xl mb-3 pb-3"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "oklch(0.22 0.02 160)",
                    borderBottom: "2px solid #fbeee9",
                  }}
                >
                  {s.title}
                </h2>
                <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
