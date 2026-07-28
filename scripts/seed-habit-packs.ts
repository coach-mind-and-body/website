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
      {
        title: "Water",
        type: "numeric" as const,
        targetValue: 8,
        unit: "glasses",
        description: "About 8 glasses (~64 oz). Close enough counts.",
        sortOrder: 0,
      },
      {
        // Title includes "protein" so Macros logging can auto-tally toward the target
        title: "Protein",
        type: "numeric" as const,
        targetValue: 100,
        unit: "g",
        description:
          "Default goal: 100g/day (a solid midlife starting point). Log meals in Macros or type your total here. Your coach may set a different number.",
        sortOrder: 1,
      },
      {
        title: "Move 10+ minutes",
        type: "boolean" as const,
        description: "Walk, strength, or exercise snacks — anything that gets you moving.",
        sortOrder: 2,
      },
      {
        title: "Write 3 wins",
        type: "boolean" as const,
        description: "Victory list before bed — what went right today?",
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "craving-week",
    title: "Craving Week",
    description: "Patterns for nighttime and stress cravings.",
    isDefault: false,
    sortOrder: 1,
    items: [
      {
        title: "Protein at dinner",
        type: "boolean" as const,
        description: "Palm-sized protein on the plate — steadies evening cravings.",
        sortOrder: 0,
      },
      {
        title: "Pause before pantry",
        type: "boolean" as const,
        description: "One breath: who is driving — future you or craving you?",
        sortOrder: 1,
      },
      {
        title: "Evening walk or stretch",
        type: "boolean" as const,
        description: "5–15 minutes. Movement instead of the kitchen loop.",
        sortOrder: 2,
      },
      {
        title: "No kitchen after wind-down",
        type: "boolean" as const,
        description: "Kitchen closed after your evening wind-down starts.",
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "energy-week",
    title: "Energy Week",
    description: "Exercise snacks, sleep, and steady fuel after 40.",
    isDefault: false,
    sortOrder: 2,
    items: [
      {
        title: "Exercise snacks",
        type: "numeric" as const,
        targetValue: 3,
        unit: "snacks",
        description: "2–3 minute movement bursts (stairs, squats, walk). Aim for 3 today.",
        sortOrder: 0,
      },
      {
        title: "Morning light / walk",
        type: "boolean" as const,
        description: "Daylight + a short walk if you can — helps energy and sleep.",
        sortOrder: 1,
      },
      {
        title: "Screens off before bed",
        type: "boolean" as const,
        description: "Screens down ~30–60 min before sleep.",
        sortOrder: 2,
      },
      {
        title: "Balanced breakfast",
        type: "boolean" as const,
        description: "Protein + fiber/fat — not coffee alone.",
        sortOrder: 3,
      },
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
