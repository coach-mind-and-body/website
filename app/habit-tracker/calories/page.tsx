import CalorieTrackerClient from "./CalorieTrackerClient";
import { usePageTitle } from "@/hooks/usePageTitle";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical({
  title: { absolute: "Calorie Tracker | Mind & Body Reset Coaches" },
  description: "Track your meals and macros easily.",
});

export default function CalorieTrackerPage() {
  return <CalorieTrackerClient />;
}
