import RecipesClient from "./RecipesClient";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical({
  title: { absolute: "Recipes | Mind & Body Reset Habit Tracker" },
  description:
    "Lee Anne's recipe vault — protein-forward meals that quiet food noise.",
});

export default function RecipesPage() {
  return <RecipesClient />;
}
