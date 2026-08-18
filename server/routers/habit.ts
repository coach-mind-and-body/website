import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  habitTemplates,
  userHabits,
  userHabitLogs,
  userDailyNotes,
  users,
  userVictoryLists,
  habitNotificationPrefs,
  habitFunnelEvents,
  habitPacks,
  habitPackItems,
  habitReminderRuns,
  userChallenges,
  userChallengeLogs,
  challenges,
} from "../../drizzle/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { calculateUserHabitStats } from "../habitHelpers";
import { computeWeeklyInsight } from "../habitInsights";
import { todayMountainDateStr } from "../../lib/mountainTime";

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

    const templates = await db
      .select()
      .from(habitTemplates)
      .where(eq(habitTemplates.isActive, true))
      .orderBy(habitTemplates.order);
    const have = new Set(habits.map((h) => h.title.trim().toLowerCase()));
    const missing = templates.filter((t) => !have.has(t.title.trim().toLowerCase()));
    if (missing.length) {
      await db.insert(userHabits).values(
        missing.map((t) => ({
          userId: ctx.user.id,
          title: t.title,
          description: t.description,
          type: t.type,
          targetValue: t.targetValue,
          unit: t.unit,
          order: t.order,
          isActive: true,
        }))
      );
      habits = await db
        .select()
        .from(userHabits)
        .where(and(eq(userHabits.userId, ctx.user.id), eq(userHabits.isActive, true)))
        .orderBy(userHabits.order);
    }

    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    // Prefer client-supplied fromDate; default remains ~30 days (UTC date is fine for default window)
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
      if (input.isActive) {
        const existingOwners = await db.select({ userId: userHabits.userId }).from(userHabits);
        const owners = [...new Set(existingOwners.map((o) => o.userId))];
        if (owners.length) {
          await db.insert(userHabits).values(
            owners.map((userId) => ({
              userId,
              title: input.title,
              description: input.description,
              type: input.type,
              targetValue: input.targetValue,
              unit: input.unit,
              order: input.order,
              isActive: true,
            }))
          );
        }
      }
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
      const [existing] = await db
        .select()
        .from(habitTemplates)
        .where(eq(habitTemplates.id, input.id))
        .limit(1);
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
      if (existing) {
        await db
          .update(userHabits)
          .set({
            title: input.title,
            description: input.description,
            type: input.type,
            targetValue: input.targetValue,
            unit: input.unit,
            order: input.order,
            isActive: input.isActive,
          })
          .where(eq(userHabits.title, existing.title));
      }
      return { success: true };
    }),

  adminDeleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      const [existing] = await db
        .select()
        .from(habitTemplates)
        .where(eq(habitTemplates.id, input.id))
        .limit(1);
      if (existing) {
        await db
          .update(userHabits)
          .set({ isActive: false })
          .where(eq(userHabits.title, existing.title));
      }
      await db.delete(habitTemplates).where(eq(habitTemplates.id, input.id));
      return { success: true };
    }),

  adminUpsertClientHabit: adminProcedure
    .input(z.object({
      userId: z.number(),
      id: z.number().optional(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(["boolean", "numeric"]),
      targetValue: z.number().optional(),
      unit: z.string().optional(),
      order: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const userRecord = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (userRecord.length === 0 || !userRecord[0].shareHabitsWithCoach) {
        throw new Error("User has not shared habit progress with coaches.");
      }

      if (input.id) {
        await db.update(userHabits)
          .set({
            title: input.title,
            description: input.description,
            type: input.type,
            targetValue: input.targetValue,
            unit: input.unit,
            order: input.order,
            isActive: input.isActive ?? true,
          })
          .where(and(eq(userHabits.id, input.id), eq(userHabits.userId, input.userId)));
      } else {
        await db.insert(userHabits).values({
          userId: input.userId,
          title: input.title,
          description: input.description,
          type: input.type,
          targetValue: input.targetValue,
          unit: input.unit,
          order: input.order ?? 99,
          isActive: input.isActive ?? true,
        });
      }
      return { success: true };
    }),

  adminSetClientHabitActive: adminProcedure
    .input(z.object({
      userId: z.number(),
      habitId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const userRecord = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (userRecord.length === 0 || !userRecord[0].shareHabitsWithCoach) {
        throw new Error("User has not shared habit progress with coaches.");
      }

      await db.update(userHabits)
        .set({ isActive: input.isActive })
        .where(and(eq(userHabits.id, input.habitId), eq(userHabits.userId, input.userId)));
        
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
      
      const stats = await calculateUserHabitStats(db, input.userId);

      const victories = await db
        .select()
        .from(userVictoryLists)
        .where(eq(userVictoryLists.userId, input.userId))
        .orderBy(desc(userVictoryLists.dateStr))
        .limit(14);

      let insight = null;
      try {
        insight = await computeWeeklyInsight(db, input.userId);
      } catch {
        insight = null;
      }

      const uc = await db
        .select()
        .from(userChallenges)
        .where(eq(userChallenges.userId, input.userId));
      const challengeProgress = [];
      for (const enrollment of uc) {
        const [ch] = await db
          .select()
          .from(challenges)
          .where(eq(challenges.id, enrollment.challengeId))
          .limit(1);
        const logsC = await db
          .select()
          .from(userChallengeLogs)
          .where(eq(userChallengeLogs.userChallengeId, enrollment.id));
        challengeProgress.push({
          enrollment,
          challenge: ch || null,
          completedDays: logsC.length,
        });
      }

      return {
        habits,
        logs,
        notes,
        calorieLogs: cLogs,
        fitnessLogs: fLogs,
        stats,
        victories,
        insight,
        challengeProgress,
      };
    }),

  // ── Victory lists ──────────────────────────────────────────────────────────
  saveVictoryList: publicProcedure
    .input(
      z.object({
        dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        win1: z.string().max(280).default(""),
        win2: z.string().max(280).default(""),
        win3: z.string().max(280).default(""),
        deviceId: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      const userId = ctx.user?.id ?? null;
      if (!userId && !input.deviceId) {
        throw new Error("Sign in or provide deviceId");
      }

      const existing = userId
        ? await db
            .select()
            .from(userVictoryLists)
            .where(
              and(
                eq(userVictoryLists.userId, userId),
                eq(userVictoryLists.dateStr, input.dateStr)
              )
            )
            .limit(1)
        : await db
            .select()
            .from(userVictoryLists)
            .where(
              and(
                eq(userVictoryLists.deviceId, input.deviceId!),
                eq(userVictoryLists.dateStr, input.dateStr)
              )
            )
            .limit(1);

      const values = {
        win1: input.win1.trim(),
        win2: input.win2.trim(),
        win3: input.win3.trim(),
      };

      if (existing.length > 0) {
        await db
          .update(userVictoryLists)
          .set(values)
          .where(eq(userVictoryLists.id, existing[0].id));
        return { id: existing[0].id };
      }

      const [result] = await db.insert(userVictoryLists).values({
        userId,
        deviceId: userId ? null : input.deviceId || null,
        dateStr: input.dateStr,
        ...values,
      });
      return { id: (result as any).insertId };
    }),

  getVictoryLists: publicProcedure
    .input(
      z
        .object({
          fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          deviceId: z.string().max(64).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = ctx.user?.id;
      if (!userId && !input?.deviceId) return [];

      const fromDate =
        input?.fromDate ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          return d.toISOString().slice(0, 10);
        })();

      if (userId) {
        return db
          .select()
          .from(userVictoryLists)
          .where(
            and(
              eq(userVictoryLists.userId, userId),
              gte(userVictoryLists.dateStr, fromDate)
            )
          )
          .orderBy(desc(userVictoryLists.dateStr));
      }
      return db
        .select()
        .from(userVictoryLists)
        .where(
          and(
            eq(userVictoryLists.deviceId, input!.deviceId!),
            gte(userVictoryLists.dateStr, fromDate)
          )
        )
        .orderBy(desc(userVictoryLists.dateStr));
    }),

  mergeGuestVictories: protectedProcedure
    .input(z.object({ deviceId: z.string().max(64) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      const rows = await db
        .select()
        .from(userVictoryLists)
        .where(eq(userVictoryLists.deviceId, input.deviceId));
      for (const row of rows) {
        const existing = await db
          .select()
          .from(userVictoryLists)
          .where(
            and(
              eq(userVictoryLists.userId, ctx.user.id),
              eq(userVictoryLists.dateStr, row.dateStr)
            )
          )
          .limit(1);
        if (existing.length === 0) {
          await db
            .update(userVictoryLists)
            .set({ userId: ctx.user.id, deviceId: null })
            .where(eq(userVictoryLists.id, row.id));
        } else {
          await db.delete(userVictoryLists).where(eq(userVictoryLists.id, row.id));
        }
      }
      return { success: true, merged: rows.length };
    }),

  // ── Notification prefs ─────────────────────────────────────────────────────
  getNotificationPrefs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        eveningNudgeEnabled: true,
        victoryPromptEnabled: true,
        challengePushEnabled: true,
        day1Day3Enabled: true,
        weeklyInsightEmailEnabled: true,
      };
    }
    const [row] = await db
      .select()
      .from(habitNotificationPrefs)
      .where(eq(habitNotificationPrefs.userId, ctx.user.id))
      .limit(1);
    if (!row) {
      return {
        eveningNudgeEnabled: true,
        victoryPromptEnabled: true,
        challengePushEnabled: true,
        day1Day3Enabled: true,
        weeklyInsightEmailEnabled: true,
      };
    }
    return row;
  }),

  setNotificationPrefs: protectedProcedure
    .input(
      z.object({
        eveningNudgeEnabled: z.boolean().optional(),
        victoryPromptEnabled: z.boolean().optional(),
        challengePushEnabled: z.boolean().optional(),
        day1Day3Enabled: z.boolean().optional(),
        weeklyInsightEmailEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      const [existing] = await db
        .select()
        .from(habitNotificationPrefs)
        .where(eq(habitNotificationPrefs.userId, ctx.user.id))
        .limit(1);
      if (existing) {
        await db
          .update(habitNotificationPrefs)
          .set({ ...input })
          .where(eq(habitNotificationPrefs.userId, ctx.user.id));
      } else {
        await db.insert(habitNotificationPrefs).values({
          userId: ctx.user.id,
          eveningNudgeEnabled: input.eveningNudgeEnabled ?? true,
          victoryPromptEnabled: input.victoryPromptEnabled ?? true,
          challengePushEnabled: input.challengePushEnabled ?? true,
          day1Day3Enabled: input.day1Day3Enabled ?? true,
          weeklyInsightEmailEnabled: input.weeklyInsightEmailEnabled ?? true,
        });
      }
      return { success: true };
    }),

  // ── Funnel events ──────────────────────────────────────────────────────────
  trackFunnelEvent: publicProcedure
    .input(
      z.object({
        eventType: z.enum([
          "first_open",
          "day1_complete",
          "install_prompt_seen",
          "push_enabled",
          "day3_return",
        ]),
        deviceId: z.string().max(64).optional(),
        meta: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const dateStr = todayMountainDateStr();
      await db.insert(habitFunnelEvents).values({
        userId: ctx.user?.id ?? null,
        deviceId: input.deviceId || null,
        eventType: input.eventType,
        dateStr,
        meta: input.meta || null,
      });
      return { success: true };
    }),

  // ── Pattern insight ────────────────────────────────────────────────────────
  getWeeklyInsight: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    return computeWeeklyInsight(db, ctx.user.id);
  }),

  // ── Habit packs (onboarding) ───────────────────────────────────────────────
  getPacks: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const packs = await db
      .select()
      .from(habitPacks)
      .where(eq(habitPacks.isActive, true))
      .orderBy(habitPacks.sortOrder);
    const items = await db.select().from(habitPackItems);
    return packs.map((p) => ({
      ...p,
      items: items
        .filter((i) => i.packId === p.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }),

  applyPack: protectedProcedure
    .input(z.object({ packId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      const items = await db
        .select()
        .from(habitPackItems)
        .where(eq(habitPackItems.packId, input.packId))
        .orderBy(habitPackItems.sortOrder);
      if (items.length === 0) throw new Error("Pack is empty");

      // Deactivate existing active habits, then insert pack items
      await db
        .update(userHabits)
        .set({ isActive: false })
        .where(eq(userHabits.userId, ctx.user.id));

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await db.insert(userHabits).values({
          userId: ctx.user.id,
          title: it.title,
          description: it.description,
          type: it.type,
          targetValue: it.targetValue,
          unit: it.unit,
          order: i,
          isActive: true,
        });
      }
      return { success: true, count: items.length };
    }),

  adminListPacks: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const packs = await db.select().from(habitPacks).orderBy(habitPacks.sortOrder);
    const items = await db.select().from(habitPackItems);
    return packs.map((p) => ({
      ...p,
      items: items.filter((i) => i.packId === p.id).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }),

  adminUpsertPack: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        slug: z.string().min(1).max(100),
        title: z.string().min(1),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
        isDefault: z.boolean().default(false),
        sortOrder: z.number().default(0),
        items: z
          .array(
            z.object({
              id: z.number().optional(),
              title: z.string(),
              description: z.string().optional(),
              type: z.enum(["boolean", "numeric"]).default("boolean"),
              targetValue: z.number().nullable().optional(),
              unit: z.string().nullable().optional(),
              sortOrder: z.number().default(0),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      let packId = input.id;
      if (packId) {
        await db
          .update(habitPacks)
          .set({
            slug: input.slug,
            title: input.title,
            description: input.description,
            isActive: input.isActive,
            isDefault: input.isDefault,
            sortOrder: input.sortOrder,
          })
          .where(eq(habitPacks.id, packId));
      } else {
        const [result] = await db.insert(habitPacks).values({
          slug: input.slug,
          title: input.title,
          description: input.description,
          isActive: input.isActive,
          isDefault: input.isDefault,
          sortOrder: input.sortOrder,
        });
        packId = Number((result as any).insertId);
      }
      if (input.items && packId) {
        await db.delete(habitPackItems).where(eq(habitPackItems.packId, packId));
        for (const it of input.items) {
          await db.insert(habitPackItems).values({
            packId,
            title: it.title,
            description: it.description,
            type: it.type,
            targetValue: it.targetValue ?? null,
            unit: it.unit ?? null,
            sortOrder: it.sortOrder,
          });
        }
      }
      return { success: true, id: packId };
    }),

  // ── Coach board ────────────────────────────────────────────────────────────
  adminCoachBoard: adminProcedure.query(async ({}) => {
    const db = await getDb();
    if (!db) return [];
    const sharedUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.shareHabitsWithCoach, true));

    const board = [];
    for (const u of sharedUsers) {
      const stats = await calculateUserHabitStats(db, u.id);
      const last = stats.lastActiveDateStr;
      let daysInactive = 999;
      if (last) {
        const a = new Date(`${todayMountainDateStr()}T12:00:00`).getTime();
        const b = new Date(`${last}T12:00:00`).getTime();
        daysInactive = Math.max(0, Math.round((a - b) / 86400000));
      }
      board.push({
        userId: u.id,
        name: u.name,
        email: u.email,
        streak: stats.streak,
        maxStreak: stats.maxStreak,
        lastActiveDateStr: last,
        daysInactive,
        atRisk: daysInactive >= 3,
        onFire: stats.streak >= 7,
      });
    }
    board.sort((a, b) => b.daysInactive - a.daysInactive);
    return board;
  }),

  adminFunnelStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { last7: {}, reminder: null };
    const from = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString().slice(0, 10);
    })();
    const events = await db
      .select({
        eventType: habitFunnelEvents.eventType,
        c: sql<number>`count(*)`,
      })
      .from(habitFunnelEvents)
      .where(gte(habitFunnelEvents.dateStr, from))
      .groupBy(habitFunnelEvents.eventType);

    const last7: Record<string, number> = {};
    for (const e of events) last7[e.eventType] = Number(e.c);

    const [reminder] = await db
      .select()
      .from(habitReminderRuns)
      .orderBy(desc(habitReminderRuns.dateStr))
      .limit(1);

    return { last7, reminder: reminder || null };
  }),

  adminListReminderRuns: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(habitReminderRuns)
      .orderBy(desc(habitReminderRuns.dateStr))
      .limit(14);
  }),
});
