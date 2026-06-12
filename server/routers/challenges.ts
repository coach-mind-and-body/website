import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { challenges, userChallenges } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
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
      if (!db) return [];

      if (ctx.user?.id) {
        return db.select().from(userChallenges).where(eq(userChallenges.userId, ctx.user.id));
      } else if (input.deviceId) {
        return db.select().from(userChallenges).where(eq(userChallenges.deviceId, input.deviceId));
      }
      return [];
    }),

  joinChallenge: publicProcedure
    .input(z.object({ challengeId: z.number(), deviceId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const startDate = format(new Date(), "yyyy-MM-dd");

      // Check if already joined
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
