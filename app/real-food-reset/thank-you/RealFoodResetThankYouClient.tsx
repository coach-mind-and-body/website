"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BRAND } from "@shared/brand";
import { REAL_FOOD_RESET, REAL_FOOD_RESET_CLAIM_KEY } from "@shared/realFoodReset";
import { trpc } from "@/lib/trpc";
import { getDeviceId } from "@/lib/deviceId";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import HabitTrackerInstallPrompt from "@/components/HabitTrackerInstallPrompt";

export default function RealFoodResetThankYouClient() {
  const { trackLead } = useMetaPixel();
  const ga = useGoogleAnalytics();

  const claim = trpc.challenges.claimEnrollment.useMutation();

  useEffect(() => {
    trackLead({
      content_name: `${REAL_FOOD_RESET.name} — Thank You`,
      content_category: "Challenge",
    });
    ga.trackLead({ category: "Challenge", label: `${REAL_FOOD_RESET.shortName} Thank You` });
    const params = new URLSearchParams(window.location.search);
    const token = params.get("claim") || localStorage.getItem(REAL_FOOD_RESET_CLAIM_KEY);
    if (token) {
      localStorage.setItem(REAL_FOOD_RESET_CLAIM_KEY, token);
      claim.mutate({ token, deviceId: getDeviceId() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "#fcfaf9", fontFamily: "'Montserrat', sans-serif" }}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-8 md:p-12 text-center"
        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.06)", border: "1px solid #eee" }}
      >
        <img
          src={BRAND.logoUrl}
          alt={BRAND.name}
          className="mx-auto mb-5 h-20 w-20 rounded-xl object-contain"
        />
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#c9a96e" }}>
          You're in
        </p>
        <h1
          className="font-bold mb-4"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            color: "#2d3b2d",
          }}
        >
          See you {REAL_FOOD_RESET.startLabel}.
        </h1>
        <p className="text-base leading-relaxed mb-6" style={{ color: "#555" }}>
          Check your inbox for confirmation. <strong>The app is home base</strong> — open it now so daily check-ins, food logging, chat, and live reminders are ready.
        </p>
        <ul className="text-left text-sm space-y-2 mb-8 mx-auto max-w-sm" style={{ color: "#3a5a3a" }}>
          <li>✓ Lives {REAL_FOOD_RESET.liveDays} at {REAL_FOOD_RESET.liveTime}</li>
          <li>✓ Tue/Thu: video + recipes in the app</li>
          <li>✓ Progress, not perfection</li>
        </ul>
        <Link
          href="/habit-tracker?enroll=real_food_reset"
          className="inline-block font-bold rounded-xl px-8 py-4 mb-4"
          style={{ background: "oklch(0.38 0.10 148)", color: "#fff" }}
        >
          Open the habit tracker
        </Link>
        <div className="mt-4 flex justify-center">
          <HabitTrackerInstallPrompt variant="button" />
        </div>
        <p className="mt-6 text-xs" style={{ color: "#8a9a8a" }}>
          Google Meet is in the app on live days — after you’re enrolled. On iPhone, sign in with this same email.
        </p>
      </div>
    </div>
  );
}
