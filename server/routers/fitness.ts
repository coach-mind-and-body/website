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

  // 2. Find movement-related habits (midlife packs use "Move 10+ minutes", "walk", etc.)
  const habits = await db.select().from(userHabits).where(eq(userHabits.userId, userId));
  const isMoveHabit = (title: string) => {
    const t = title.toLowerCase();
    return (
      t.includes("move") ||
      t.includes("exercise") ||
      t.includes("workout") ||
      t.includes("walk") ||
      t.includes("fitness") ||
      t.includes("strength") ||
      t.includes("stretch") ||
      t.includes("yoga") ||
      t.includes("cardio") ||
      /10\s*\+?\s*min/.test(t)
    );
  };
  // Sync all matching movement habits (e.g. "Move 10+ minutes")
  const moveHabits = habits.filter(
    (h: any) => h.isActive !== false && isMoveHabit(h.title || "")
  );

  for (const moveHabit of moveHabits) {
    const existing = await db
      .select()
      .from(userHabitLogs)
      .where(
        and(
          eq(userHabitLogs.userId, userId),
          eq(userHabitLogs.userHabitId, moveHabit.id),
          eq(userHabitLogs.dateStr, dateStr)
        )
      )
      .limit(1);

    // Numeric: store minutes or log-count; boolean: any movement = complete
    const numericValue =
      moveHabit.type === "numeric"
        ? Math.max(totalDuration || 0, hasExercise ? logs.length : 0)
        : totalDuration > 0
          ? totalDuration
          : null;

    if (existing.length > 0) {
      await db
        .update(userHabitLogs)
        .set({
          completed: hasExercise,
          numericValue,
        })
        .where(eq(userHabitLogs.id, existing[0].id));
    } else if (hasExercise) {
      await db.insert(userHabitLogs).values({
        userId,
        userHabitId: moveHabit.id,
        dateStr,
        completed: true,
        numericValue,
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
      sets: z.number().min(0).default(1),
      reps: z.number().min(0).default(0),
      weight: z.number().min(0).default(0),
      durationMinutes: z.number().min(0).default(0),
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

  /** Import guest localStorage fitness logs after sign-in */
  importGuestLogs: protectedProcedure
    .input(
      z.object({
        logs: z.array(
          z.object({
            dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            exerciseName: z.string().min(1),
            sets: z.number().min(0).default(1),
            reps: z.number().min(0).default(0),
            weight: z.number().min(0).default(0),
            durationMinutes: z.number().min(0).default(0),
          })
        ).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.logs.length === 0) return { imported: 0 };

      const dates = new Set<string>();
      for (const log of input.logs) {
        await db.insert(fitnessLogs).values({
          userId: ctx.user.id,
          dateStr: log.dateStr,
          exerciseName: log.exerciseName,
          sets: log.sets || 1,
          reps: log.reps || 0,
          weight: log.weight || 0,
          durationMinutes: log.durationMinutes || 0,
        });
        dates.add(log.dateStr);
      }
      for (const d of dates) {
        await syncFitnessToHabits(db, ctx.user.id, d);
      }
      return { imported: input.logs.length };
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
