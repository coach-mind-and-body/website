import ShopClient from "./ShopClient";

export const metadata = {
  title: { absolute: "Shop | Mind & Body Reset Habit Tracker" },
  description: "Your shopping list, grouped by aisle — built from this week's meals.",
};

export default function ShopPage() {
  return <ShopClient />;
}
