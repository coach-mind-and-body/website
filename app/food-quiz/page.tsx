import type { Metadata } from "next";
import FoodQuizClient from "./FoodQuizClient";

export const metadata: Metadata = {
  title: { absolute: "Free Food & Mindset Quiz for Women Over 40 | Mind and Body Reset" },
  description:
    "Take this free 60-second quiz to discover what's really keeping you stuck with food — and get personalized midlife insights for food freedom, cravings, and mindset.",
  keywords: [
    "food mindset quiz",
    "food freedom quiz",
    "women over 40 food relationship",
    "why am I stuck with food",
  ],
  alternates: { canonical: "/food-quiz" },
  openGraph: {
    title: "Free Food & Mindset Quiz for Women Over 40",
    description:
      "60 seconds to uncover what's really keeping you stuck with food — free quiz from Mind and Body Reset.",
    url: "/food-quiz",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Food & Mindset Quiz for Women Over 40",
    description:
      "Discover your food and mindset type — free midlife quiz from coach Lee Anne Chapman.",
  },
};

export default function Page() {
  return <FoodQuizClient />;
}
