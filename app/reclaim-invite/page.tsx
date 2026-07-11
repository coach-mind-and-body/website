import type { Metadata } from "next";
import ReclaimInviteClient from "./ReclaimInviteClient";

/**
 * Paid / retargeting landing page for R.E.C.L.A.I.M.
 * Point Meta RT ads here (not the long SEO /reclaim page).
 * noindex: keep organic traffic on /reclaim.
 */
export const metadata: Metadata = {
  title: { absolute: "R.E.C.L.A.I.M. Private Coaching | Intro $597" },
  description:
    "6 private coaching sessions for women 40+ ready to quiet food noise and rewire midlife habits. Intro pricing $597 (usually $999). Book a free fit call or enroll.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/reclaim-invite" },
  openGraph: {
    title: "R.E.C.L.A.I.M. · 6-Week Private Coaching",
    description:
      "From free guide to real change. Intro $597 (usually $999). Free discovery call or enroll.",
    url: "/reclaim-invite",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "R.E.C.L.A.I.M. · Intro $597",
    description: "6 private sessions for midlife food noise and lasting habits.",
  },
};

export default function Page() {
  return <ReclaimInviteClient />;
}
