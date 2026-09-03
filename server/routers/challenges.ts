import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  challenges,
  userChallengeJournals,
  userChallenges,
  userChallengeLogs,
} from "../../drizzle/schema";
import { eq, and, isNull, desc, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { format } from "date-fns";
import {
  claimRealFoodResetEnrollment,
  getChallengeToday,
  mergeRealFoodResetToUser,
} from "../realFoodResetChallenge";

export const challengesRouter = router({
  getActiveChallenges: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(challenges).where(eq(challenges.isActive, true));
    return rows.map(({ meetUrl: _meetUrl, ...rest }) => rest);
  }),

  getToday: publicProcedure
    .input(z.object({ deviceId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getChallengeToday({
        userId: ctx.user?.id ?? null,
        deviceId: input?.deviceId ?? null,
        email: ctx.user?.email ?? null,
      });
    }),

  claimEnrollment: publicProcedure
    .input(z.object({ token: z.string().min(8), deviceId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const claimed = await claimRealFoodResetEnrollment({
        token: input.token,
        deviceId: input.deviceId ?? null,
        userId: ctx.user?.id ?? null,
        email: ctx.user?.email ?? null,
      });
      if (!claimed.success) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }
      return claimed;
    }),

  saveJournal: publicProcedure
    .input(
      z.object({
        userChallengeId: z.number(),
        dateStr: z.string(),
        noticed: z.string().optional(),
        glad: z.string().optional(),
        hard: z.string().optional(),
        deviceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      const [uc] = await db
        .select()
        .from(userChallenges)
        .where(eq(userChallenges.id, input.userChallengeId))
        .limit(1);
      if (!uc) throw new TRPCError({ code: "NOT_FOUND", message: "Not enrolled" });
      const owned =
        (ctx.user?.id != null && uc.userId === ctx.user.id) ||
        (input.deviceId != null && uc.deviceId === input.deviceId) ||
        (ctx.user?.email != null && uc.email === ctx.user.email.toLowerCase());
      if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });

      const existing = await db
        .select()
        .from(userChallengeJournals)
        .where(
          and(
            eq(userChallengeJournals.userChallengeId, input.userChallengeId),
            eq(userChallengeJournals.dateStr, input.dateStr)
          )
        )
        .limit(1);
      const fields = {
        noticed: input.noticed ?? "",
        glad: input.glad ?? "",
        hard: input.hard ?? "",
      };
      if (existing[0]) {
        await db
          .update(userChallengeJournals)
          .set(fields)
          .where(eq(userChallengeJournals.id, existing[0].id));
      } else {
        await db.insert(userChallengeJournals).values({
          userChallengeId: input.userChallengeId,
          dateStr: input.dateStr,
          ...fields,
        });
      }
      return { success: true };
    }),

  getUserChallenges: publicProcedure
    .input(z.object({ deviceId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { challenges: [], logs: [] };

      let uc: any[] = [];
      const clauses = [];
      if (ctx.user?.id) clauses.push(eq(userChallenges.userId, ctx.user.id));
      if (ctx.user?.email) clauses.push(eq(userChallenges.email, ctx.user.email.toLowerCase()));
      if (input.deviceId) clauses.push(eq(userChallenges.deviceId, input.deviceId));
      if (clauses.length > 0) {
        uc = await db.select().from(userChallenges).where(or(...clauses));
      }

      if (uc.length === 0) return { challenges: [], logs: [] };

      // Fetch all logs for these user_challenges
      const uIds = uc.map(c => c.id);
      const logs = [];
      for (const uid of uIds) {
        const cLogs = await db.select().from(userChallengeLogs).where(eq(userChallengeLogs.userChallengeId, uid));
        logs.push(...cLogs);
      }

      return { challenges: uc, logs };
    }),

  joinChallenge: publicProcedure
    .input(z.object({ challengeId: z.number(), deviceId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const startDate = format(new Date(), "yyyy-MM-dd");
      const email = ctx.user?.email?.toLowerCase() ?? null;
      const match = [];
      if (ctx.user?.id) match.push(eq(userChallenges.userId, ctx.user.id));
      if (email) match.push(eq(userChallenges.email, email));
      if (input.deviceId) match.push(eq(userChallenges.deviceId, input.deviceId));

      let existing: typeof userChallenges.$inferSelect[] = [];
      if (match.length > 0) {
        existing = await db
          .select()
          .from(userChallenges)
          .where(and(eq(userChallenges.challengeId, input.challengeId), or(...match)))
          .limit(1);
      }

      if (existing.length > 0) {
        const patch: Partial<typeof userChallenges.$inferInsert> = {};
        if (ctx.user?.id && !existing[0].userId) patch.userId = ctx.user.id;
        if (input.deviceId && !existing[0].deviceId) patch.deviceId = input.deviceId;
        if (email && !existing[0].email) patch.email = email;
        if (Object.keys(patch).length > 0) {
          await db.update(userChallenges).set(patch).where(eq(userChallenges.id, existing[0].id));
        }
        return { success: true };
      }

      await db.insert(userChallenges).values({
        userId: ctx.user?.id || null,
        deviceId: input.deviceId || null,
        email,
        challengeId: input.challengeId,
        startDate,
        status: "active"
      });

      return { success: true };
    }),

  toggleChallengeLog: publicProcedure
    .input(z.object({
      userChallengeId: z.number(),
      dateStr: z.string(),
      completed: z.boolean(),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const [userChallenge] = await db
        .select()
        .from(userChallenges)
        .where(eq(userChallenges.id, input.userChallengeId))
        .limit(1);

      if (!userChallenge) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Challenge enrollment not found" });
      }

      const owned =
        (ctx.user?.id != null && userChallenge.userId === ctx.user.id) ||
        (input.deviceId != null && userChallenge.deviceId === input.deviceId) ||
        (ctx.user?.email != null &&
          userChallenge.email === ctx.user.email.toLowerCase());

      if (!owned) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to modify this challenge log" });
      }

      if (input.completed) {
        const existing = await db.select().from(userChallengeLogs).where(
          and(eq(userChallengeLogs.userChallengeId, input.userChallengeId), eq(userChallengeLogs.dateStr, input.dateStr))
        ).limit(1);

        if (!existing || existing.length === 0) {
          await db.insert(userChallengeLogs).values({
            userChallengeId: input.userChallengeId,
            dateStr: input.dateStr
          });
        }
      } else {
        await db.delete(userChallengeLogs).where(
          and(eq(userChallengeLogs.userChallengeId, input.userChallengeId), eq(userChallengeLogs.dateStr, input.dateStr))
        );
      }
      return { success: true };
    }),

  mergeGuestData: protectedProcedure
    .input(z.object({ deviceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      await db
        .update(userChallenges)
        .set({ userId: ctx.user.id, deviceId: null })
        .where(
          and(eq(userChallenges.deviceId, input.deviceId), isNull(userChallenges.userId))
        );

      await mergeRealFoodResetToUser(
        ctx.user.id,
        ctx.user.email ?? null,
        input.deviceId
      );

      return { success: true };
    }),

  // Admin Actions
  createChallenge: adminProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        durationDays: z.number().default(7),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        linkedPodcastSlug: z.string().optional().nullable(),
        linkedBlogSlug: z.string().optional().nullable(),
        themeTag: z.string().optional().nullable(),
        isFeatured: z.boolean().default(false),
        featuredOrder: z.number().default(0),
        isActive: z.boolean().default(true),
        meetUrl: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const [res] = await db.insert(challenges).values({
        title: input.title,
        description: input.description,
        durationDays: input.durationDays,
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        linkedPodcastSlug: input.linkedPodcastSlug || null,
        linkedBlogSlug: input.linkedBlogSlug || null,
        themeTag: input.themeTag || null,
        isFeatured: input.isFeatured,
        featuredOrder: input.featuredOrder,
        isActive: input.isActive,
        meetUrl: input.meetUrl || null,
      });

      return { success: true, challengeId: res.insertId };
    }),

  updateChallenge: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional().nullable(),
        durationDays: z.number().optional(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        linkedPodcastSlug: z.string().optional().nullable(),
        linkedBlogSlug: z.string().optional().nullable(),
        themeTag: z.string().optional().nullable(),
        isFeatured: z.boolean().optional(),
        featuredOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        meetUrl: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      const { id, ...rest } = input;
      await db.update(challenges).set(rest).where(eq(challenges.id, id));
      return { success: true };
    }),

  adminListChallenges: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const all = await db.select().from(challenges).orderBy(desc(challenges.createdAt));
    const result = [];
    for (const c of all) {
      const enrollments = await db
        .select()
        .from(userChallenges)
        .where(eq(userChallenges.challengeId, c.id));
      let completedCount = 0;
      for (const e of enrollments) {
        const logs = await db
          .select()
          .from(userChallengeLogs)
          .where(eq(userChallengeLogs.userChallengeId, e.id));
        if (logs.length >= c.durationDays) completedCount++;
      }
      result.push({
        ...c,
        joinCount: enrollments.length,
        completedCount,
      });
    }
    return result;
  }),
});
