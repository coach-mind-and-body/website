import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { habitPacks, habitPackItems } from "../drizzle/schema";

const PACKS = [
  {
    slug: "victory-basics",
    title: "Victory Basics",
    description: "Simple daily wins: water, protein, move, and notice what went right.",
    isDefault: true,
    sortOrder: 0,
    items: [
      { title: "Drink water", type: "boolean" as const, sortOrder: 0 },
      { title: "Hit protein goal", type: "boolean" as const, sortOrder: 1 },
      { title: "Move 10+ minutes", type: "boolean" as const, sortOrder: 2 },
      { title: "Write 3 wins", type: "boolean" as const, description: "Victory list before bed", sortOrder: 3 },
    ],
  },
  {
    slug: "craving-week",
    title: "Craving Week",
    description: "Patterns for nighttime and stress cravings.",
    isDefault: false,
    sortOrder: 1,
    items: [
      { title: "Protein at dinner", type: "boolean" as const, sortOrder: 0 },
      { title: "Pause before pantry", type: "boolean" as const, description: "Who is driving?", sortOrder: 1 },
      { title: "Evening walk or stretch", type: "boolean" as const, sortOrder: 2 },
      { title: "No kitchen after wind-down", type: "boolean" as const, sortOrder: 3 },
    ],
  },
  {
    slug: "energy-week",
    title: "Energy Week",
    description: "Exercise snacks, sleep, and steady fuel after 40.",
    isDefault: false,
    sortOrder: 2,
    items: [
      { title: "3 exercise snacks", type: "numeric" as const, targetValue: 3, unit: "snacks", sortOrder: 0 },
      { title: "Morning light / walk", type: "boolean" as const, sortOrder: 1 },
      { title: "Screens off before bed", type: "boolean" as const, sortOrder: 2 },
      { title: "Balanced breakfast", type: "boolean" as const, sortOrder: 3 },
    ],
  },
];

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  for (const pack of PACKS) {
    const [existing] = await db
      .select()
      .from(habitPacks)
      .where(eq(habitPacks.slug, pack.slug))
      .limit(1);

    let packId = existing?.id;
    if (existing) {
      await db
        .update(habitPacks)
        .set({
          title: pack.title,
          description: pack.description,
          isDefault: pack.isDefault,
          sortOrder: pack.sortOrder,
          isActive: true,
        })
        .where(eq(habitPacks.id, existing.id));
      await db.delete(habitPackItems).where(eq(habitPackItems.packId, existing.id));
    } else {
      const [res] = await db.insert(habitPacks).values({
        slug: pack.slug,
        title: pack.title,
        description: pack.description,
        isDefault: pack.isDefault,
        sortOrder: pack.sortOrder,
        isActive: true,
      });
      packId = Number((res as any).insertId);
    }

    for (const it of pack.items) {
      await db.insert(habitPackItems).values({
        packId: packId!,
        title: it.title,
        description: (it as any).description || null,
        type: it.type,
        targetValue: (it as any).targetValue ?? null,
        unit: (it as any).unit ?? null,
        sortOrder: it.sortOrder,
      });
    }
    console.log("Pack", pack.slug, "id=", packId);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
