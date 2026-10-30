import { Suspense } from "react";
import HabitTrackerClient from "./HabitTrackerClient";
import HabitTrackerIntro from "./HabitTrackerIntro";
import { HABIT_TRACKER_PAGE_SEO } from "@/lib/thinPageCopy";

export const metadata = {
  title: HABIT_TRACKER_PAGE_SEO.title,
  description: HABIT_TRACKER_PAGE_SEO.description,
  alternates: { canonical: "/habit-tracker" },
  openGraph: {
    title: HABIT_TRACKER_PAGE_SEO.title,
    description: HABIT_TRACKER_PAGE_SEO.description,
    url: "/habit-tracker",
    images: [
      {
        url: "/og-habit-tracker.jpg",
        width: 1200,
        height: 630,
        alt: "Mind and Body Reset Coaching Habit Tracker Dashboard",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HABIT_TRACKER_PAGE_SEO.title,
    description: HABIT_TRACKER_PAGE_SEO.description,
    images: ["/og-habit-tracker.jpg"],
  },
};

export default function Page() {
  return (
    <>
      <HabitTrackerIntro />
      <Suspense fallback={null}>
        <HabitTrackerClient />
      </Suspense>
    </>
  );
}
