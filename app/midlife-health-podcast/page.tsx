import type { Metadata } from "next";
import PodcastClient from "./PodcastClient";

export const metadata: Metadata = {
  title: "Midlife Health Podcast | Mind and Body Reset",
  description:
    "Listen to the Mind and Body Reset podcast — real strategy for midlife health, hormones, insulin resistance, weight loss mindset, and food freedom for women 40+.",
  keywords: [
    "midlife health podcast",
    "perimenopause podcast",
    "women over 40 health podcast",
    "insulin resistance podcast",
  ],
  alternates: { canonical: "/midlife-health-podcast" },
  openGraph: {
    title: "Midlife Health Podcast | Mind and Body Reset",
    description:
      "Real strategy for midlife health, hormones, weight loss mindset, and food freedom — with Lee Anne Chapman.",
    url: "/midlife-health-podcast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Midlife Health Podcast | Mind and Body Reset",
    description:
      "Hormones, GLP-1s, food noise, and midlife health — episodes for women 40+.",
  },
};

export default function Page() {
  return <PodcastClient />;
}
