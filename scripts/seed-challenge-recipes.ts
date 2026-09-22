import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { recipes } from "../drizzle/schema";
import { CHALLENGE_RECIPES } from "../server/foodSeed";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("No DATABASE_URL");
  const db = drizzle(url);

  let created = 0;
  let updated = 0;
  for (const r of CHALLENGE_RECIPES) {
    const [existing] = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.slug, r.slug)).limit(1);
    const row = {
      title: r.title,
      description: r.description,
      imageUrl: r.imageUrl || null,
      source: "coach" as const,
      tagsJson: JSON.stringify(r.tags),
      mealSlotsJson: JSON.stringify(r.mealSlots),
      prepMinutes: r.prepMinutes,
      cookMinutes: r.cookMinutes,
      servings: r.servings,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      fiber: r.fiber,
      ingredientsJson: JSON.stringify(r.ingredients),
      stepsJson: JSON.stringify(r.steps),
      notes: r.notes,
      showNutrition: false,
      isPublished: true,
      isFeatured: false,
    };
    if (existing) {
      await db.update(recipes).set(row).where(eq(recipes.id, existing.id));
      updated += 1;
    } else {
      await db.insert(recipes).values({ slug: r.slug, ...row });
      created += 1;
    }
  }
  console.log(`Challenge recipes: ${created} created, ${updated} updated, ${CHALLENGE_RECIPES.length} total.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
