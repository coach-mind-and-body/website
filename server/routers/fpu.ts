import Stripe from "stripe";
import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { fpuOrders, fpuCoachingSessions, fpuLeads } from "../../drizzle/schema";
import { sendOwnerFpuGroupSignUpEmail, sendFpuGroupSignUpConfirmationEmail } from "../notifications";
import { eq, and, desc } from "drizzle-orm";

function getStripe() {
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}

// ── Product definitions ────────────────────────────────────────────────────────

/** FPU class is FREE — Dave Ramsey handles enrollment. This product is no longer sold directly. */
export const FPU_PRODUCT = {
  name: "Financial Peace University — Cohort with Lee Anne",
  description:
    "9-week Dave Ramsey Financial Peace University course. Cohort starts May 12, 2025. Free enrollment via Dave Ramsey's platform.",
  price: 0,
  displayPrice: "Free",
};

/** 1:1 accountability coaching add-on: 3 x 50-min sessions for $249 */
export const FPU_COACHING_PRODUCT = {
  name: "FPU 1:1 Accountability Coaching — 3 Sessions",
  description:
    "3 private 50-minute coaching sessions with Lee Anne to complement your Financial Peace University journey. Get personalized accountability, mindset coaching, and a plan tailored to your financial situation.",
  price: 24900, // $249 in cents
  displayPrice: "$249",
  sessionCount: 3,
};

export const fpuRouter = router({
  /**
   * Public: create a Stripe Checkout session for FPU 1:1 coaching add-on ($249 / 3 sessions)
   */
  createCoachingCheckout: publicProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const origin =
      (ctx.req.headers.get("origin") as string) || "https://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: ctx.user?.email ?? undefined,
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: FPU_COACHING_PRODUCT.price,
            product_data: {
              name: FPU_COACHING_PRODUCT.name,
              description: FPU_COACHING_PRODUCT.description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        product: "fpu_coaching",
        user_id: ctx.user?.id?.toString() ?? "",
        customer_email: ctx.user?.email ?? "",
        customer_name: ctx.user?.name ?? "",
      },
      client_reference_id: ctx.user?.id?.toString() ?? "guest",
      success_url: `${origin}/financial-peace/thank-you`,
      cancel_url: `${origin}/financial-peace`,
    });

    // Record the pending order in the database
    const db = await getDb();
    if (db && session.id) {
      await db.insert(fpuOrders).values({
        stripeSessionId: session.id,
        userId: ctx.user?.id ?? null,
        clientName: ctx.user?.name ?? null,
        clientEmail: ctx.user?.email ?? null,
        productType: "fpu_coaching",
        status: "pending",
      });
    }

    return { url: session.url };
  }),

  /**
   * Legacy: kept for backward compatibility — now redirects to coaching checkout
   * @deprecated Use createCoachingCheckout instead
   */
  createCheckout: publicProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const origin =
      (ctx.req.headers.get("origin") as string) || "https://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: ctx.user?.email ?? undefined,
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: FPU_COACHING_PRODUCT.price,
            product_data: {
              name: FPU_COACHING_PRODUCT.name,
              description: FPU_COACHING_PRODUCT.description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        product: "fpu_coaching",
        user_id: ctx.user?.id?.toString() ?? "",
        customer_email: ctx.user?.email ?? "",
        customer_name: ctx.user?.name ?? "",
      },
      client_reference_id: ctx.user?.id?.toString() ?? "guest",
      success_url: `${origin}/financial-peace/thank-you`,
      cancel_url: `${origin}/financial-peace`,
    });

    const db = await getDb();
    if (db && session.id) {
      await db.insert(fpuOrders).values({
        stripeSessionId: session.id,
        userId: ctx.user?.id ?? null,
        clientName: ctx.user?.name ?? null,
        clientEmail: ctx.user?.email ?? null,
        productType: "fpu_coaching",
        status: "pending",
      });
    }

    return { url: session.url };
  }),

  /**
   * Protected: get the current user's paid FPU coaching order and sessions.
   * Falls back to email-based lookup for users who paid before creating an account.
   */
  myCoaching: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    // Primary: find by userId (set when logged-in user checks out)
    let orders = await db
      .select()
      .from(fpuOrders)
      .where(
        and(
          eq(fpuOrders.userId, ctx.user!.id),
          eq(fpuOrders.productType, "fpu_coaching"),
          eq(fpuOrders.status, "paid")
        )
      )
      .limit(1);
    // Fallback: match by email for users who paid as a guest before signing up
    if (!orders[0] && ctx.user!.email) {
      const emailOrders = await db
        .select()
        .from(fpuOrders)
        .where(
          and(
            eq(fpuOrders.clientEmail, ctx.user!.email),
            eq(fpuOrders.productType, "fpu_coaching"),
            eq(fpuOrders.status, "paid")
          )
        )
        .limit(1);
      if (emailOrders[0]) {
        orders = emailOrders;
        // Backfill userId so future lookups are faster
        await db
          .update(fpuOrders)
          .set({ userId: ctx.user!.id })
          .where(eq(fpuOrders.id, emailOrders[0].id));
      }
    }
    if (!orders[0]) return null;
    const order = orders[0];
    // Fetch associated coaching sessions
    const sessions = await db
      .select()
      .from(fpuCoachingSessions)
      .where(eq(fpuCoachingSessions.fpuOrderId, order.id))
      .orderBy(fpuCoachingSessions.sessionNumber);
    return { order, sessions };
  }),

  /**
   * Admin: list all paid FPU coaching orders with their sessions
   */
  adminListCoaching: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const orders = await db
      .select()
      .from(fpuOrders)
      .where(
        and(
          eq(fpuOrders.productType, "fpu_coaching"),
          eq(fpuOrders.status, "paid")
        )
      )
      .orderBy(fpuOrders.createdAt);
    const result = await Promise.all(
      orders.map(async (order) => {
        const sessions = await db
          .select()
          .from(fpuCoachingSessions)
          .where(eq(fpuCoachingSessions.fpuOrderId, order.id))
          .orderBy(fpuCoachingSessions.sessionNumber);
        return { order, sessions };
      })
    );
    return result;
  }),

  /**
   * Admin: mark an FPU coaching session as complete and optionally save notes
   */
  adminCompleteSession: adminProcedure
    .input(z.object({ sessionId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(fpuCoachingSessions)
        .set({
          completedAt: new Date(),
          ...(input.notes !== undefined ? { adminNotes: input.notes } : {}),
        })
        .where(eq(fpuCoachingSessions.id, input.sessionId));
      return { success: true };
    }),

  /**
   * Admin: update coach notes on an FPU coaching session
   */
  adminUpdateNotes: adminProcedure
    .input(z.object({ sessionId: z.number(), notes: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(fpuCoachingSessions)
        .set({ adminNotes: input.notes })
        .where(eq(fpuCoachingSessions.id, input.sessionId));
      return { success: true };
    }),

  /**
   * Public: sign up for the FPU group class — saves name+email and emails Lee Anne
   */
  groupSignUp: publicProcedure
    .input(z.object({ name: z.string().min(1), email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (db) {
        await db.insert(fpuLeads).values({
          name: input.name,
          email: input.email,
        });

        // --- ENROLL IN EMAIL SEQUENCE ---
        try {
          const { subscribers, sequenceEnrollments } = await import("../../drizzle/schema");
          const existingSub = await db.select().from(subscribers).where(eq(subscribers.email, input.email)).limit(1);
          let subId;
          
          if (existingSub.length > 0) {
            subId = existingSub[0].id;
            const currentSegments = existingSub[0].segments ? JSON.parse(existingSub[0].segments) : [];
            if (!currentSegments.includes("fpu")) {
              currentSegments.push("fpu");
              await db.update(subscribers).set({ segments: JSON.stringify(currentSegments) }).where(eq(subscribers.id, subId));
            }
          } else {
            const result = await db.insert(subscribers).values({
              email: input.email,
              firstName: input.name,
              segments: JSON.stringify(["fpu"]),
            });
            subId = result[0].insertId;
          }

          // Enroll in sequence if not already enrolled
          const existingEnrollment = await db.select().from(sequenceEnrollments)
            .where(and(eq(sequenceEnrollments.subscriberId, subId), eq(sequenceEnrollments.sequenceId, "fpu_babystep_1")))
            .limit(1);
            
          if (existingEnrollment.length === 0) {
            await db.insert(sequenceEnrollments).values({
              subscriberId: subId,
              sequenceId: "fpu_babystep_1",
            });
          }
        } catch (e) {
          console.error("Failed to enroll in FPU sequence:", e);
        }
        // --------------------------------
      }
      
      // Notify Lee Anne so she can add the client to the Google Calendar event
      await sendOwnerFpuGroupSignUpEmail({
        clientName: input.name,
        clientEmail: input.email,
      });
      // Send confirmation email to the visitor
      await sendFpuGroupSignUpConfirmationEmail({
        clientName: input.name,
        clientEmail: input.email,
      });
      return { success: true };
    }),

  /**
   * Admin: list all FPU group sign-ups (leads) ordered by most recent first
   */
  adminListLeads: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(fpuLeads)
      .orderBy(desc(fpuLeads.createdAt));
  }),

  /**
   * Admin: delete an FPU group sign-up lead by ID
   */
  adminDeleteLead: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(fpuLeads).where(eq(fpuLeads.id, input.id));
      return { success: true };
    }),

  /**
   * Public: check if a Stripe session is paid (for success page confirmation)
   */
  checkSession: publicProcedure
    .input(z.object({ sessionId: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.sessionId) return { paid: false };
      const db = await getDb();
      if (!db) return { paid: false };
      const rows = await db
        .select()
        .from(fpuOrders)
        .where(eq(fpuOrders.stripeSessionId, input.sessionId))
        .limit(1);
      return { paid: rows[0]?.status === "paid" };
    }),
});
