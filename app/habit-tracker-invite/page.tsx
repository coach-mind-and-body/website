import type { Metadata } from "next";
import HabitTrackerInviteClient from "./HabitTrackerInviteClient";

/**
 * Paid / organic landing for the free habit tracker app.
 * Point Meta ads here; primary CTA opens /habit-tracker.
 */
export const metadata: Metadata = {
  title: { absolute: "Free Midlife Habit Tracker | Habits, Macros & Fitness" },
  description:
    "Free habit tracker for women 40+: daily habits, meal & macro logging (with optional AI photo estimates), and fitness — start free, sync with an account when you're ready.",
  keywords: [
    "free habit tracker women over 40",
    "midlife habit tracker",
    "macro tracker midlife",
    "calorie tracker women",
    "fitness log free",
  ],
  alternates: { canonical: "/habit-tracker-invite" },
  openGraph: {
    title: "Free Midlife Habit Tracker | Mind & Body Reset Coaches",
    description:
      "Track daily habits, meals & macros, and workouts in one free tool built for midlife wellness.",
    url: "/habit-tracker-invite",
    type: "website",
    images: [
      {
        url: "/og-habit-tracker.jpg",
        width: 1200,
        height: 630,
        alt: "Mind & Body Reset Coaches Habit Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Midlife Habit Tracker",
    description: "Habits, macros, and fitness — free from Mind & Body Reset Coaches.",
    images: ["/og-habit-tracker.jpg"],
  },
};

export default function Page() {
  return <HabitTrackerInviteClient />;
}
