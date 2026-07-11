import { z } from "zod";
import { desc, eq, like } from "drizzle-orm";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscribers } from "../../drizzle/schema";
import { resendSubscribe } from "../resendSubscribe";
import { sendSnackHackEmail, sendTransactionalEmail } from "../notifications";
import { enrollUserInSequence, SNACK_HACK_SEQUENCE_ID, FOOD_QUIZ_SEQUENCE_ID } from "../sequences";
import { 
  getFoodQuizRebalancerEmail, 
  getFoodQuizDoerEmail, 
  getFoodQuizAchieverEmail, 
  getFoodQuizFeelerEmail 
} from "../emails/foodQuizResults";
import { fireMetaPixelLead } from "../metaCapi";
import { metaTrackingInputSchema } from "@shared/metaTracking";

const leadInputSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  contentName: z.string(),
  eventSourceUrl: z.string().optional(),
}).merge(metaTrackingInputSchema);

async function addSubscriberSegment(email: string, firstName: string | undefined, segment: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database unavailable — lead not saved");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingSub = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, normalizedEmail))
    .limit(1);

  if (existingSub.length > 0) {
    let currentSegments: string[] = [];
    try {
      currentSegments = existingSub[0].segments ? JSON.parse(existingSub[0].segments) : [];
      if (!Array.isArray(currentSegments)) currentSegments = [];
    } catch {
      currentSegments = [];
    }
    if (!currentSegments.includes(segment)) {
      currentSegments.push(segment);
      await db
        .update(subscribers)
        .set({
          segments: JSON.stringify(currentSegments),
          // Keep newest first name if provided
          firstName: firstName?.trim() || existingSub[0].firstName,
        })
        .where(eq(subscribers.id, existingSub[0].id));
    }
  } else {
    await db.insert(subscribers).values({
      email: normalizedEmail,
      firstName: firstName?.trim() || null,
      segments: JSON.stringify([segment]),
    });
  }
}

export const leadgenRouter = router({
  subscribeSnackHack: publicProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string().optional(),
    }).merge(metaTrackingInputSchema))
    .mutation(async ({ input, ctx }) => {
      // 1) Persist lead FIRST so admin always has the contact even if Meta/email fail.
      //    (Previously Meta CAPI ran before DB — pixel could count a Lead with no row.)
      try {
        await addSubscriberSegment(input.email, input.firstName, "leadgen_snack_hack");
      } catch (e) {
        console.error("[LeadGen] CRITICAL: failed to save snack-hack subscriber:", e);
        throw new Error("We couldn't save your download. Please try again.");
      }

      // 2) Email / list providers (non-fatal)
      const result = await resendSubscribe({
        email: input.email,
        firstName: input.firstName,
      });

      if (!result.success) {
        console.error("[LeadGen] Resend subscribe error:", result.error);
      }

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

      await sendSnackHackEmail({
        clientEmail: input.email,
        clientName: input.firstName || "Friend",
      });

      const enrolled = await enrollUserInSequence(
        input.email,
        input.firstName ?? null,
        SNACK_HACK_SEQUENCE_ID
      );
      if (!enrolled) {
        console.error(
          "[LeadGen] Failed to enroll snack-hack lead in nurture sequence:",
          input.email
        );
      }

      // 3) Meta CAPI last (browser pixel also fires after success client-side with same eventId)
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

      return { success: true };
    }),

  submitFoodQuiz: publicProcedure
    .input(leadInputSchema.extend({
      resultLetter: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await addSubscriberSegment(input.email, input.firstName, "leadgen_food_quiz");
      } catch (e) {
        console.error("[LeadGen] CRITICAL: failed to save food-quiz subscriber:", e);
        throw new Error("We couldn't save your quiz. Please try again.");
      }

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

      // Send initial Result Email
      let emailTemplate;
      if (input.resultLetter === "A") emailTemplate = getFoodQuizRebalancerEmail;
      else if (input.resultLetter === "B") emailTemplate = getFoodQuizDoerEmail;
      else if (input.resultLetter === "C") emailTemplate = getFoodQuizAchieverEmail;
      else if (input.resultLetter === "D") emailTemplate = getFoodQuizFeelerEmail;

      if (emailTemplate) {
        const content = emailTemplate(input.firstName || "Friend");
        await sendTransactionalEmail({
          to: input.email,
          toName: input.firstName || "Friend",
          subject: content.subject,
          htmlBody: content.html,
          textBody: "Please view this email in an HTML-compatible client.",
        });
      }

      // Enroll in the nurture sequence
      await enrollUserInSequence(
        input.email,
        input.firstName ?? null,
        FOOD_QUIZ_SEQUENCE_ID
      );

      return { success: true };
    }),

  submitJoin: publicProcedure
    .input(leadInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await addSubscriberSegment(input.email, input.firstName, "leadgen_join");
      } catch (e) {
        console.error("[LeadGen] CRITICAL: failed to save join subscriber:", e);
        throw new Error("We couldn't save your signup. Please try again.");
      }

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
