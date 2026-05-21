import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { enrollments, coachingSessions, users, programModules, moduleProgress } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sendPostSessionEmail, sendPostSessionSMS, sendBalanceReminderEmail, sendModuleUnlockedEmail } from "../notifications";
import Stripe from "stripe";
import { ENV } from "../_core/env";

function getStripe() {
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

const SESSION_LABELS = [
  "Discovery & Reset Foundation",
  "Food Noise & Mindset Mapping",
  "Hormones, Hunger & Habits",
  "Movement & Energy Reset",
  "Emotional Eating & Identity",
  "Integration & Your Life Forward",
];

export const enrollmentRouter = router({
  // Client: get my enrollment + sessions
  myEnrollment: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user!.id))
      .limit(1);
    if (!result[0]) return null;
    const enrollment = result[0];
    const sessions = await db
      .select()
      .from(coachingSessions)
      .where(eq(coachingSessions.enrollmentId, enrollment.id))
      .orderBy(coachingSessions.sessionNumber);
    return { enrollment, sessions };
  }),

  // Admin: get sessions for a specific enrollment
  adminGetSessions: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(coachingSessions)
        .where(eq(coachingSessions.enrollmentId, input.enrollmentId))
        .orderBy(coachingSessions.sessionNumber);
    }),

  // Admin: list all enrollments with client info
  adminList: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        id: enrollments.id,
        userId: enrollments.userId,
        status: enrollments.status,
        paymentType: enrollments.paymentType,
        depositPaid: enrollments.depositPaid,
        balancePaid: enrollments.balancePaid,
        enrolledAt: enrollments.enrolledAt,
        clientName: users.name,
        clientEmail: users.email,
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.userId, users.id))
      .orderBy(desc(enrollments.enrolledAt));
    return rows;
  }),

  /**
   * Admin: manually create an enrollment for a client by email.
   * Used when a client paid outside Stripe or needs to be manually enrolled.
   * If the user account exists, creates enrollment + 6 sessions immediately.
   * If not, returns a message indicating the account doesn't exist yet.
   */
  adminCreate: protectedProcedure
    .input(z.object({
      clientEmail: z.string().email(),
      paymentType: z.enum(["full", "deposit"]),
      depositPaid: z.boolean().default(true),
      balancePaid: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const email = input.clientEmail.toLowerCase().trim();

      // Find user by email
      const userRows = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!userRows[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No account found for ${email}. Ask the client to sign up first, then enroll them.`,
        });
      }

      const user = userRows[0];

      // Check if enrollment already exists
      const existing = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(eq(enrollments.userId, user.id))
        .limit(1);

      if (existing[0]) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${email} already has an active enrollment (ID: ${existing[0].id}).`,
        });
      }

      // Create enrollment
      const isFullyPaid = input.paymentType === "full" || (input.depositPaid && input.balancePaid);
      const [newEnrollment] = await db
        .insert(enrollments)
        .values({
          userId: user.id,
          paymentType: input.paymentType,
          depositPaid: input.depositPaid,
          balancePaid: input.balancePaid,
          status: "active",
        })
        .$returningId();

      if (!newEnrollment) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create enrollment" });
      }

      // Create 6 coaching sessions
      const sessionValues = SESSION_LABELS.map((_, idx) => ({
        enrollmentId: newEnrollment.id,
        userId: user.id,
        sessionNumber: idx + 1,
        status: "not_scheduled" as const,
        adminNotes: input.notes ?? null,
      }));
      await db.insert(coachingSessions).values(sessionValues);

      console.log(`[Admin] Created enrollment ${newEnrollment.id} + 6 sessions for ${email} (user ${user.id})`);

      return {
        success: true,
        enrollmentId: newEnrollment.id,
        clientName: user.name ?? email,
        message: `Enrollment created for ${user.name ?? email}. 6 coaching sessions are ready in their portal.`,
      };
    }),

  /**
   * Admin: send a balance reminder email to a deposit-only client who hasn't paid the $397 balance.
   * Only works when balancePaid === false.
   */
  adminSendBalanceReminder: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Fetch enrollment + client info
      const rows = await db
        .select({
          id: enrollments.id,
          paymentType: enrollments.paymentType,
          balancePaid: enrollments.balancePaid,
          userId: enrollments.userId,
          clientName: users.name,
          clientEmail: users.email,
        })
        .from(enrollments)
        .leftJoin(users, eq(enrollments.userId, users.id))
        .where(eq(enrollments.id, input.enrollmentId))
        .limit(1);

      const row = rows[0];
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      if (row.paymentType !== "deposit") throw new TRPCError({ code: "BAD_REQUEST", message: "Client paid in full — no balance due" });
      if (row.balancePaid) throw new TRPCError({ code: "BAD_REQUEST", message: "Balance already paid" });
      if (!row.clientEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "No email on file for this client" });

      // Generate a real Stripe checkout session for the $397 balance
      let paymentUrl = "https://mindandbodyresetcoach.com/portal"; // fallback
      try {
        const stripe = getStripe();
        const checkoutSession = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          customer_email: row.clientEmail,
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
            user_id: row.userId.toString(),
            enrollment_id: row.id.toString(),
            customer_email: row.clientEmail,
            customer_name: row.clientName ?? "",
          },
          client_reference_id: row.userId.toString(),
          success_url: "https://mindandbodyresetcoach.com/portal?balance_paid=1",
          cancel_url: "https://mindandbodyresetcoach.com/portal",
        });
        if (checkoutSession.url) paymentUrl = checkoutSession.url;
      } catch (stripeErr) {
        console.error("[adminSendBalanceReminder] Stripe checkout creation failed:", stripeErr);
        // Fall back to portal URL — email still sends
      }

      const sent = await sendBalanceReminderEmail({
        clientEmail: row.clientEmail,
        clientName: row.clientName ?? row.clientEmail,
        paymentUrl,
      });

      if (!sent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send reminder email — check Resend configuration" });

      return { success: true, sentTo: row.clientEmail };
    }),

  // Admin: cancel an enrollment
  adminCancel: protectedProcedure
    .input(z.object({ enrollmentId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(enrollments)
        .set({ status: "cancelled" })
        .where(eq(enrollments.id, input.enrollmentId));

      return { success: true };
    }),

  // Admin: mark session complete, send post-session email + SMS
  completeSession: protectedProcedure
    .input(z.object({ sessionId: z.number(), adminNotes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: Record<string, unknown> = {
        status: "completed",
        completedAt: new Date(),
      };
      if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes;
      await db.update(coachingSessions).set(updateData).where(eq(coachingSessions.id, input.sessionId));

      // Fire post-session notifications asynchronously (don't block the response)
      void (async () => {
        try {
          // Fetch session details
          const sessionRows = await db
            .select()
            .from(coachingSessions)
            .where(eq(coachingSessions.id, input.sessionId))
            .limit(1);
          const session = sessionRows[0];
          if (!session) return;

          // Fetch client info via enrollment
          const enrollmentRows = await db
            .select({ userId: enrollments.userId })
            .from(enrollments)
            .where(eq(enrollments.id, session.enrollmentId))
            .limit(1);
          if (!enrollmentRows[0]) return;

          const clientRows = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, enrollmentRows[0].userId))
            .limit(1);
          const client = clientRows[0];
          if (!client) return;

          const isLastSession = session.sessionNumber === 6;
          const sessionLabel = SESSION_LABELS[session.sessionNumber - 1] ?? "";
          const portalUrl = "https://mindandbodyresetcoach.com/portal";

          // Send email
          await sendPostSessionEmail({
            clientEmail: client.email ?? "",
            clientName: client.name ?? "there",
            sessionNumber: session.sessionNumber,
            sessionLabel,
            adminNotes: input.adminNotes ?? session.adminNotes ?? null,
            isLastSession,
            portalUrl,
          });

          // Check for LMS module unlock
          const moduleRows = await db
            .select()
            .from(programModules)
            .where(eq(programModules.order, session.sessionNumber))
            .limit(1);
            
          const unlockedModule = moduleRows[0];
          if (unlockedModule && unlockedModule.isPublished) {
            // Give user access
            await db.insert(moduleProgress).values({
              userId: client.id,
              moduleId: unlockedModule.id,
            });
            
            // Notify them
            await sendModuleUnlockedEmail({
              clientEmail: client.email ?? "",
              clientName: client.name ?? "there",
              moduleTitle: unlockedModule.title,
              moduleOrder: unlockedModule.order,
            });
          }

          // Send SMS if client has a phone number stored
          // (phone field not yet in users table — scaffold ready for when it's added)
          // await sendPostSessionSMS({ clientPhone: client.phone, ... });
        } catch (err) {
          console.error("[completeSession] Notification error:", err);
        }
      })();

      return { success: true };
    }),

  // Admin: update session notes / meet link
  updateSession: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      googleMeetLink: z.string().optional(),
      adminNotes: z.string().optional(),
      privateNotes: z.string().optional(),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionId, ...rest } = input;
      const updateData: Record<string, unknown> = {};
      if (rest.googleMeetLink !== undefined) updateData.googleMeetLink = rest.googleMeetLink;
      if (rest.adminNotes !== undefined) updateData.adminNotes = rest.adminNotes;
      if (rest.privateNotes !== undefined) updateData.privateNotes = rest.privateNotes;
      if (rest.scheduledAt !== undefined) {
        updateData.scheduledAt = rest.scheduledAt;
        updateData.status = "scheduled";
      }
      await db.update(coachingSessions).set(updateData).where(eq(coachingSessions.id, sessionId));
      return { success: true };
    }),
});
