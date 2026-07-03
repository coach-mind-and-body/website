import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { calorieLogs, userHabits, userHabitLogs } from "../../drizzle/schema";
import { eq, and, desc, like } from "drizzle-orm";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

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
  const updateHabitLog = async (habitId: number, value: number) => {
    const existing = await db.select().from(userHabitLogs)
      .where(and(
        eq(userHabitLogs.userId, userId),
        eq(userHabitLogs.userHabitId, habitId),
        eq(userHabitLogs.dateStr, dateStr)
      )).limit(1);

    if (existing.length > 0) {
      await db.update(userHabitLogs)
        .set({ numericValue: value, completed: true })
        .where(eq(userHabitLogs.id, existing[0].id));
    } else {
      await db.insert(userHabitLogs).values({
        userId,
        userHabitId: habitId,
        dateStr,
        numericValue: value,
        completed: true,
      });
    }
  };

  if (proteinHabit) await updateHabitLog(proteinHabit.id, totalProtein);
  if (fiberHabit) await updateHabitLog(fiberHabit.id, totalFiber);
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
      mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
      foodName: z.string().min(1),
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
      fiber: z.number().min(0),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(calorieLogs).values({
        userId: ctx.user.id,
        ...input,
      });
      
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

  analyzeFoodImage: protectedProcedure
    .input(z.object({
      imageBase64: z.string(), // base64 string
      userHint: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Use Gemini to analyze the image
      // Note: We strip the data:image/jpeg;base64, prefix if present
      const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const result = await generateObject({
        model: google("gemini-2.5-flash"),
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
});
