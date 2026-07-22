import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "Sign In | Mind and Body Reset",
  description:
    "Sign in to your Mind & Body Reset Coaches account — coaching portal, habit tracker, and program resources.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.985 0.008 75)" }}>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.38 0.09 148)" }} />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
