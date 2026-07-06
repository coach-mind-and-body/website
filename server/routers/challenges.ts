import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { challenges, userChallenges, userChallengeLogs } from "../../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { format } from "date-fns";

export const challengesRouter = router({
  getActiveChallenges: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(challenges).where(eq(challenges.isActive, true));
  }),

  getUserChallenges: publicProcedure
    .input(z.object({ deviceId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { challenges: [], logs: [] };

      let uc: any[] = [];
      if (ctx.user?.id) {
        uc = await db.select().from(userChallenges).where(eq(userChallenges.userId, ctx.user.id));
      } else if (input.deviceId) {
        uc = await db.select().from(userChallenges).where(eq(userChallenges.deviceId, input.deviceId));
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

      let existing;
      if (ctx.user?.id) {
        existing = await db.select().from(userChallenges).where(
          and(eq(userChallenges.challengeId, input.challengeId), eq(userChallenges.userId, ctx.user.id))
        ).limit(1);
      } else if (input.deviceId) {
        existing = await db.select().from(userChallenges).where(
          and(eq(userChallenges.challengeId, input.challengeId), eq(userChallenges.deviceId, input.deviceId))
        ).limit(1);
      }

      if (existing && existing.length > 0) return { success: true };

      await db.insert(userChallenges).values({
        userId: ctx.user?.id || null,
        deviceId: input.deviceId || null,
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
        (input.deviceId != null && userChallenge.deviceId === input.deviceId);

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

      return { success: true };
    }),

  // Admin Actions
  createChallenge: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      durationDays: z.number().default(7)
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const [res] = await db.insert(challenges).values({
        title: input.title,
        description: input.description,
        durationDays: input.durationDays,
        isActive: true,
      });

      return { success: true, challengeId: res.insertId };
    }),
});
