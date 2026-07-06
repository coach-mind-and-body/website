import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { habitTemplates, userHabits, userHabitLogs, userDailyNotes, users } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

export const habitRouter = router({
  // --- Public: Get default templates for unauthenticated tracking ---
  getTemplates: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(habitTemplates).where(eq(habitTemplates.isActive, true)).orderBy(habitTemplates.order);
  }),

  // --- Protected: User Syncing ---
  getUserHabits: protectedProcedure
    .input(z.object({
      fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { habits: [], logs: [] };

    let habits = await db.select().from(userHabits)
      .where(and(eq(userHabits.userId, ctx.user.id), eq(userHabits.isActive, true)))
      .orderBy(userHabits.order);
    
    // Auto-initialize from templates if user has no habits
    if (habits.length === 0) {
      const templates = await db.select().from(habitTemplates).where(eq(habitTemplates.isActive, true)).orderBy(habitTemplates.order);
      if (templates.length > 0) {
        const newHabits = templates.map(t => ({
          userId: ctx.user.id,
          title: t.title,
          description: t.description,
          type: t.type,
          targetValue: t.targetValue,
          unit: t.unit,
          order: t.order,
          isActive: true,
        }));
        await db.insert(userHabits).values(newHabits);
        habits = await db.select().from(userHabits)
          .where(and(eq(userHabits.userId, ctx.user.id), eq(userHabits.isActive, true)))
          .orderBy(userHabits.order);
      }
    }

    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const fromDateStr = input?.fromDate ?? defaultFrom.toISOString().split("T")[0];

    const logs = await db.select().from(userHabitLogs)
      .where(and(
        eq(userHabitLogs.userId, ctx.user.id),
        gte(userHabitLogs.dateStr, fromDateStr)
      ));
    const notes = await db.select().from(userDailyNotes).where(eq(userDailyNotes.userId, ctx.user.id));
    const userRecord = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    
    return { 
      habits, 
      logs, 
      notes, 
      shareHabitsWithCoach: userRecord.length > 0 ? userRecord[0].shareHabitsWithCoach : false 
    };
  }),

  syncHabit: protectedProcedure
    .input(z.object({
      id: z.number().optional(), // If provided, update. Otherwise insert.
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(["boolean", "numeric"]).default("boolean"),
      targetValue: z.number().nullable().optional(),
      unit: z.string().nullable().optional(),
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
            type: input.type,
            targetValue: input.targetValue,
            unit: input.unit,
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
          type: input.type,
          targetValue: input.targetValue,
          unit: input.unit,
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
      numericValue: z.number().nullable().optional(),
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
          .set({ completed: input.completed, numericValue: input.numericValue })
          .where(eq(userHabitLogs.id, existing[0].id));
      } else {
        await db.insert(userHabitLogs).values({
          userId: ctx.user.id,
          userHabitId: input.userHabitId,
          dateStr: input.dateStr,
          completed: input.completed,
          numericValue: input.numericValue,
        });
      }
      return { success: true };
    }),

  saveDailyNote: protectedProcedure
    .input(z.object({
      dateStr: z.string(),
      note: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const existing = await db.select().from(userDailyNotes)
        .where(
          and(
            eq(userDailyNotes.userId, ctx.user.id),
            eq(userDailyNotes.dateStr, input.dateStr)
          )
        ).limit(1);

      if (existing.length > 0) {
        await db.update(userDailyNotes)
          .set({ note: input.note })
          .where(eq(userDailyNotes.id, existing[0].id));
      } else {
        await db.insert(userDailyNotes).values({
          userId: ctx.user.id,
          dateStr: input.dateStr,
          note: input.note,
        });
      }
      return { success: true };
    }),

  toggleShareHabits: protectedProcedure
    .input(z.object({
      share: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      await db.update(users)
        .set({ shareHabitsWithCoach: input.share })
        .where(eq(users.id, ctx.user.id));
      
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
      type: z.enum(["boolean", "numeric"]).default("boolean"),
      targetValue: z.number().nullable().optional(),
      unit: z.string().nullable().optional(),
      order: z.number().default(0),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      await db.insert(habitTemplates).values({
        title: input.title,
        description: input.description,
        type: input.type,
        targetValue: input.targetValue,
        unit: input.unit,
        order: input.order,
        isActive: input.isActive,
      });
      return { success: true };
    }),

  adminUpdateTemplate: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(["boolean", "numeric"]).default("boolean"),
      targetValue: z.number().nullable().optional(),
      unit: z.string().nullable().optional(),
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
          type: input.type,
          targetValue: input.targetValue,
          unit: input.unit,
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

  adminGetClientHabits: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const userRecord = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (userRecord.length === 0 || !userRecord[0].shareHabitsWithCoach) {
        throw new Error("User has not shared habit progress with coaches.");
      }

      const habits = await db.select().from(userHabits).where(eq(userHabits.userId, input.userId)).orderBy(userHabits.order);
      const logs = await db.select().from(userHabitLogs).where(eq(userHabitLogs.userId, input.userId));
      const notes = await db.select().from(userDailyNotes).where(eq(userDailyNotes.userId, input.userId));
      const cLogs = await db.select().from(require("../../drizzle/schema").calorieLogs).where(eq(require("../../drizzle/schema").calorieLogs.userId, input.userId));
      const fLogs = await db.select().from(require("../../drizzle/schema").fitnessLogs).where(eq(require("../../drizzle/schema").fitnessLogs.userId, input.userId));
      
      return { habits, logs, notes, calorieLogs: cLogs, fitnessLogs: fLogs };
    }),
});
