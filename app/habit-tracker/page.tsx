import HabitTrackerClient from './HabitTrackerClient';

export const metadata = {
  title: "Free Habit Tracker for Midlife Wellness",
  description:
    "Track your daily habits and reclaim your wellness journey. Free habit tracker for women building sustainable midlife health — use with an account or locally on your device.",
  alternates: { canonical: "/habit-tracker" },
  openGraph: {
    title: "Free Habit Tracker for Midlife Wellness",
    description:
      "Build momentum with the Mind & Body Reset Coaches Habit Tracker. Track daily wins and stay accountable.",
    url: "/habit-tracker",
    images: [
      {
        url: "/og-habit-tracker.jpg",
        width: 1200,
        height: 630,
        alt: "Mind & Body Reset Coaches Habit Tracker Dashboard",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Habit Tracker for Midlife Wellness",
    description:
      "Build momentum with the Mind & Body Reset Coaches Habit Tracker. Track daily wins and stay accountable.",
    images: ["/og-habit-tracker.jpg"],
  },
};

export default function Page() {
  return <HabitTrackerClient  />;
}
