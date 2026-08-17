import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../_core/trpc";
import { getDb } from "../db";
import { storagePut } from "../storage";
import {
  mealPlanAssignments,
  mealPlans,
  mealPlanSlots,
  recipeFavorites,
  recipes,
  shoppingListItems,
  users,
} from "../../drizzle/schema";
import {
  guessAisle,
  MEAL_SLOTS,
  normalizeIngredientName,
  parseJsonArray,
  parseStringArray,
  slugifyTitle,
  type RecipeIngredient,
} from "@shared/food";
import {
  fatsecretConfigured,
  getRecipe as fatsecretGetRecipe,
  searchFoods,
  searchRecipes,
} from "../fatsecret";
import { STARTER_RECIPES } from "../foodSeed";

const mealSlotEnum = z.enum(MEAL_SLOTS);

const ingredientSchema = z.object({
  name: z.string().min(1),
  amount: z.string().optional().default(""),
  unit: z.string().optional().default(""),
  notes: z.string().optional(),
  fatsecretFoodId: z.string().optional(),
});

const stepSchema = z.object({
  text: z.string().min(1),
});

const recipeWriteSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional().nullable(),
  imageUrl: z.string().max(1000).optional().nullable(),
  source: z.enum(["coach", "fatsecret", "imported"]).optional(),
  fatsecretRecipeId: z.string().max(32).optional().nullable(),
  fatsecretFoodId: z.string().max(32).optional().nullable(),
  tags: z.array(z.string()).optional(),
  mealSlots: z.array(mealSlotEnum).optional(),
  prepMinutes: z.number().int().min(0).optional(),
  cookMinutes: z.number().int().min(0).optional(),
  servings: z.number().int().min(1).optional(),
  calories: z.number().int().min(0).optional(),
  protein: z.number().int().min(0).optional(),
  carbs: z.number().int().min(0).optional(),
  fat: z.number().int().min(0).optional(),
  fiber: z.number().int().min(0).optional(),
  ingredients: z.array(ingredientSchema).optional(),
  steps: z.array(stepSchema).optional(),
  notes: z.string().optional().nullable(),
  showNutrition: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

const slotWriteSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  slot: mealSlotEnum,
  recipeId: z.number().int(),
  servings: z.number().int().min(1).optional(),
  sortOrder: z.number().int().optional(),
  notes: z.string().max(500).optional().nullable(),
});

function requireDb() {
  return getDb().then((db) => {
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    return db;
  });
}

async function uniqueSlug(db: Awaited<ReturnType<typeof requireDb>>, title: string, excludeId?: number) {
  const base = slugifyTitle(title);
  let slug = base;
  let n = 2;
  for (;;) {
    const [existing] = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.slug, slug))
      .limit(1);
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n}`;
    n += 1;
    if (n > 80) return `${base}-${Date.now()}`;
  }
}

function hydrateRecipe<T extends { tagsJson: string | null; mealSlotsJson: string | null; ingredientsJson: string | null; stepsJson: string | null }>(
  row: T
) {
  return {
    ...row,
    tags: parseStringArray(row.tagsJson),
    mealSlots: parseStringArray(row.mealSlotsJson),
    ingredients: parseJsonArray<RecipeIngredient>(row.ingredientsJson),
    steps: parseJsonArray<{ text: string }>(row.stepsJson),
  };
}

async function favoriteIdsFor(userId: number | undefined) {
  if (!userId) return new Set<number>();
  const db = await getDb();
  if (!db) return new Set<number>();
  const rows = await db
    .select({ recipeId: recipeFavorites.recipeId })
    .from(recipeFavorites)
    .where(eq(recipeFavorites.userId, userId));
  return new Set(rows.map((r) => r.recipeId));
}

export const foodRouter = router({
  fatsecretStatus: publicProcedure.query(() => ({
    configured: fatsecretConfigured(),
  })),

  listRecipes: publicProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          tag: z.string().optional(),
          mealSlot: mealSlotEnum.optional(),
          favoritesOnly: z.boolean().optional(),
          includeDrafts: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const isAdmin = ctx.user?.role === "admin";
      const includeDrafts = Boolean(input?.includeDrafts && isAdmin);

      const conditions = [];
      if (!includeDrafts) conditions.push(eq(recipes.isPublished, true));
      if (input?.q?.trim()) {
        const q = `%${input.q.trim()}%`;
        conditions.push(or(like(recipes.title, q), like(recipes.description, q)));
      }

      const rows = await db
        .select()
        .from(recipes)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(recipes.isFeatured), desc(recipes.updatedAt));

      const favs = await favoriteIdsFor(ctx.user?.id);
      let list = rows.map((r) => ({
        ...hydrateRecipe(r),
        isFavorite: favs.has(r.id),
      }));

      if (input?.tag) {
        list = list.filter((r) => r.tags.includes(input.tag!));
      }
      if (input?.mealSlot) {
        list = list.filter((r) => r.mealSlots.includes(input.mealSlot!));
      }
      if (input?.favoritesOnly) {
        list = list.filter((r) => r.isFavorite);
      }
      return list;
    }),

  getRecipe: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const [row] = await db.select().from(recipes).where(eq(recipes.slug, input.slug)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" });
      if (!row.isPublished && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" });
      }
      const favs = await favoriteIdsFor(ctx.user?.id);
      return { ...hydrateRecipe(row), isFavorite: favs.has(row.id) };
    }),

  getRecipeById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const [row] = await db.select().from(recipes).where(eq(recipes.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" });
      if (!row.isPublished && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" });
      }
      const favs = await favoriteIdsFor(ctx.user?.id);
      return { ...hydrateRecipe(row), isFavorite: favs.has(row.id) };
    }),

  adminCreateRecipe: adminProcedure.input(recipeWriteSchema).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const slug = await uniqueSlug(db, input.title);
    const [inserted] = await db
      .insert(recipes)
      .values({
        slug,
        title: input.title,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        source: input.source ?? "coach",
        fatsecretRecipeId: input.fatsecretRecipeId ?? null,
        fatsecretFoodId: input.fatsecretFoodId ?? null,
        tagsJson: JSON.stringify(input.tags ?? []),
        mealSlotsJson: JSON.stringify(input.mealSlots ?? []),
        prepMinutes: input.prepMinutes ?? 0,
        cookMinutes: input.cookMinutes ?? 0,
        servings: input.servings ?? 1,
        calories: input.calories ?? 0,
        protein: input.protein ?? 0,
        carbs: input.carbs ?? 0,
        fat: input.fat ?? 0,
        fiber: input.fiber ?? 0,
        ingredientsJson: JSON.stringify(input.ingredients ?? []),
        stepsJson: JSON.stringify(input.steps ?? []),
        notes: input.notes ?? null,
        showNutrition: input.showNutrition ?? true,
        isPublished: input.isPublished ?? false,
        isFeatured: input.isFeatured ?? false,
        createdByUserId: ctx.user.id,
      })
      .$returningId();
    return { id: inserted.id, slug };
  }),

  adminUpdateRecipe: adminProcedure
    .input(recipeWriteSchema.extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [existing] = await db.select().from(recipes).where(eq(recipes.id, input.id)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" });
      const slug =
        input.title !== existing.title ? await uniqueSlug(db, input.title, input.id) : existing.slug;
      await db
        .update(recipes)
        .set({
          slug,
          title: input.title,
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
          source: input.source ?? existing.source,
          fatsecretRecipeId: input.fatsecretRecipeId ?? existing.fatsecretRecipeId,
          fatsecretFoodId: input.fatsecretFoodId ?? existing.fatsecretFoodId,
          tagsJson: JSON.stringify(input.tags ?? parseStringArray(existing.tagsJson)),
          mealSlotsJson: JSON.stringify(input.mealSlots ?? parseStringArray(existing.mealSlotsJson)),
          prepMinutes: input.prepMinutes ?? existing.prepMinutes,
          cookMinutes: input.cookMinutes ?? existing.cookMinutes,
          servings: input.servings ?? existing.servings,
          calories: input.calories ?? existing.calories,
          protein: input.protein ?? existing.protein,
          carbs: input.carbs ?? existing.carbs,
          fat: input.fat ?? existing.fat,
          fiber: input.fiber ?? existing.fiber,
          ingredientsJson: JSON.stringify(
            input.ingredients ?? parseJsonArray(existing.ingredientsJson)
          ),
          stepsJson: JSON.stringify(input.steps ?? parseJsonArray(existing.stepsJson)),
          notes: input.notes ?? existing.notes,
          showNutrition: input.showNutrition ?? existing.showNutrition,
          isPublished: input.isPublished ?? existing.isPublished,
          isFeatured: input.isFeatured ?? existing.isFeatured,
        })
        .where(eq(recipes.id, input.id));
      return { id: input.id, slug };
    }),

  adminDeleteRecipe: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await requireDb();
    await db.delete(mealPlanSlots).where(eq(mealPlanSlots.recipeId, input.id));
    await db.delete(recipeFavorites).where(eq(recipeFavorites.recipeId, input.id));
    await db.delete(recipes).where(eq(recipes.id, input.id));
    return { success: true };
  }),

  adminDuplicateRecipe: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [row] = await db.select().from(recipes).where(eq(recipes.id, input.id)).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" });
    const title = `${row.title} (copy)`;
    const slug = await uniqueSlug(db, title);
    const [inserted] = await db
      .insert(recipes)
      .values({
        slug,
        title,
        description: row.description,
        imageUrl: row.imageUrl,
        source: row.source === "fatsecret" ? "imported" : row.source,
        fatsecretRecipeId: null,
        fatsecretFoodId: row.fatsecretFoodId,
        tagsJson: row.tagsJson,
        mealSlotsJson: row.mealSlotsJson,
        prepMinutes: row.prepMinutes,
        cookMinutes: row.cookMinutes,
        servings: row.servings,
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        fiber: row.fiber,
        ingredientsJson: row.ingredientsJson,
        stepsJson: row.stepsJson,
        notes: row.notes,
        showNutrition: row.showNutrition,
        isPublished: false,
        isFeatured: false,
        createdByUserId: ctx.user.id,
      })
      .$returningId();
    return { id: inserted.id, slug };
  }),

  adminUploadImage: adminProcedure
    .input(
      z.object({
        fileName: z.string(),
        mimeType: z.string(),
        base64Data: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64Data, "base64");
      if (buffer.length > 8 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be under 8MB" });
      }
      const ext = input.fileName.split(".").pop()?.toLowerCase() || "jpg";
      const key = `recipes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  adminSeedStarters: adminProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    let created = 0;
    for (const r of STARTER_RECIPES) {
      const [existing] = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.slug, r.slug)).limit(1);
      if (existing) continue;
      await db.insert(recipes).values({
        slug: r.slug,
        title: r.title,
        description: r.description,
        imageUrl: r.imageUrl,
        source: "coach",
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
        showNutrition: true,
        isPublished: true,
        isFeatured: created < 3,
        createdByUserId: ctx.user.id,
      });
      created += 1;
    }
    return { created };
  }),

  fatsecretSearchRecipes: adminProcedure
    .input(z.object({ q: z.string().min(1), page: z.number().int().min(0).optional() }))
    .query(async ({ input }) => searchRecipes(input.q, input.page ?? 0)),

  fatsecretGetRecipe: adminProcedure
    .input(z.object({ recipeId: z.string().min(1) }))
    .query(async ({ input }) => fatsecretGetRecipe(input.recipeId)),

  fatsecretImportRecipe: adminProcedure
    .input(
      z.object({
        recipeId: z.string().min(1),
        publish: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [dup] = await db
        .select({ id: recipes.id, slug: recipes.slug })
        .from(recipes)
        .where(eq(recipes.fatsecretRecipeId, input.recipeId))
        .limit(1);
      if (dup) return { id: dup.id, slug: dup.slug, already: true as const };

      const detail = await fatsecretGetRecipe(input.recipeId);
      const slug = await uniqueSlug(db, detail.name);
      const mealSlots = detail.types
        .map((t) => t.toLowerCase())
        .flatMap((t) => {
          if (t.includes("breakfast")) return ["breakfast" as const];
          if (t.includes("lunch")) return ["lunch" as const];
          if (t.includes("dinner") || t.includes("main")) return ["dinner" as const];
          if (t.includes("snack") || t.includes("dessert")) return ["snack" as const];
          return [];
        });
      const [inserted] = await db
        .insert(recipes)
        .values({
          slug,
          title: detail.name,
          description: detail.description,
          imageUrl: detail.imageUrl,
          source: "fatsecret",
          fatsecretRecipeId: detail.recipeId,
          tagsJson: JSON.stringify(
            detail.types.map((t) => t.toLowerCase().replace(/\s+/g, "-"))
          ),
          mealSlotsJson: JSON.stringify(mealSlots.length ? mealSlots : ["dinner"]),
          prepMinutes: detail.prepMinutes,
          cookMinutes: detail.cookMinutes,
          servings: detail.servings,
          calories: detail.calories,
          protein: detail.protein,
          carbs: detail.carbs,
          fat: detail.fat,
          fiber: detail.fiber,
          ingredientsJson: JSON.stringify(detail.ingredientsDetailed),
          stepsJson: JSON.stringify(detail.steps),
          showNutrition: true,
          isPublished: input.publish ?? false,
          createdByUserId: ctx.user.id,
        })
        .$returningId();
      return { id: inserted.id, slug, already: false as const };
    }),

  fatsecretSearchFoods: publicProcedure
    .input(z.object({ q: z.string().min(1), page: z.number().int().min(0).optional() }))
    .query(async ({ input }) => {
      if (!fatsecretConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "FatSecret is not configured on this server.",
        });
      }
      return searchFoods(input.q, input.page ?? 0);
    }),

  listMealPlans: publicProcedure
    .input(z.object({ includeDrafts: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const isAdmin = ctx.user?.role === "admin";
      const includeDrafts = Boolean(input?.includeDrafts && isAdmin);
      const rows = await db
        .select()
        .from(mealPlans)
        .where(includeDrafts ? undefined : eq(mealPlans.isPublished, true))
        .orderBy(desc(mealPlans.isFeatured), desc(mealPlans.updatedAt));
      return rows.map((p) => ({ ...p, tags: parseStringArray(p.tagsJson) }));
    }),

  getMealPlan: publicProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [plan] = await db.select().from(mealPlans).where(eq(mealPlans.id, input.id)).limit(1);
    if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Meal plan not found" });
    if (!plan.isPublished && ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Meal plan not found" });
    }
    const slots = await db
      .select()
      .from(mealPlanSlots)
      .where(eq(mealPlanSlots.mealPlanId, plan.id))
      .orderBy(mealPlanSlots.dayOfWeek, mealPlanSlots.sortOrder);
    const recipeIds = [...new Set(slots.map((s) => s.recipeId))];
    const recipeRows =
      recipeIds.length === 0
        ? []
        : await db
            .select()
            .from(recipes)
            .where(
              sql`${recipes.id} IN (${sql.join(
                recipeIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            );
    const recipeMap = Object.fromEntries(recipeRows.map((r) => [r.id, hydrateRecipe(r)]));
    return {
      ...plan,
      tags: parseStringArray(plan.tagsJson),
      slots: slots.map((s) => ({
        ...s,
        recipe: recipeMap[s.recipeId] ?? null,
      })),
    };
  }),

  getMyMealPlan: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [assignment] = await db
      .select()
      .from(mealPlanAssignments)
      .where(eq(mealPlanAssignments.userId, ctx.user.id))
      .orderBy(desc(mealPlanAssignments.createdAt))
      .limit(1);

    let planId = assignment?.mealPlanId;
    if (!planId) {
      const [featured] = await db
        .select()
        .from(mealPlans)
        .where(and(eq(mealPlans.isPublished, true), eq(mealPlans.isFeatured, true)))
        .limit(1);
      planId = featured?.id;
    }
    if (!planId) {
      const [any] = await db
        .select()
        .from(mealPlans)
        .where(eq(mealPlans.isPublished, true))
        .orderBy(desc(mealPlans.updatedAt))
        .limit(1);
      planId = any?.id;
    }
    if (!planId) return null;

    const [plan] = await db.select().from(mealPlans).where(eq(mealPlans.id, planId)).limit(1);
    if (!plan) return null;
    const slots = await db
      .select()
      .from(mealPlanSlots)
      .where(eq(mealPlanSlots.mealPlanId, plan.id))
      .orderBy(mealPlanSlots.dayOfWeek, mealPlanSlots.sortOrder);
    const recipeIds = [...new Set(slots.map((s) => s.recipeId))];
    const recipeRows =
      recipeIds.length === 0
        ? []
        : await db
            .select()
            .from(recipes)
            .where(
              sql`${recipes.id} IN (${sql.join(
                recipeIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            );
    const recipeMap = Object.fromEntries(recipeRows.map((r) => [r.id, hydrateRecipe(r)]));
    return {
      ...plan,
      tags: parseStringArray(plan.tagsJson),
      assigned: Boolean(assignment),
      assignment,
      slots: slots.map((s) => ({
        ...s,
        recipe: recipeMap[s.recipeId] ?? null,
      })),
    };
  }),

  adminCreateMealPlan: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        tags: z.array(z.string()).optional(),
        servingsDefault: z.number().int().min(1).optional(),
        showNutrition: z.boolean().optional(),
        isPublished: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      if (input.isFeatured) {
        await db.update(mealPlans).set({ isFeatured: false });
      }
      const [inserted] = await db
        .insert(mealPlans)
        .values({
          title: input.title,
          description: input.description ?? null,
          notes: input.notes ?? null,
          tagsJson: JSON.stringify(input.tags ?? []),
          servingsDefault: input.servingsDefault ?? 1,
          showNutrition: input.showNutrition ?? true,
          isPublished: input.isPublished ?? false,
          isFeatured: input.isFeatured ?? false,
          createdByUserId: ctx.user.id,
        })
        .$returningId();
      return { id: inserted.id };
    }),

  adminUpdateMealPlan: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        tags: z.array(z.string()).optional(),
        servingsDefault: z.number().int().min(1).optional(),
        showNutrition: z.boolean().optional(),
        isPublished: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      if (input.isFeatured) {
        await db.update(mealPlans).set({ isFeatured: false });
      }
      await db
        .update(mealPlans)
        .set({
          title: input.title,
          description: input.description ?? null,
          notes: input.notes ?? null,
          tagsJson: JSON.stringify(input.tags ?? []),
          servingsDefault: input.servingsDefault,
          showNutrition: input.showNutrition,
          isPublished: input.isPublished,
          isFeatured: input.isFeatured,
        })
        .where(eq(mealPlans.id, input.id));
      return { success: true };
    }),

  adminDeleteMealPlan: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await requireDb();
    await db.delete(mealPlanSlots).where(eq(mealPlanSlots.mealPlanId, input.id));
    await db.delete(mealPlanAssignments).where(eq(mealPlanAssignments.mealPlanId, input.id));
    await db.delete(shoppingListItems).where(eq(shoppingListItems.mealPlanId, input.id));
    await db.delete(mealPlans).where(eq(mealPlans.id, input.id));
    return { success: true };
  }),

  adminDuplicateMealPlan: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [plan] = await db.select().from(mealPlans).where(eq(mealPlans.id, input.id)).limit(1);
    if (!plan) throw new TRPCError({ code: "NOT_FOUND" });
    const slots = await db.select().from(mealPlanSlots).where(eq(mealPlanSlots.mealPlanId, input.id));
    const [inserted] = await db
      .insert(mealPlans)
      .values({
        title: `${plan.title} (copy)`,
        description: plan.description,
        notes: plan.notes,
        tagsJson: plan.tagsJson,
        servingsDefault: plan.servingsDefault,
        showNutrition: plan.showNutrition,
        isPublished: false,
        isFeatured: false,
        createdByUserId: ctx.user.id,
      })
      .$returningId();
    if (slots.length) {
      await db.insert(mealPlanSlots).values(
        slots.map((s) => ({
          mealPlanId: inserted.id,
          dayOfWeek: s.dayOfWeek,
          slot: s.slot,
          recipeId: s.recipeId,
          servings: s.servings,
          sortOrder: s.sortOrder,
          notes: s.notes,
        }))
      );
    }
    return { id: inserted.id };
  }),

  adminSetSlots: adminProcedure
    .input(z.object({ mealPlanId: z.number(), slots: z.array(slotWriteSchema) }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      await db.delete(mealPlanSlots).where(eq(mealPlanSlots.mealPlanId, input.mealPlanId));
      if (input.slots.length) {
        await db.insert(mealPlanSlots).values(
          input.slots.map((s, i) => ({
            mealPlanId: input.mealPlanId,
            dayOfWeek: s.dayOfWeek,
            slot: s.slot,
            recipeId: s.recipeId,
            servings: s.servings ?? 1,
            sortOrder: s.sortOrder ?? i,
            notes: s.notes ?? null,
          }))
        );
      }
      return { success: true, count: input.slots.length };
    }),

  adminSearchClients: adminProcedure
    .input(z.object({ q: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const q = input.q?.trim();
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(
          q
            ? or(like(users.name, `%${q}%`), like(users.email, `%${q}%`))
            : undefined
        )
        .orderBy(desc(users.lastSignedIn))
        .limit(40);
      return rows;
    }),

  adminListAssignments: adminProcedure
    .input(z.object({ mealPlanId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await requireDb();
      const rows = await db
        .select({
          id: mealPlanAssignments.id,
          mealPlanId: mealPlanAssignments.mealPlanId,
          userId: mealPlanAssignments.userId,
          startDate: mealPlanAssignments.startDate,
          notes: mealPlanAssignments.notes,
          createdAt: mealPlanAssignments.createdAt,
          clientName: users.name,
          clientEmail: users.email,
          planTitle: mealPlans.title,
        })
        .from(mealPlanAssignments)
        .leftJoin(users, eq(mealPlanAssignments.userId, users.id))
        .leftJoin(mealPlans, eq(mealPlanAssignments.mealPlanId, mealPlans.id))
        .where(input?.mealPlanId ? eq(mealPlanAssignments.mealPlanId, input.mealPlanId) : undefined)
        .orderBy(desc(mealPlanAssignments.createdAt));
      return rows;
    }),

  adminAssign: adminProcedure
    .input(
      z.object({
        mealPlanId: z.number(),
        userId: z.number(),
        startDate: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      await db
        .delete(mealPlanAssignments)
        .where(eq(mealPlanAssignments.userId, input.userId));
      const [inserted] = await db
        .insert(mealPlanAssignments)
        .values({
          mealPlanId: input.mealPlanId,
          userId: input.userId,
          startDate: input.startDate ?? null,
          notes: input.notes ?? null,
        })
        .$returningId();
      return { id: inserted.id };
    }),

  adminUnassign: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await requireDb();
    await db.delete(mealPlanAssignments).where(eq(mealPlanAssignments.id, input.id));
    return { success: true };
  }),

  toggleFavorite: protectedProcedure
    .input(z.object({ recipeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [existing] = await db
        .select()
        .from(recipeFavorites)
        .where(
          and(eq(recipeFavorites.userId, ctx.user.id), eq(recipeFavorites.recipeId, input.recipeId))
        )
        .limit(1);
      if (existing) {
        await db.delete(recipeFavorites).where(eq(recipeFavorites.id, existing.id));
        return { favorited: false };
      }
      await db.insert(recipeFavorites).values({
        userId: ctx.user.id,
        recipeId: input.recipeId,
      });
      return { favorited: true };
    }),

  getShoppingList: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const items = await db
      .select()
      .from(shoppingListItems)
      .where(eq(shoppingListItems.userId, ctx.user.id))
      .orderBy(shoppingListItems.aisle, shoppingListItems.name);
    return items;
  }),

  regenerateShoppingList: protectedProcedure
    .input(z.object({ mealPlanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const slots = await db
        .select()
        .from(mealPlanSlots)
        .where(eq(mealPlanSlots.mealPlanId, input.mealPlanId));
      const recipeIds = [...new Set(slots.map((s) => s.recipeId))];
      const recipeRows =
        recipeIds.length === 0
          ? []
          : await db
              .select()
              .from(recipes)
              .where(
                sql`${recipes.id} IN (${sql.join(
                  recipeIds.map((id) => sql`${id}`),
                  sql`, `
                )})`
              );
      const recipeMap = Object.fromEntries(recipeRows.map((r) => [r.id, r]));

      const merged = new Map<
        string,
        { name: string; amount: string; unit: string; aisle: string }
      >();
      for (const slot of slots) {
        const rec = recipeMap[slot.recipeId];
        if (!rec) continue;
        const scale = rec.servings > 0 ? slot.servings / rec.servings : 1;
        const ingredients = parseJsonArray<RecipeIngredient>(rec.ingredientsJson);
        for (const ing of ingredients) {
          const key = normalizeIngredientName(ing.name);
          if (!key) continue;
          const existing = merged.get(key);
          const amtNum = parseFloat(String(ing.amount || "").replace(/[^\d.]/g, ""));
          if (existing && Number.isFinite(amtNum) && existing.unit === (ing.unit || "")) {
            const prev = parseFloat(existing.amount) || 0;
            existing.amount = String(Math.round((prev + amtNum * scale) * 100) / 100);
          } else if (!existing) {
            merged.set(key, {
              name: ing.name,
              amount: Number.isFinite(amtNum) ? String(Math.round(amtNum * scale * 100) / 100) : ing.amount || "",
              unit: ing.unit || "",
              aisle: guessAisle(ing.name),
            });
          }
        }
      }

      const previous = await db
        .select()
        .from(shoppingListItems)
        .where(
          and(
            eq(shoppingListItems.userId, ctx.user.id),
            eq(shoppingListItems.source, "plan")
          )
        );
      const checked = new Set(
        previous
          .filter((p) => p.isChecked)
          .map((p) => normalizeIngredientName(p.name))
      );
      await db
        .delete(shoppingListItems)
        .where(
          and(
            eq(shoppingListItems.userId, ctx.user.id),
            eq(shoppingListItems.source, "plan")
          )
        );

      const values = [...merged.values()].map((item) => ({
        userId: ctx.user.id,
        mealPlanId: input.mealPlanId,
        name: item.name,
        amount: item.amount || null,
        unit: item.unit || null,
        aisle: item.aisle,
        isChecked: checked.has(normalizeIngredientName(item.name)),
        source: "plan" as const,
      }));
      if (values.length) await db.insert(shoppingListItems).values(values);
      return { count: values.length };
    }),

  setShoppingChecked: protectedProcedure
    .input(z.object({ id: z.number(), checked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db
        .update(shoppingListItems)
        .set({ isChecked: input.checked })
        .where(and(eq(shoppingListItems.id, input.id), eq(shoppingListItems.userId, ctx.user.id)));
      return { success: true };
    }),

  addShoppingItem: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        amount: z.string().optional(),
        unit: z.string().optional(),
        aisle: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [inserted] = await db
        .insert(shoppingListItems)
        .values({
          userId: ctx.user.id,
          name: input.name,
          amount: input.amount ?? null,
          unit: input.unit ?? null,
          aisle: input.aisle || guessAisle(input.name),
          source: "custom",
        })
        .$returningId();
      return { id: inserted.id };
    }),

  removeShoppingItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db
        .delete(shoppingListItems)
        .where(and(eq(shoppingListItems.id, input.id), eq(shoppingListItems.userId, ctx.user.id)));
      return { success: true };
    }),

  clearCheckedShopping: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    await db
      .delete(shoppingListItems)
      .where(and(eq(shoppingListItems.userId, ctx.user.id), eq(shoppingListItems.isChecked, true)));
    return { success: true };
  }),
});
