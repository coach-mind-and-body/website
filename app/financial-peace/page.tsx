import type { Metadata } from "next";
import FinancialPeaceClient from "./FinancialPeaceClient";

export const metadata: Metadata = {
  title: "Financial Peace University Group | Mind and Body Reset",
  description:
    "Join Lee Anne's virtual Financial Peace University class — Tuesdays 6:30 PM MT. Orientation Aug 25, first lesson Sep 1, ends Oct 27, 2026. Kits from $99.",
  alternates: { canonical: "/financial-peace" },
  openGraph: {
    title: "Financial Peace University Group | Mind and Body Reset",
    description:
      "Virtual FPU with Lee Anne — Tuesdays 6:30 PM MT. Orientation Aug 25 · Class starts Sep 1 · Ends Oct 27, 2026.",
    url: "/financial-peace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial Peace University Group | Mind and Body Reset",
    description:
      "Virtual FPU · Tuesdays 6:30 PM MT · Sep 1–Oct 27, 2026 · Kits from $99.",
  },
};

export default function Page() {
  return <FinancialPeaceClient />;
}
