import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { calorieLogs, fitnessLogs, userHabitLogs, userHabits } from "../../drizzle/schema";
import { todayMountainDateStr } from "../../lib/mountainTime";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  QUICK_PROTEIN_CALORIES_PER_GRAM,
  QUICK_PROTEIN_GRAMS,
  QUICK_PROTEIN_NAME,
  addedAmount,
  donePatch,
  firstOpenHabitId,
  isMealMacroTitle,
  isVictoryTitle,
  pickWaterHabit,
  skipPatch,
  walkLogName,
  waterStep,
} from "../notificationCategories";
import { creditChallengeDayFromActivity } from "../realFoodResetChallenge";
import { syncMacrosToHabits } from "./calories";
import { syncFitnessToHabits } from "./fitness";

const dayInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function dayOrToday(dateStr?: string): string {
  return dateStr ?? todayMountainDateStr();
}

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}

async function ownHabits(userId: number) {
  const db = await dbOrThrow();
  const habits = await db.select().from(userHabits).where(eq(userHabits.userId, userId));
  return { db, habits: habits.filter((habit) => habit.isActive !== false) };
}

async function logFor(db: Awaited<ReturnType<typeof dbOrThrow>>, userId: number, habitId: number, dateStr: string) {
  const rows = await db
    .select()
    .from(userHabitLogs)
    .where(
      and(
        eq(userHabitLogs.userId, userId),
        eq(userHabitLogs.userHabitId, habitId),
        eq(userHabitLogs.dateStr, dateStr)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

async function writeLog(
  db: Awaited<ReturnType<typeof dbOrThrow>>,
  userId: number,
  habitId: number,
  dateStr: string,
  patch: { completed: boolean; skipped: boolean; numericValue: number | null },
  existingId: number | null
) {
  if (existingId != null) {
    await db.update(userHabitLogs).set(patch).where(eq(userHabitLogs.id, existingId));
    return;
  }
  await db.insert(userHabitLogs).values({
    userId,
    userHabitId: habitId,
    dateStr,
    completed: patch.completed,
    skipped: patch.skipped,
    numericValue: patch.numericValue,
  });
}

export const notificationActionsRouter = router({
  /** Mark today's habit done. With no id, the first open habit that isn't protein, fiber, or the victory list. */
  markHabitDone: protectedProcedure
    .input(z.object({ habitId: z.number().int().positive().optional(), dateStr: dayInput.optional() }))
    .mutation(async ({ ctx, input }) => {
      const dateStr = dayOrToday(input.dateStr);
      const { db, habits } = await ownHabits(ctx.user.id);
      const logs = await db
        .select()
        .from(userHabitLogs)
        .where(and(eq(userHabitLogs.userId, ctx.user.id), eq(userHabitLogs.dateStr, dateStr)));
      const completedIds = logs.filter((log) => log.completed).map((log) => log.userHabitId);
      const habitId =
        input.habitId ??
        firstOpenHabitId(
          habits.map((habit) => ({ id: habit.id, title: habit.title, order: habit.order ?? 0 })),
          habits.map((habit) => habit.id),
          completedIds
        );
      const habit = habits.find((row) => row.id === habitId);
      if (!habit || isMealMacroTitle(habit.title) || isVictoryTitle(habit.title)) {
        return { success: true as const, applied: false as const };
      }
      const existing = logs.find((log) => log.userHabitId === habit.id) ?? null;
      const patch = donePatch(
        { type: habit.type, targetValue: habit.targetValue },
        existing ? { numericValue: existing.numericValue } : null
      );
      await writeLog(db, ctx.user.id, habit.id, dateStr, patch, existing?.id ?? null);
      return { success: true as const, applied: true as const, habitId: habit.id };
    }),

  skipHabit: protectedProcedure
    .input(z.object({ habitId: z.number().int().positive().optional(), dateStr: dayInput.optional() }))
    .mutation(async ({ ctx, input }) => {
      const dateStr = dayOrToday(input.dateStr);
      const { db, habits } = await ownHabits(ctx.user.id);
      const logs = await db
        .select()
        .from(userHabitLogs)
        .where(and(eq(userHabitLogs.userId, ctx.user.id), eq(userHabitLogs.dateStr, dateStr)));
      const completedIds = logs.filter((log) => log.completed || log.skipped).map((log) => log.userHabitId);
      const habitId =
        input.habitId ??
        firstOpenHabitId(
          habits.map((habit) => ({ id: habit.id, title: habit.title, order: habit.order ?? 0 })),
          habits.map((habit) => habit.id),
          completedIds
        );
      const habit = habits.find((row) => row.id === habitId);
      if (!habit) return { success: true as const, applied: false as const };
      const existing = logs.find((log) => log.userHabitId === habit.id) ?? null;
      const patch = skipPatch(existing ? { numericValue: existing.numericValue } : null);
      await writeLog(db, ctx.user.id, habit.id, dateStr, patch, existing?.id ?? null);
      return { success: true as const, applied: true as const, habitId: habit.id };
    }),

  addWater: protectedProcedure
    .input(z.object({ dateStr: dayInput.optional() }))
    .mutation(async ({ ctx, input }) => {
      const dateStr = dayOrToday(input.dateStr);
      const { db, habits } = await ownHabits(ctx.user.id);
      const habit = pickWaterHabit(habits);
      if (!habit) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "There's no water habit on your list yet." });
      }
      const existing = await logFor(db, ctx.user.id, habit.id, dateStr);
      const step = waterStep(habit.unit);
      const next = addedAmount(existing?.numericValue, step, habit.targetValue);
      await writeLog(
        db,
        ctx.user.id,
        habit.id,
        dateStr,
        { completed: next.completed, skipped: false, numericValue: next.numericValue },
        existing?.id ?? null
      );
      return { success: true as const, habitId: habit.id, numericValue: next.numericValue, added: step };
    }),

  addProtein: protectedProcedure
    .input(
      z.object({
        grams: z.number().int().min(1).max(100).optional(),
        dateStr: dayInput.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dateStr = dayOrToday(input.dateStr);
      const db = await dbOrThrow();
      const grams = input.grams ?? QUICK_PROTEIN_GRAMS;
      await db.insert(calorieLogs).values({
        userId: ctx.user.id,
        dateStr,
        mealType: "snack",
        foodName: QUICK_PROTEIN_NAME,
        calories: grams * QUICK_PROTEIN_CALORIES_PER_GRAM,
        protein: grams,
        carbs: 0,
        fat: 0,
        fiber: 0,
      });
      await syncMacrosToHabits(db, ctx.user.id, dateStr);
      await creditChallengeDayFromActivity({
        userId: ctx.user.id,
        email: ctx.user.email ?? null,
        dateStr,
      });
      return { success: true as const, foodName: QUICK_PROTEIN_NAME, protein: grams };
    }),

  logWalk: protectedProcedure
    .input(
      z.object({
        minutes: z.union([z.literal(10), z.literal(20)]),
        dateStr: dayInput.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dateStr = dayOrToday(input.dateStr);
      const db = await dbOrThrow();
      const exerciseName = walkLogName(input.minutes);
      await db.insert(fitnessLogs).values({
        userId: ctx.user.id,
        dateStr,
        exerciseName,
        sets: 1,
        reps: 0,
        weight: 0,
        durationMinutes: input.minutes,
      });
      await syncFitnessToHabits(db, ctx.user.id, dateStr);
      return { success: true as const, exerciseName, minutes: input.minutes };
    }),
});
