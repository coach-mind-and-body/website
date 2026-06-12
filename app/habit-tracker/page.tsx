import HabitTrackerClient from './HabitTrackerClient';

export const metadata = {
  title: "Habit Tracker | Mind & Body Reset",
  description: "Track your daily habits and reclaim your wellness journey. Access anywhere with an account, or track locally on your device.",
  openGraph: {
    title: "Habit Tracker | Mind & Body Reset",
    description: "Build momentum with the Mind & Body Reset Habit Tracker. Track your daily wins, stay accountable, and transform your health.",
    url: "/habit-tracker",
    images: [
      {
        url: "/og-habit-tracker.jpg",
        width: 1200,
        height: 630,
        alt: "Mind & Body Reset Habit Tracker Dashboard",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Habit Tracker | Mind & Body Reset",
    description: "Build momentum with the Mind & Body Reset Habit Tracker. Track your daily wins, stay accountable, and transform your health.",
    images: ["/og-habit-tracker.jpg"],
  }
};

export default function Page() {
  return <HabitTrackerClient  />;
}
