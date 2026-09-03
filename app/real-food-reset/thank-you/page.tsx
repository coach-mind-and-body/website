import type { Metadata } from "next";
import RealFoodResetThankYouClient from "./RealFoodResetThankYouClient";

export const metadata: Metadata = {
  title: "You're in | 5-Day Real Food Reset",
  description: "You're registered. Next: open the app so you're ready for September 28.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RealFoodResetThankYouClient />;
}
