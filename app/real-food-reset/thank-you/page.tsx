import type { Metadata } from "next";
import RealFoodResetThankYouClient from "./RealFoodResetThankYouClient";

export const metadata: Metadata = {
  title: "You're in | 5-Day No Processed Food Challenge",
  description: "You're registered. Next: open the app so daily check-ins and live reminders are ready.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RealFoodResetThankYouClient />;
}
