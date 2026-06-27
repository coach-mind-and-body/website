import { z } from "zod";
import { desc, eq, like } from "drizzle-orm";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscribers } from "../../drizzle/schema";
import { resendSubscribe } from "../resendSubscribe";
import { sendSnackHackEmail } from "../notifications";
import { fireMetaPixelLead } from "../metaCapi";
import { metaTrackingInputSchema } from "@shared/metaTracking";

const leadInputSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  contentName: z.string(),
  eventSourceUrl: z.string().optional(),
}).merge(metaTrackingInputSchema);

async function addSubscriberSegment(email: string, firstName: string | undefined, segment: string) {
  try {
    const { getDb } = await import("../db");
    const { subscribers } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) return;

    const existingSub = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
    if (existingSub.length > 0) {
      const currentSegments = existingSub[0].segments ? JSON.parse(existingSub[0].segments) : [];
      if (!currentSegments.includes(segment)) {
        currentSegments.push(segment);
        await db.update(subscribers).set({ segments: JSON.stringify(currentSegments) }).where(eq(subscribers.id, existingSub[0].id));
      }
    } else {
      await db.insert(subscribers).values({
        email,
        firstName,
        segments: JSON.stringify([segment]),
      });
    }
  } catch (e) {
    console.error(`[LeadGen] Failed to add subscriber segment ${segment}:`, e);
  }
}

export const leadgenRouter = router({
  subscribeSnackHack: publicProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string().optional(),
    }).merge(metaTrackingInputSchema))
    .mutation(async ({ input, ctx }) => {
      const result = await resendSubscribe({
        email: input.email,
        firstName: input.firstName,
      });

      if (!result.success) {
        console.error("[LeadGen] Resend subscribe error:", result.error);
      }

      await fireMetaPixelLead({
        customerEmail: input.email,
        customerName: input.firstName,
        contentName: "Snack Hack Download",
        eventSourceUrl: "https://mindandbodyresetcoach.com/snack-hack",
        eventId: input.eventId,
        req: ctx.req,
        fbc: input.fbc,
        fbp: input.fbp,
      });

      try {
        const { ENV } = await import("../_core/env");
        const { Resend } = await import("resend");
        if (ENV.resendApiKey) {
          const resend = new Resend(ENV.resendApiKey);
          await resend.events.send({
            event: "snack_hack_downloaded",
            email: input.email,
          });
        }
      } catch (e) {
        console.error("[LeadGen] Failed to fire resend event:", e);
      }

      await addSubscriberSegment(input.email, input.firstName, "leadgen_snack_hack");

      await sendSnackHackEmail({
        clientEmail: input.email,
        clientName: input.firstName || "Friend",
      });

      return { success: true };
    }),

  submitFoodQuiz: publicProcedure
    .input(leadInputSchema.extend({
      resultLetter: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await fireMetaPixelLead({
        customerEmail: input.email,
        customerName: input.firstName,
        contentName: "Food Quiz",
        eventSourceUrl: input.eventSourceUrl ?? "https://mindandbodyresetcoach.com/food-quiz",
        eventId: input.eventId,
        req: ctx.req,
        fbc: input.fbc,
        fbp: input.fbp,
      });

      await addSubscriberSegment(input.email, input.firstName, "leadgen_food_quiz");
      return { success: true };
    }),

  submitJoin: publicProcedure
    .input(leadInputSchema)
    .mutation(async ({ input, ctx }) => {
      await fireMetaPixelLead({
        customerEmail: input.email,
        customerName: input.firstName,
        contentName: "Join the Community - Email Sign-Up",
        eventSourceUrl: input.eventSourceUrl ?? "https://mindandbodyresetcoach.com/join",
        eventId: input.eventId,
        req: ctx.req,
        fbc: input.fbc,
        fbp: input.fbp,
      });

      await addSubscriberSegment(input.email, input.firstName, "leadgen_join");
      return { success: true };
    }),

  adminListSnackHack: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        firstName: subscribers.firstName,
        segments: subscribers.segments,
        createdAt: subscribers.createdAt,
      })
      .from(subscribers)
      .where(like(subscribers.segments, "%leadgen_snack_hack%"))
      .orderBy(desc(subscribers.createdAt));

    return rows;
  }),

  adminDeleteSnackHack: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [row] = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.id, input.id))
        .limit(1);

      if (!row) return { success: true };

      const segments: string[] = row.segments ? JSON.parse(row.segments) : [];
      const remaining = segments.filter((s) => s !== "leadgen_snack_hack");

      if (remaining.length === 0) {
        await db.delete(subscribers).where(eq(subscribers.id, input.id));
      } else {
        await db
          .update(subscribers)
          .set({ segments: JSON.stringify(remaining) })
          .where(eq(subscribers.id, input.id));
      }

      return { success: true };
    }),
});
