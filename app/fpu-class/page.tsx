import type { Metadata } from "next";
import FpuClassClient from "./FpuClassClient";

/**
 * Paid / Meta landing for Fall 2026 FPU cohort.
 * Point ads here — not /financial-peace (long evergreen) and not Ramsey first.
 * noindex: keep organic on /financial-peace.
 */
export const metadata: Metadata = {
  title: {
    absolute: "Financial Peace Class · Tuesdays 6:30 PM MT | Lee Anne Chapman",
  },
  description:
    "Virtual Financial Peace University with Lee Anne. Tuesdays 6:30 PM MT. Orientation Aug 25, first lesson Sep 1, ends Oct 27, 2026. Kits from $99 — buy & join her class.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/fpu-class" },
  openGraph: {
    title: "FPU Virtual Class · Tuesdays 6:30 PM MT",
    description:
      "Join Lee Anne’s Financial Peace University class. Orientation Aug 25 · Starts Sep 1 · Ends Oct 27. Kits from $99.",
    url: "/fpu-class",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FPU Virtual Class · Tuesdays 6:30 PM MT",
    description: "Orientation Aug 25 · Class Sep 1–Oct 27 · Kits from $99.",
  },
};

export default function Page() {
  return <FpuClassClient />;
}
