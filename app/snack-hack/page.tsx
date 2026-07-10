import type { Metadata } from "next";
import SnackHackLeadGenClient from "./SnackHackLeadGenClient";

export const metadata: Metadata = {
  title: { absolute: "Stop Late-Night Snacking: Free Midlife Snack Hack Guide" },
  description:
    "End the mental food fight over late-night snacking. Download the free Midlife Mindset Guide with 7 actionable hacks to quiet food noise and find peace with nighttime habits.",
  keywords: [
    "how to stop late night snacking",
    "nighttime sugar cravings midlife",
    "food noise at night",
    "stop snacking after dinner",
  ],
  alternates: { canonical: "/snack-hack" },
  openGraph: {
    title: "Stop Late-Night Snacking: Free Midlife Snack Hack Guide",
    description:
      "7 midlife mindset hacks to quiet nighttime food noise — free guide from Mind and Body Reset.",
    url: "/snack-hack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stop Late-Night Snacking: Free Midlife Snack Hack Guide",
    description:
      "Quiet food noise and late-night cravings with 7 practical midlife hacks.",
  },
};

export default function Page() {
  return <SnackHackLeadGenClient />;
}
