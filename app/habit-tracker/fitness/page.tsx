import FitnessTrackerClient from './FitnessTrackerClient';
import { usePageTitle } from "@/hooks/usePageTitle";

export const metadata = {
  title: { absolute: "Fitness Tracker | Mind & Body Reset Coaches" },
  description: "Log your workouts and explore our video library.",
};

export default function FitnessTrackerPage() {
  return <FitnessTrackerClient />;
}
