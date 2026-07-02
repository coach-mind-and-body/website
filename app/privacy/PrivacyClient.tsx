"use client";

import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";


export default function Privacy() {
  
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbeee9" }}>
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
              Privacy Policy
            </h1>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "oklch(0.38 0.10 148)" }}>
              Last Updated: January 12, 2026
            </p>
          </div>

          {/* Intro */}
          <p className="text-base leading-relaxed mb-10" style={{ color: "oklch(0.40 0.02 160)" }}>
            Your privacy matters to us. This Privacy Policy explains how Mind and Body Reset collects, uses, and protects your personal information.
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {/* Section 1 */}
            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid rgba(255,255,255,0.7)",
                }}
              >
                1. Information We Collect
              </h2>
              <ul className="space-y-2 pl-5 list-disc" style={{ color: "oklch(0.40 0.02 160)" }}>
                <li className="text-base leading-relaxed">Name, email address, and contact information</li>
                <li className="text-base leading-relaxed">Information you provide through forms or coaching</li>
                <li className="text-base leading-relaxed">Website usage data (cookies, analytics, IP address)</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid rgba(255,255,255,0.7)",
                }}
              >
                2. How We Use Your Information
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                Your information is used to provide services, respond to inquiries, and improve our offerings.{" "}
                <strong style={{ color: "oklch(0.22 0.02 160)" }}>We do not sell or rent your personal information.</strong>
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid rgba(255,255,255,0.7)",
                }}
              >
                3. Data Protection
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                We take reasonable steps to protect your information but cannot guarantee absolute security due to the nature of the internet.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid rgba(255,255,255,0.7)",
                }}
              >
                4. Your Rights
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                You may request to access, update, or delete your personal information or unsubscribe from emails at any time.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid rgba(255,255,255,0.7)",
                }}
              >
                5. SMS & Communication
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                By providing your phone number, you consent to receive SMS communications from us. We use these for transactional updates, reminders, and coaching support. <strong style={{ color: "oklch(0.22 0.02 160)" }}>Mobile information will not be shared with third parties or affiliates for marketing or promotional purposes.</strong> You can opt-out at any time by replying STOP to any message. Reply HELP for assistance.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
