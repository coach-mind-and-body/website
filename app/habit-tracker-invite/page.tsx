import type { Metadata } from "next";
import HabitTrackerInviteClient from "./HabitTrackerInviteClient";

/**
 * Paid / organic landing for the free habit tracker app.
 * Point Meta ads and the App Store marketing URL here. Primary CTA is the App Store.
 */
export const metadata: Metadata = {
  title: { absolute: "Free Midlife Habit Tracker | Habits, Macros & Recipes" },
  description:
    "The Mind & Body Reset iPhone app is free on the App Store. Daily habits, meal logging, Lee Anne's recipes, and fitness for women 40+.",
  keywords: [
    "free habit tracker women over 40",
    "midlife habit tracker",
    "macro tracker midlife",
    "calorie tracker women",
    "high protein recipes women over 40",
    "fitness log free",
  ],
  alternates: { canonical: "/habit-tracker-invite" },
  openGraph: {
    title: "Free Midlife Habit Tracker | Mind and Body Reset Coaching",
    description:
      "Track daily habits, meals & macros, Lee Anne's recipes, and workouts in one free tool built for midlife wellness.",
    url: "/habit-tracker-invite",
    type: "website",
    images: [
      {
        url: "/og-habit-tracker.jpg",
        width: 1200,
        height: 630,
        alt: "Mind and Body Reset Coaching Habit Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Midlife Habit Tracker",
    description: "Habits, macros, recipes, and fitness — free from Mind and Body Reset Coaching.",
    images: ["/og-habit-tracker.jpg"],
  },
};

export default function Page() {
  return <HabitTrackerInviteClient />;
}
