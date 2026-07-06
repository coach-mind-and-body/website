import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { fitnessLogs, workoutVideos, userHabits, userHabitLogs, userChallenges, userChallengeLogs, challenges } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// Helper: sync fitness logs to the "Move Body" habit and any active challenges
async function syncFitnessToHabits(db: any, userId: number, dateStr: string) {
  // 1. Check if the user has ANY fitness logs for this date
  const logs = await db.select().from(fitnessLogs)
    .where(and(eq(fitnessLogs.userId, userId), eq(fitnessLogs.dateStr, dateStr)));
  
  const hasExercise = logs.length > 0;
  let totalDuration = 0;
  for (const log of logs) {
    totalDuration += log.durationMinutes || 0;
  }

  // 2. Find any habit matching "move body" or similar exercise habits
  const habits = await db.select().from(userHabits).where(eq(userHabits.userId, userId));
  const moveHabit = habits.find((h: any) =>
    h.title.toLowerCase().includes("move body") ||
    h.title.toLowerCase().includes("exercise") ||
    h.title.toLowerCase().includes("workout")
  );

  // 3. Update or insert the habit log
  if (moveHabit) {
    const existing = await db.select().from(userHabitLogs)
      .where(and(
        eq(userHabitLogs.userId, userId),
        eq(userHabitLogs.userHabitId, moveHabit.id),
        eq(userHabitLogs.dateStr, dateStr)
      )).limit(1);

    if (existing.length > 0) {
      await db.update(userHabitLogs)
        .set({ completed: hasExercise, numericValue: totalDuration > 0 ? totalDuration : null })
        .where(eq(userHabitLogs.id, existing[0].id));
    } else if (hasExercise) {
      await db.insert(userHabitLogs).values({
        userId,
        userHabitId: moveHabit.id,
        dateStr,
        completed: true,
        numericValue: totalDuration > 0 ? totalDuration : null,
      });
    }
  }

  // 4. Auto-log any active challenges for this user on this date
  const activeUserChallenges = await db.select().from(userChallenges)
    .where(and(
      eq(userChallenges.userId, userId),
      eq(userChallenges.status, "active")
    ));

  for (const uc of activeUserChallenges) {
    // Check if this challenge is fitness-related by looking at its title
    const challengeRows = await db.select().from(challenges).where(eq(challenges.id, uc.challengeId)).limit(1);
    if (challengeRows.length === 0) continue;
    const challenge = challengeRows[0];
    const isExerciseChallenge = challenge.title.toLowerCase().includes("exercise") ||
      challenge.title.toLowerCase().includes("workout") ||
      challenge.title.toLowerCase().includes("move") ||
      challenge.title.toLowerCase().includes("fitness");
    
    if (!isExerciseChallenge) continue;

    // Check if already logged for this date
    const existingChallengeLog = await db.select().from(userChallengeLogs)
      .where(and(
        eq(userChallengeLogs.userChallengeId, uc.id),
        eq(userChallengeLogs.dateStr, dateStr)
      )).limit(1);

    if (hasExercise && existingChallengeLog.length === 0) {
      await db.insert(userChallengeLogs).values({
        userChallengeId: uc.id,
        dateStr,
      });
    } else if (!hasExercise && existingChallengeLog.length > 0) {
      await db.delete(userChallengeLogs).where(eq(userChallengeLogs.id, existingChallengeLog[0].id));
    }
  }
}

export const fitnessRouter = router({
  // --- Fitness Logs ---
  getLogs: protectedProcedure
    .input(z.object({
      dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const logs = await db.select().from(fitnessLogs)
        .where(and(
          eq(fitnessLogs.userId, ctx.user.id),
          eq(fitnessLogs.dateStr, input.dateStr)
        ))
        .orderBy(desc(fitnessLogs.createdAt));
        
      return logs;
    }),

  addLog: protectedProcedure
    .input(z.object({
      dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      exerciseName: z.string().min(1),
      sets: z.number().min(1),
      reps: z.number().min(0),
      weight: z.number().min(0),
      durationMinutes: z.number().min(0),
      caloriesBurned: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(fitnessLogs).values({
        userId: ctx.user.id,
        ...input,
      });
      
      // Sync to habits & challenges
      await syncFitnessToHabits(db, ctx.user.id, input.dateStr);
      
      return { success: true };
    }),

  deleteLog: protectedProcedure
    .input(z.object({
      id: z.number(),
      dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(fitnessLogs).where(
        and(
          eq(fitnessLogs.id, input.id),
          eq(fitnessLogs.userId, ctx.user.id)
        )
      );
      
      // Re-sync to habits & challenges
      await syncFitnessToHabits(db, ctx.user.id, input.dateStr);
      
      return { success: true };
    }),

  // --- Workout Videos ---
  getVideos: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return db.select().from(workoutVideos).orderBy(desc(workoutVideos.createdAt));
    }),

  adminAddVideo: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      videoUrl: z.string().url(),
      category: z.string().min(1),
      intervalsJson: z.string().optional(),
      order: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(workoutVideos).values({
        ...input,
        description: input.description || null,
        intervalsJson: input.intervalsJson || null,
      });
      return { success: true };
    }),

  adminEditVideo: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      videoUrl: z.string().url(),
      category: z.string().min(1),
      intervalsJson: z.string().optional(),
      order: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(workoutVideos)
        .set({
          title: input.title,
          description: input.description || null,
          videoUrl: input.videoUrl,
          category: input.category,
          intervalsJson: input.intervalsJson || null,
          order: input.order,
        })
        .where(eq(workoutVideos.id, input.id));
      return { success: true };
    }),

  adminDeleteVideo: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(workoutVideos).where(eq(workoutVideos.id, input.id));
      return { success: true };
    }),
});
