import { adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { campaigns, sequences, sequenceSteps, sequenceEnrollments, users, callLogs } from "../../drizzle/schema";
import { eq, desc, and, isNotNull, ne, or, isNull, asc, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { resolveContactsByPhones } from "../crm/contactResolver";
import { enrollUserInSequence } from "../crm/sequenceEnrollment";
import { processScheduledCampaigns } from "../crm/campaignJob";
import twilio from "twilio";

export const crmAutomationsRouter = router({
  // ─── Campaigns ─────────────────────────────────────────────────────────────
  listCampaigns: adminProcedure.query(async () => {
    const db = await getDb();
      if (!db) throw new Error('Database not available');
    return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }),

  getCampaignAudienceCount: adminProcedure
    .input(z.object({ targetTagId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Tags don't exist in this schema — return all users with a phone as the audience
      const hasPhone = and(isNotNull(users.phone), ne(users.phone, ""));
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(hasPhone);
      return { total: rows.length, withPhone: rows.length };
    }),

  // ─── Call History ──────────────────────────────────────────────────────────
  getCallLogs: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return { calls: [] };
      
      const dbLogs = await db.select().from(callLogs).orderBy(desc(callLogs.createdAt)).limit(100);

      const phonesToResolve = dbLogs.flatMap(c => [c.fromNumber, c.toNumber].filter(Boolean) as string[]);
      const contactMap = await resolveContactsByPhones(db, phonesToResolve);
      
      const mappedCalls = dbLogs.map(c => {
        const contactPhone = c.direction === "inbound" ? c.fromNumber : c.toNumber;
        const resolved = contactPhone ? contactMap.get(contactPhone) : undefined;
        return {
          sid: c.twilioCallSid,
          from: c.fromNumber,
          to: c.toNumber,
          contactName: resolved?.name || null,
          status: c.durationSeconds > 0 ? "completed" : "no-answer",
          duration: c.durationSeconds.toString(),
          startTime: c.createdAt.toISOString(),
          direction: c.direction,
          price: "0.00",
          transcript: c.transcript,
          aiSummary: c.aiSummary,
          recordingUrl: c.recordingUrl
        };
      });

      return { calls: mappedCalls };
    } catch (error) {
      console.error("Call Logs DB Error:", error);
      throw new Error("Failed to fetch call logs");
    }
  }),

  createCampaign: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      targetTagId: z.number().optional(),
      messageBody: z.string().min(1),
      mediaUrl: z.string().optional(),
      scheduleForLater: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const scheduledAt = input.scheduleForLater 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow for now if true
        : new Date(Date.now() - 60000); // 1 minute in the past for immediate to bypass DB rounding delays

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentDuplicates = await db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.name, input.name),
            gte(campaigns.createdAt, oneHourAgo),
            or(
              eq(campaigns.status, "scheduled"),
              eq(campaigns.status, "sending"),
              eq(campaigns.status, "completed")
            )
          )
        )
        .orderBy(desc(campaigns.createdAt))
        .limit(1);

      const recentDuplicate = recentDuplicates[0] ?? null;

      if (recentDuplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A campaign named "${input.name}" was already launched recently (id ${recentDuplicate.id}). Check the campaigns list — do not send again.`,
        });
      }
        
      try {
        await db.insert(campaigns).values({
          name: input.name,
          targetTagId: input.targetTagId,
          messageBody: input.messageBody,
          mediaUrl: input.mediaUrl?.trim() || null,
          status: "scheduled",
          scheduledAt: scheduledAt,
        });
      } catch (err: unknown) {
        const cause = err as { cause?: { code?: string; message?: string } };
        if (cause.cause?.code === "ER_BAD_FIELD_ERROR" && cause.cause.message?.includes("mediaUrl")) {
          throw new Error(
            "Campaigns table is missing the mediaUrl column. Run: npx tsx scripts/add-campaign-media-url-column.ts"
          );
        }
        throw err;
      }

      if (!input.scheduleForLater) {
        // Kick off processing immediately without waiting for the cron job
        // We do this asynchronously to avoid blocking the request
        setTimeout(async () => {
          try {
            await processScheduledCampaigns();
          } catch (e) {
            console.error("Immediate campaign send failed:", e);
          }
        }, 100);
      }

      return { success: true };
    }),

  // ─── Sequences ─────────────────────────────────────────────────────────────
  listSequences: adminProcedure.query(async () => {
    const db = await getDb();
      if (!db) throw new Error('Database not available');
    // Return sequences with their steps
    const allSequences = await db.select().from(sequences).orderBy(desc(sequences.createdAt));
    const allSteps = await db.select().from(sequenceSteps).orderBy(sequenceSteps.stepOrder);

    return allSequences.map(seq => ({
      ...seq,
      steps: allSteps.filter(step => step.sequenceId === seq.id),
    }));
  }),

  updateSequence: adminProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean().optional(),
      name: z.string().min(1).optional(),
      triggerTagId: z.number().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: Partial<{ isActive: boolean; name: string; triggerTagId: number | null }> = {};
      if (input.isActive !== undefined) updates.isActive = input.isActive;
      if (input.name !== undefined) updates.name = input.name;
      if (input.triggerTagId !== undefined) updates.triggerTagId = input.triggerTagId;

      if (Object.keys(updates).length === 0) return { success: true };

      await db.update(sequences).set(updates).where(eq(sequences.id, input.id));
      return { success: true };
    }),

  createSequence: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      triggerTagId: z.number().optional(),
      isActive: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [result] = await db.insert(sequences).values({
        name: input.name,
        triggerTagId: input.triggerTagId,
        isActive: input.isActive,
      });
      return { id: result.insertId };
    }),

  addSequenceStep: adminProcedure
    .input(z.object({
      sequenceId: z.number(),
      stepOrder: z.number(),
      delayHours: z.number().min(0),
      messageBody: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.insert(sequenceSteps).values({
        sequenceId: input.sequenceId,
        stepOrder: input.stepOrder,
        delayHours: input.delayHours,
        messageBody: input.messageBody,
      });
      return { success: true };
    }),

  enrollInSequence: adminProcedure
    .input(z.object({
      userId: z.number(),
      sequenceId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const result = await enrollUserInSequence(db, input.userId, input.sequenceId);
      if (!result.success) {
        throw new Error("User is already actively enrolled in this sequence.");
      }

      return { success: true };
    }),

  listEnrollmentsForUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select({
          enrollment: sequenceEnrollments,
          sequenceName: sequences.name,
        })
        .from(sequenceEnrollments)
        .innerJoin(sequences, eq(sequenceEnrollments.sequenceId, sequences.id))
        .where(eq(sequenceEnrollments.userId, input.userId))
        .orderBy(desc(sequenceEnrollments.enrolledAt));

      return rows.map(r => ({
        id: r.enrollment.id,
        sequenceName: r.sequenceName,
        status: r.enrollment.status,
        nextExecutionAt: r.enrollment.nextExecutionAt,
        enrolledAt: r.enrollment.enrolledAt,
      }));
    }),

  // ─── Tags (stubbed out — no tags/userTags tables in this schema) ─────────
  listTags: adminProcedure.query(async () => {
    return [];
  }),

  createTag: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      color: z.string().default("#2d5f7a"),
    }))
    .mutation(async () => {
      return { id: 0 };
    }),

  getUserTags: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async () => {
      return [];
    }),

  addUserTag: adminProcedure
    .input(z.object({ userId: z.number(), tagId: z.number() }))
    .mutation(async () => {
      return { success: true };
    }),

  removeUserTag: adminProcedure
    .input(z.object({ userId: z.number(), tagId: z.number() }))
    .mutation(async () => {
      return { success: true };
    })
});
