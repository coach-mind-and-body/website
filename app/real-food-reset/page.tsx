import type { Metadata } from "next";
import { REAL_FOOD_RESET } from "@shared/realFoodReset";
import RealFoodResetClient from "./RealFoodResetClient";

export const metadata: Metadata = {
  title: { absolute: `${REAL_FOOD_RESET.name} | Free Challenge Starting Sept 28` },
  description:
    "Free 5-day Real Food Reset for women 40+. Learn labels, added sugar, and how to build satisfying meals — progress, not perfection. Lives Mon/Wed/Fri at 12:00 pm Mountain. Starts September 28.",
  keywords: [
    "5 day real food reset",
    "no processed food challenge",
    "women over 40 food challenge",
    "read food labels",
    "stop starting over diet",
  ],
  alternates: { canonical: REAL_FOOD_RESET.path },
  openGraph: {
    title: `${REAL_FOOD_RESET.name} — starts September 28`,
    description:
      "Five days to get curious about what’s on your plate. App-based check-ins, three live Google Meets, recipes. Progress, not perfection.",
    url: REAL_FOOD_RESET.path,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${REAL_FOOD_RESET.name} — starts September 28`,
    description: "Free 5-day challenge for women 40+. Stop starting over.",
  },
};

export default function Page() {
  return <RealFoodResetClient />;
}
