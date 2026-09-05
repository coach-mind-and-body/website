import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { calorieLogs, userHabits, userHabitLogs } from "../../drizzle/schema";
import { creditChallengeDayFromActivity } from "../realFoodResetChallenge";
import { eq, and, desc, like } from "drizzle-orm";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { TRPCError } from "@trpc/server";

/** Soft guest AI limits: deviceId → { day, count } (in-process; resets on deploy) */
const guestAiUsage = new Map<string, { day: string; count: number }>();
const GUEST_AI_DAILY_LIMIT = 8;

function checkGuestAiLimit(deviceId: string | undefined, day: string) {
  if (!deviceId || deviceId.length < 8) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Device id required for guest AI estimates.",
    });
  }
  const key = deviceId.slice(0, 64);
  const cur = guestAiUsage.get(key);
  if (!cur || cur.day !== day) {
    guestAiUsage.set(key, { day, count: 1 });
    return;
  }
  if (cur.count >= GUEST_AI_DAILY_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Guest AI limit reached (${GUEST_AI_DAILY_LIMIT}/day). Sign in for unlimited estimates.`,
    });
  }
  cur.count += 1;
}

// Helper function to sync daily protein and fiber to the habit tracker
async function syncMacrosToHabits(db: any, userId: number, dateStr: string) {
  // 1. Calculate totals for the day
  const logs = await db.select().from(calorieLogs)
    .where(and(eq(calorieLogs.userId, userId), eq(calorieLogs.dateStr, dateStr)));
  
  let totalProtein = 0;
  let totalFiber = 0;
  for (const log of logs) {
    totalProtein += log.protein || 0;
    totalFiber += log.fiber || 0;
  }

  // 2. Find matching user habits
  const habits = await db.select().from(userHabits).where(eq(userHabits.userId, userId));
  const proteinHabit = habits.find((h: any) => h.title.toLowerCase().includes("protein") && h.type === "numeric");
  const fiberHabit = habits.find((h: any) => h.title.toLowerCase().includes("fiber") && h.type === "numeric");

  // 3. Update or insert habit logs
  const updateHabitLog = async (habit: { id: number; targetValue: number | null }, value: number) => {
    const target = habit.targetValue ?? 0;
    const completed = value >= target;
    const existing = await db.select().from(userHabitLogs)
      .where(and(
        eq(userHabitLogs.userId, userId),
        eq(userHabitLogs.userHabitId, habit.id),
        eq(userHabitLogs.dateStr, dateStr)
      )).limit(1);

    if (existing.length > 0) {
      await db.update(userHabitLogs)
        .set({ numericValue: value, completed })
        .where(eq(userHabitLogs.id, existing[0].id));
    } else {
      await db.insert(userHabitLogs).values({
        userId,
        userHabitId: habit.id,
        dateStr,
        numericValue: value,
        completed,
      });
    }
  };

  if (proteinHabit) await updateHabitLog(proteinHabit, totalProtein);
  if (fiberHabit) await updateHabitLog(fiberHabit, totalFiber);
}

export const caloriesRouter = router({
  getLogs: protectedProcedure
    .input(z.object({
      dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const logs = await db.select().from(calorieLogs)
        .where(and(
          eq(calorieLogs.userId, ctx.user.id),
          eq(calorieLogs.dateStr, input.dateStr)
        ))
        .orderBy(desc(calorieLogs.createdAt));
        
      return logs;
    }),

  addLog: protectedProcedure
    .input(z.object({
      dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "drink"]),
      foodName: z.string().min(1),
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
      fiber: z.number().min(0),
      imageUrl: z.string().optional(),
      recipeId: z.number().optional(),
      servings: z.number().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(calorieLogs).values({
        userId: ctx.user.id,
        ...input,
      });
      
      await syncMacrosToHabits(db, ctx.user.id, input.dateStr);
      await creditChallengeDayFromActivity({
        userId: ctx.user.id,
        email: ctx.user.email ?? null,
        dateStr: input.dateStr,
      });

      return { success: true };
    }),

  updateLog: protectedProcedure
    .input(z.object({
      id: z.number(),
      dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "drink"]),
      foodName: z.string().min(1),
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
      fiber: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      
      await db.update(calorieLogs)
        .set(updateData)
        .where(and(eq(calorieLogs.id, id), eq(calorieLogs.userId, ctx.user.id)));
        
      await syncMacrosToHabits(db, ctx.user.id, input.dateStr);

      return { success: true };
    }),

  deleteLog: protectedProcedure
    .input(z.object({
      id: z.number(),
      dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Added dateStr to easily re-sync
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(calorieLogs).where(
        and(
          eq(calorieLogs.id, input.id),
          eq(calorieLogs.userId, ctx.user.id)
        )
      );
      
      await syncMacrosToHabits(db, ctx.user.id, input.dateStr);

      return { success: true };
    }),

  /** Import guest localStorage meal logs after sign-in */
  importGuestLogs: protectedProcedure
    .input(
      z.object({
        logs: z
          .array(
            z.object({
              dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
              mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "drink"]),
              foodName: z.string().min(1),
              calories: z.number().min(0),
              protein: z.number().min(0),
              carbs: z.number().min(0),
              fat: z.number().min(0),
              fiber: z.number().min(0),
            })
          )
          .max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.logs.length === 0) return { imported: 0 };

      const dates = new Set<string>();
      for (const log of input.logs) {
        await db.insert(calorieLogs).values({
          userId: ctx.user.id,
          ...log,
        });
        dates.add(log.dateStr);
      }
      for (const d of dates) {
        await syncMacrosToHabits(db, ctx.user.id, d);
        await creditChallengeDayFromActivity({
          userId: ctx.user.id,
          email: ctx.user.email ?? null,
          dateStr: d,
        });
      }
      return { imported: input.logs.length };
    }),

  analyzeFoodImage: publicProcedure
    .input(z.object({
      imageBase64: z.string(), // base64 string
      userHint: z.string().optional(),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        const day = new Date().toISOString().slice(0, 10);
        checkGuestAiLimit(input.deviceId, day);
      }

      const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const result = await generateObject({
        model: google("gemini-3.5-flash"),
        schema: z.object({
          foodName: z.string().describe("A descriptive name for the food identified in the image, incorporating the user's hint if provided."),
          calories: z.number().describe("Estimated total calories"),
          protein: z.number().describe("Estimated protein in grams"),
          carbs: z.number().describe("Estimated carbohydrates in grams"),
          fat: z.number().describe("Estimated fat in grams"),
          fiber: z.number().describe("Estimated fiber in grams"),
        }),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert nutritionist and calorie estimator. Analyze this image of food. ${input.userHint ? `The user provided this hint about the portion/ingredients: "${input.userHint}".` : ''} Estimate the macros and calories as accurately as possible for the entire visible portion or the portion described in the hint.`,
              },
              {
                type: "image",
                image: base64Data,
              },
            ],
          },
        ],
      });

      return result.object;
    }),

  analyzeFoodText: publicProcedure
    .input(z.object({
      foodName: z.string().min(1),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        const day = new Date().toISOString().slice(0, 10);
        checkGuestAiLimit(input.deviceId, day);
      }

      const result = await generateObject({
        model: google("gemini-3.5-flash"),
        schema: z.object({
          foodName: z.string().describe("The normalized name of the food"),
          calories: z.number().describe("Estimated total calories"),
          protein: z.number().describe("Estimated protein in grams"),
          carbs: z.number().describe("Estimated carbohydrates in grams"),
          fat: z.number().describe("Estimated fat in grams"),
          fiber: z.number().describe("Estimated fiber in grams"),
        }),
        messages: [
          {
            role: "user",
            content: `You are an expert nutritionist and calorie estimator. Estimate the macros and calories as accurately as possible for the following food item or meal: "${input.foodName}". Assume standard portions if none are provided.`,
          },
        ],
      });

      return result.object;
    }),
});
