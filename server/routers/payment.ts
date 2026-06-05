import Stripe from "stripe";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { ENV } from "../_core/env";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { deposits, enrollments, coachingSessions, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { enrollUserInSequence } from "../sequences";

function getStripe() {
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

const PLAN_CONFIG = {
  full: { amount: 59700, label: "R.E.C.L.A.I.M. 6-Week Mind & Body Reset — Full Payment", desc: "Full enrollment in the 6-Week Mind & Body Reset program. Includes 6 private 50-minute coaching sessions with Lee Anne." },
  deposit: { amount: 20000, label: "R.E.C.L.A.I.M. 6-Week Mind & Body Reset — Non-Refundable Deposit", desc: "Non-refundable deposit to secure your spot. Balance of $397 due before Session 1." },
};

const RECLAIM_SESSION_LABELS = [
  "Discovery & Reset Foundation",
  "Food Noise & Mindset Mapping",
  "Hormones, Hunger & Habits",
  "Movement & Energy Reset",
  "Emotional Eating & Identity",
  "Integration & Your Life Forward",
];

export const paymentRouter = router({
  /**
   * Creates a Stripe Checkout Session for program enrollment.
   * Supports 'full' ($597) and 'deposit' ($200) plans.
   * Works for both logged-in users (captures user_id) and anonymous visitors.
   */
  createDepositCheckout: publicProcedure
    .input(
      z.object({
        plan: z.enum(["full", "deposit"]).default("full"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripe();
      const origin = (ctx.req.headers.origin as string) || "https://localhost:3000";
      const planCfg = PLAN_CONFIG[input.plan];

      // Capture user info if logged in (ctx.user may be set for publicProcedure too)
      const loggedInUser = ctx.user ?? null;

      const metadata: Record<string, string> = {
        plan: input.plan,
      };
      if (loggedInUser) {
        metadata.user_id = loggedInUser.id.toString();
        metadata.customer_email = loggedInUser.email ?? "";
        metadata.customer_name = loggedInUser.name ?? "";
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        allow_promotion_codes: true,
        customer_email: loggedInUser?.email ?? undefined,
        client_reference_id: loggedInUser ? loggedInUser.id.toString() : undefined,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: planCfg.amount,
              product_data: {
                name: planCfg.label,
                description: planCfg.desc,
              },
            },
            quantity: 1,
          },
        ],
        metadata,
        success_url: `${origin}/enroll?success=1`,
        cancel_url: `${origin}/enroll`,
      });

      // Persist the pending deposit record
      const db = await getDb();
      if (db && session.id) {
        await db.insert(deposits).values({
          stripeSessionId: session.id,
          clientName: loggedInUser?.name ?? "Pending",
          clientEmail: loggedInUser?.email ?? "pending@pending.com",
          status: "pending",
        });
      }

      return { url: session.url };
    }),

  /**
   * Admin: list all deposits/payments with optional status filter
   */
  adminList: protectedProcedure
    .input(z.object({ status: z.enum(["pending", "paid", "failed"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) return [];

      const conditions = input?.status ? eq(deposits.status, input.status) : undefined;
      const rows = await db
        .select()
        .from(deposits)
        .where(conditions)
        .orderBy(desc(deposits.createdAt));

      return rows;
    }),

  /**
   * Admin: get payment stats (totals, counts)
   */
  adminStats: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return { totalPaid: 0, totalPending: 0, totalFailed: 0, paidCount: 0, pendingCount: 0 };

    const allDeposits = await db.select().from(deposits);

    const paid = allDeposits.filter(d => d.status === "paid");
    const pending = allDeposits.filter(d => d.status === "pending");
    const failed = allDeposits.filter(d => d.status === "failed");

    // Also check enrollments for payment type info
    const allEnrollments = await db.select().from(enrollments);
    
    // Calculate revenue: each paid deposit could be $200 (deposit) or $597 (full)
    // We look at enrollment payment type to determine amounts
    let totalRevenue = 0;
    for (const dep of paid) {
      // Try to match with enrollment via stripePaymentIntentId
      const matchingEnrollment = allEnrollments.find(
        e => e.stripePaymentIntentId === dep.stripePaymentIntentId
      );
      if (matchingEnrollment) {
        totalRevenue += matchingEnrollment.paymentType === "full" ? 597 : 200;
        if (matchingEnrollment.balancePaid) totalRevenue += 397; // balance paid
      } else {
        // Default to deposit amount if no enrollment match
        totalRevenue += 200;
      }
    }

    return {
      totalRevenue,
      paidCount: paid.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      totalTransactions: allDeposits.length,
    };
  }),

  /**
   * Client: pay remaining balance ($397) for deposit-plan enrollments
   */
  payBalance: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const enrollmentRows = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user!.id))
      .limit(1);

    const enrollment = enrollmentRows[0];
    if (!enrollment) throw new TRPCError({ code: "NOT_FOUND", message: "No enrollment found" });
    if (enrollment.paymentType !== "deposit") throw new TRPCError({ code: "BAD_REQUEST", message: "Full payment already made" });
    if (enrollment.balancePaid) throw new TRPCError({ code: "BAD_REQUEST", message: "Balance already paid" });

    const stripe = getStripe();
    const origin = (ctx.req.headers.origin as string) || "https://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: ctx.user!.email ?? undefined,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: 39700,
          product_data: {
            name: "R.E.C.L.A.I.M. 6-Week Mind & Body Reset — Balance Payment",
            description: "Remaining balance for your 6-Week Mind & Body Reset program.",
          },
        },
        quantity: 1,
      }],
      metadata: {
        plan: "balance",
        user_id: ctx.user!.id.toString(),
        enrollment_id: enrollment.id.toString(),
        customer_email: ctx.user!.email ?? "",
        customer_name: ctx.user!.name ?? "",
      },
      client_reference_id: ctx.user!.id.toString(),
      success_url: `${origin}/portal?balance_paid=1`,
      cancel_url: `${origin}/portal`,
    });

    return { url: session.url };
  }),

  /**
   * Client: get my payment history (deposits linked to my enrollment)
   */
  myPayments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { enrollment: null, deposits: [] };

    // Get user's enrollment
    const enrollmentRows = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user!.id))
      .limit(1);

    const enrollment = enrollmentRows[0] ?? null;
    if (!enrollment) return { enrollment: null, deposits: [] };

    // Get deposits matching this enrollment's payment intent
    let userDeposits: typeof deposits.$inferSelect[] = [];
    if (enrollment.stripePaymentIntentId) {
      userDeposits = await db
        .select()
        .from(deposits)
        .where(eq(deposits.stripePaymentIntentId, enrollment.stripePaymentIntentId))
        .orderBy(desc(deposits.createdAt));
    }

    // Calculate payment summary
    const programCost = 597;
    const depositAmount = enrollment.paymentType === "deposit" ? 200 : 597;
    const depositPaid = enrollment.depositPaid;
    const balancePaid = enrollment.balancePaid;
    const amountPaid = depositPaid ? (balancePaid ? programCost : depositAmount) : 0;
    const balanceRemaining = programCost - amountPaid;

    return {
      enrollment: {
        id: enrollment.id,
        paymentType: enrollment.paymentType,
        depositPaid: enrollment.depositPaid,
        balancePaid: enrollment.balancePaid,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      },
      deposits: userDeposits,
      summary: {
        programCost,
        amountPaid,
        balanceRemaining,
        isFullyPaid: balanceRemaining <= 0,
      },
    };
  }),

  /**
   * Called after user signs up — links any existing paid deposit to their new account
   * and creates enrollment + sessions if not already created.
   */
  linkDepositToAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { linked: false };

    const userEmail = ctx.user!.email;
    if (!userEmail) return { linked: false };

    // Check if enrollment already exists
    const existingEnrollment = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user!.id))
      .limit(1);

    if (existingEnrollment[0]) return { linked: true, alreadyExists: true };

    // Look for a paid deposit with this email
    const paidDeposit = await db
      .select()
      .from(deposits)
      .where(eq(deposits.clientEmail, userEmail.toLowerCase().trim()))
      .limit(1);

    if (!paidDeposit[0] || paidDeposit[0].status !== "paid") return { linked: false };

    const dep = paidDeposit[0];

    // Create enrollment
    const [newEnrollment] = await db
      .insert(enrollments)
      .values({
        userId: ctx.user!.id,
        stripePaymentIntentId: dep.stripePaymentIntentId ?? null,
        paymentType: "deposit",
        depositPaid: true,
        balancePaid: false,
        status: "active",
      })
      .$returningId();

    if (newEnrollment) {
      // Create 6 coaching sessions
      const sessionValues = RECLAIM_SESSION_LABELS.map((_, idx) => ({
        enrollmentId: newEnrollment.id,
        userId: ctx.user!.id,
        sessionNumber: idx + 1,
        status: "not_scheduled" as const,
      }));
      await db.insert(coachingSessions).values(sessionValues);
      console.log(`[linkDeposit] Created enrollment ${newEnrollment.id} + 6 sessions for user ${ctx.user!.id} (${userEmail})`);
      
      // Enroll in drip sequence
      await enrollUserInSequence(userEmail, ctx.user!.name ?? null, "reclaim_6_week");
    }

    return { linked: true };
  }),
});
