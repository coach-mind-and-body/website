import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { fitnessLogs, workoutVideos } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

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
      
      return { success: true };
    }),

  deleteLog: protectedProcedure
    .input(z.object({
      id: z.number(),
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
      return { success: true };
    }),

  // --- Workout Videos ---
  getVideos: protectedProcedure
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
      order: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(workoutVideos).values({
        ...input,
        description: input.description || null,
      });
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
