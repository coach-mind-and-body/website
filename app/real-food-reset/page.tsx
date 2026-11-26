import type { Metadata } from "next";
import { REAL_FOOD_RESET } from "@shared/realFoodReset";
import RealFoodResetClient from "./RealFoodResetClient";

const title = "The 5-Day No Processed Food Challenge (Closed)";
const description =
  "The free 5-Day No Processed Food Challenge from Mind and Body Reset has ended. Explore the health and wellness blog and podcast for women over 40.";

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
