import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { habitTemplates, userHabits, userHabitLogs } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const habitRouter = router({
  // --- Public: Get default templates for unauthenticated tracking ---
  getTemplates: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(habitTemplates).where(eq(habitTemplates.isActive, true)).orderBy(habitTemplates.order);
  }),

  // --- Protected: User Syncing ---
  getUserHabits: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { habits: [], logs: [] };

    const habits = await db.select().from(userHabits).where(eq(userHabits.userId, ctx.user.id)).orderBy(userHabits.order);
    const logs = await db.select().from(userHabitLogs).where(eq(userHabitLogs.userId, ctx.user.id));
    
    return { habits, logs };
  }),

  syncHabit: protectedProcedure
    .input(z.object({
      id: z.number().optional(), // If provided, update. Otherwise insert.
      title: z.string(),
      description: z.string().optional(),
      order: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      if (input.id) {
        // Update existing
        await db.update(userHabits)
          .set({
            title: input.title,
            description: input.description,
            order: input.order,
            isActive: input.isActive,
          })
          .where(and(eq(userHabits.id, input.id), eq(userHabits.userId, ctx.user.id)));
        return { id: input.id };
      } else {
        // Insert new
        const [result] = await db.insert(userHabits).values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          order: input.order,
          isActive: input.isActive,
        });
        return { id: result.insertId };
      }
    }),

  toggleLog: protectedProcedure
    .input(z.object({
      userHabitId: z.number(),
      dateStr: z.string(), // YYYY-MM-DD
      completed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      // Check if log exists
      const existing = await db.select().from(userHabitLogs)
        .where(
          and(
            eq(userHabitLogs.userId, ctx.user.id),
            eq(userHabitLogs.userHabitId, input.userHabitId),
            eq(userHabitLogs.dateStr, input.dateStr)
          )
        ).limit(1);

      if (existing.length > 0) {
        await db.update(userHabitLogs)
          .set({ completed: input.completed })
          .where(eq(userHabitLogs.id, existing[0].id));
      } else {
        await db.insert(userHabitLogs).values({
          userId: ctx.user.id,
          userHabitId: input.userHabitId,
          dateStr: input.dateStr,
          completed: input.completed,
        });
      }
      return { success: true };
    }),

  // --- Admin: Manage Templates ---
  adminGetTemplates: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(habitTemplates).orderBy(habitTemplates.order);
  }),

  adminCreateTemplate: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      order: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      await db.insert(habitTemplates).values({
        title: input.title,
        description: input.description,
        order: input.order,
        isActive: true,
      });
      return { success: true };
    }),

  adminUpdateTemplate: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string(),
      description: z.string().optional(),
      order: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      await db.update(habitTemplates)
        .set({
          title: input.title,
          description: input.description,
          order: input.order,
          isActive: input.isActive,
        })
        .where(eq(habitTemplates.id, input.id));
      return { success: true };
    }),

  adminDeleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      await db.delete(habitTemplates).where(eq(habitTemplates.id, input.id));
      return { success: true };
    }),
});
