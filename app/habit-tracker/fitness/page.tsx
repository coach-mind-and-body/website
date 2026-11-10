import FitnessTrackerClient from "./FitnessTrackerClient";
import { usePageTitle } from "@/hooks/usePageTitle";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical({
  title: { absolute: "Fitness Tracker | Mind & Body Reset Coaches" },
  description: "Log your workouts and explore our video library.",
});

export default function FitnessTrackerPage() {
  return <FitnessTrackerClient />;
}
