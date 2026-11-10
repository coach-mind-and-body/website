import type { Metadata } from "next";
import { REAL_FOOD_RESET } from "@shared/realFoodReset";
import RealFoodResetClient from "./RealFoodResetClient";

const title = REAL_FOOD_RESET.name;
const description =
  "Free 5-Day No Processed Food Challenge for women 40+. Learn labels, added sugar, and how to build satisfying meals — progress, not perfection. Lives Mon/Wed/Fri at 1:00 pm Mountain.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "5 day no processed food challenge",
    "no processed food challenge",
    "women over 40 food challenge",
    "read food labels",
    "stop starting over diet",
  ],
  alternates: { canonical: REAL_FOOD_RESET.path },
  openGraph: {
    title,
    description,
    url: REAL_FOOD_RESET.path,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function Page() {
  return <RealFoodResetClient />;
}
