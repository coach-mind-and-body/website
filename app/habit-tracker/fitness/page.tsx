import FitnessTrackerClient from './FitnessTrackerClient';
import { usePageTitle } from "@/hooks/usePageTitle";

export const metadata = {
  title: "Fitness Tracker | Mind & Body Reset",
  description: "Log your workouts and explore our video library.",
};

export default function FitnessTrackerPage() {
  return <FitnessTrackerClient />;
}
