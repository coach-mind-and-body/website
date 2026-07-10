import type { Metadata } from "next";
import HolisticHealthClient from "./HolisticHealthClient";

export const metadata: Metadata = {
  title: "Holistic Health & Wellness for Women Over 40",
  description:
    "Discover true holistic health and wellness for midlife — how metabolic health, nervous system regulation, hormones, and daily habits work together for lasting change.",
  keywords: [
    "holistic health women over 40",
    "holistic wellness midlife",
    "nervous system regulation",
    "metabolic health women",
  ],
  alternates: { canonical: "/holistic-health-and-wellness" },
  openGraph: {
    title: "Holistic Health & Wellness for Women Over 40",
    description:
      "Metabolic health, nervous system regulation, and daily habits for lasting midlife change.",
    url: "/holistic-health-and-wellness",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Holistic Health & Wellness for Women Over 40",
    description:
      "A whole-person approach to midlife health — body, mind, and habits.",
  },
};

export default function Page() {
  return <HolisticHealthClient />;
}
