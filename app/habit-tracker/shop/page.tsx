import ShopClient from "./ShopClient";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical({
  title: { absolute: "Shop | Mind & Body Reset Habit Tracker" },
  description:
    "Your shopping list, grouped by aisle — built from this week's meals.",
});

export default function ShopPage() {
  return <ShopClient />;
}
