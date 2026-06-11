import { getDb } from "./server/db";
import { habitTemplates } from "./drizzle/schema";

async function seedHabits() {
  const db = await getDb();
  if (!db) {
    console.error("No DB connection");
    return;
  }

  const defaultHabits = [
    { title: "Hydrate (80oz+)", description: "Drink plenty of water throughout the day.", order: 1, isActive: true },
    { title: "Move Body (20m+)", description: "Any intentional movement, walking, yoga, or workout.", order: 2, isActive: true },
    { title: "Mindful Minutes", description: "Meditation, deep breathing, or journaling.", order: 3, isActive: true },
    { title: "Nourishing Meal", description: "Eat at least one fully balanced, nourishing meal.", order: 4, isActive: true },
    { title: "Restful Sleep (7h+)", description: "Prioritize getting enough high-quality sleep.", order: 5, isActive: true },
  ];

  console.log("Seeding default habits...");
  for (const habit of defaultHabits) {
    await db.insert(habitTemplates).values(habit);
  }
  console.log("Done seeding habits.");
  process.exit(0);
}

seedHabits();
