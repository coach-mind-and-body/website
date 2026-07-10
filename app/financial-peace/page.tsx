import type { Metadata } from "next";
import FinancialPeaceClient from "./FinancialPeaceClient";

export const metadata: Metadata = {
  title: "Financial Peace University Group | Mind and Body Reset",
  description:
    "Join Lee Anne's Financial Peace University group — Dave Ramsey's proven plan for budgeting, eliminating debt, and building wealth alongside your health journey.",
  alternates: { canonical: "/financial-peace" },
  openGraph: {
    title: "Financial Peace University Group | Mind and Body Reset",
    description:
      "Dave Ramsey's FPU with Lee Anne — budgeting, debt freedom, and building wealth.",
    url: "/financial-peace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial Peace University Group | Mind and Body Reset",
    description:
      "Join the next FPU cohort — budgeting, debt, and wealth with community support.",
  },
};

export default function Page() {
  return <FinancialPeaceClient />;
}
