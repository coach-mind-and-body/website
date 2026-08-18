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
              Last Updated: August 17, 2026
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
                <li className="text-base leading-relaxed">Habit Tracker account data (habits, meal logs, workouts you enter, coach messages, and photos you send)</li>
                <li className="text-base leading-relaxed">Apple Health data you choose to share in the Habit Tracker iOS app (see section 6)</li>
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
                Habit Tracker account deletion: email{" "}
                <a href="mailto:coach@mindandbodyresetcoach.com" className="underline">
                  coach@mindandbodyresetcoach.com
                </a>{" "}
                from the signed-in address.
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

            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid rgba(255,255,255,0.7)",
                }}
              >
                6. Habit Tracker iOS app &amp; Apple Health
              </h2>
              <div className="space-y-3 text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                <p>
                  The Habit Tracker iPhone app is a coaching and wellness tool, not a medical device and not medical advice.
                  You can use it as a guest on one device, or sign in (email, Google, or Sign in with Apple) to sync.
                </p>
                <p>
                  <strong style={{ color: "oklch(0.22 0.02 160)" }}>Apple Health.</strong> If you allow access, we may{" "}
                  <em>read</em> steps, exercise minutes, workouts, mindful minutes, last night’s sleep, and weight so
                  habits like Move Body, Mindful Minutes, and Restful Sleep can fill in. If you log a workout or finish
                  a mindful session <em>in our app</em>, we may <em>write</em> that session back to Apple Health so your
                  rings stay in sync. We do not sell Health data. We do not use Health data for advertising. Raw Health
                  samples stay on your iPhone. If you are signed in, we only store the habit check (for example, that
                  Move Body was completed) on our servers the same way a tap would.
                </p>
                <p>
                  <strong style={{ color: "oklch(0.22 0.02 160)" }}>Camera &amp; photos.</strong> Optional. You can
                  photograph a meal for an AI portion estimate, or send a photo to your coach. Estimate photos are sent
                  to our servers and to the AI processor described in section 7. Coach photos are stored so Lee Anne can
                  see them in her inbox.
                </p>
                <p>
                  <strong style={{ color: "oklch(0.22 0.02 160)" }}>Notifications.</strong> Optional evening reminders
                  and coach-reply alerts. You can turn these off in the app or iOS Settings.
                </p>
                <p>
                  You may revoke Health access in iOS Settings → Health → Data Access. To delete your Habit Tracker
                  account and associated server data, email{" "}
                  <a href="mailto:coach@mindandbodyresetcoach.com" className="underline">
                    coach@mindandbodyresetcoach.com
                  </a>{" "}
                  from the address on the account. We will delete or de-identify personal data we control, except where
                  we must keep records (for example, payment or legal obligations).
                </p>
              </div>
            </div>

            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid rgba(255,255,255,0.7)",
                }}
              >
                7. Service providers
              </h2>
              <p className="text-base leading-relaxed mb-3" style={{ color: "oklch(0.40 0.02 160)" }}>
                We use vendors to run the website and Habit Tracker. They process data only to provide those services:
              </p>
              <ul className="space-y-2 pl-5 list-disc" style={{ color: "oklch(0.40 0.02 160)" }}>
                <li className="text-base leading-relaxed">Hosting and database (our cloud infrastructure)</li>
                <li className="text-base leading-relaxed">Sign in with Apple and Google Sign-In (authentication)</li>
                <li className="text-base leading-relaxed">Optional meal photo / text estimates use an AI model (Google Gemini) to return calories and macros. Meal images you submit for that feature are sent to that processor.</li>
                <li className="text-base leading-relaxed">Optional packaged-food lookup via FatSecret</li>
                <li className="text-base leading-relaxed">YouTube, if you play podcast or workout videos in the app</li>
                <li className="text-base leading-relaxed">Analytics (website traffic) and email delivery</li>
              </ul>
            </div>

            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid rgba(255,255,255,0.7)",
                }}
              >
                8. Children
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                Habit Tracker and our coaching services are intended for adults. We do not knowingly collect personal
                information from children under 13. If you believe a child has created an account, contact us and we
                will delete it.
              </p>
            </div>

            <div>
              <h2
                className="font-bold text-xl mb-3 pb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "oklch(0.22 0.02 160)",
                  borderBottom: "2px solid rgba(255,255,255,0.7)",
                }}
              >
                9. Contact
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "oklch(0.40 0.02 160)" }}>
                Privacy questions or deletion requests:{" "}
                <a href="mailto:coach@mindandbodyresetcoach.com" className="underline">
                  coach@mindandbodyresetcoach.com
                </a>
                . Website:{" "}
                <a href="https://mindandbodyresetcoach.com" className="underline">
                  mindandbodyresetcoach.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
