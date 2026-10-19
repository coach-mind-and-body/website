import type { Metadata } from "next";
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";
import HolidayClient from "./HolidayClient";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
  variable: "--font-holiday-display",
});

const sans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-holiday-body",
});

export const metadata: Metadata = {
  title: { absolute: "What if this holiday season was different?" },
  description:
    "Five weeks of free 1:1 metabolic coaching with Lee Anne for women over 40. One hour a week on a video call. A Keto-Mojo meter is required. 3 spots, then a waitlist.",
  alternates: { canonical: "/holiday" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "What if this holiday season was different?",
    description:
      "5 weeks of free 1:1 coaching with Lee Anne. A Keto-Mojo meter is required. 3 spots.",
    url: "/holiday",
    type: "website",
    images: [{ url: "/photos/lee-anne.jpg", alt: "Lee Anne Chapman smiling" }],
  },
};

export default function HolidayPage() {
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <HolidayClient />
    </div>
  );
}
