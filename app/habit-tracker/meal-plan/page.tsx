import MealPlanClient from "./MealPlanClient";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical({
  title: { absolute: "This Week | Mind & Body Reset Habit Tracker" },
  description:
    "Your assigned week of meals from Lee Anne — tap to cook or log.",
});

export default function MealPlanPage() {
  return <MealPlanClient />;
}
