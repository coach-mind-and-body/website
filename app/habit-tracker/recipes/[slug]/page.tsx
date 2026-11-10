import RecipeDetailClient from "./RecipeDetailClient";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical({
  title: { absolute: "Recipe | Mind & Body Reset Habit Tracker" },
  description:
    "A protein-forward recipe from Lee Anne's vault — log it straight into your day.",
});

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RecipeDetailClient slug={slug} />;
}
