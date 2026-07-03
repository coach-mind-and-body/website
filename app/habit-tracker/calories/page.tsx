import CalorieTrackerClient from './CalorieTrackerClient';
import { usePageTitle } from "@/hooks/usePageTitle";

export const metadata = {
  title: "Calorie Tracker | Mind & Body Reset",
  description: "Track your meals and macros easily.",
};

export default function CalorieTrackerPage() {
  return <CalorieTrackerClient />;
}
