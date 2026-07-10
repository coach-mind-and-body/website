import type { Metadata } from "next";
import BlogClient from "./BlogClient";

export const metadata: Metadata = {
  title: "Health & Wellness Blog for Women Over 40",
  description:
    "Articles on midlife wellness, nutrition, hormones, perimenopause, insulin resistance, body image, mindset, and food freedom — by certified coach Lee Anne Chapman.",
  keywords: [
    "midlife health blog",
    "perimenopause articles",
    "insulin resistance women over 40",
    "food freedom blog",
  ],
  alternates: { canonical: "/health-wellness-blog" },
  openGraph: {
    title: "Health & Wellness Blog for Women Over 40",
    description:
      "Midlife wellness, hormones, mindset, and food freedom — practical articles from Mind and Body Reset.",
    url: "/health-wellness-blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Health & Wellness Blog for Women Over 40",
    description:
      "Hormones, food noise, body image, and lasting change — blog for women 40+.",
  },
};

export default function Page() {
  return <BlogClient />;
}
