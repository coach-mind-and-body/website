import { z } from "zod";
import { and, eq, desc, asc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { challenges, enrollments, coachingSessions, holidayApplications, users, programModules, moduleProgress } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sendPostSessionEmail, sendPostSessionSMS, sendBalanceReminderEmail, sendModuleUnlockedEmail, sendWelcomeAndSetPasswordEmail } from "../notifications";
import Stripe from "stripe";
import { ENV } from "../_core/env";
import { PROGRAM_IDS } from "@shared/programs";
import { holidayFlags } from "@shared/holidayCoaching";
import { ensureProgramEnrollmentSchema } from "../ensureProgramSchema";
import { drizzleEnrollmentStore, searchClients } from "../enrollmentStore";
import { acceptHolidayApplication, EnrollmentConflictError, enrollInPrograms } from "../programEnrollment";
import { enrollUserInSequence } from "../sequences";

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
    // Portal and module unlocks still follow the Reclaim enrollment.
    // Another program on the same person must not hide it.
    const result = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, ctx.user!.id), eq(enrollments.program, "reclaim")))
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
        program: enrollments.program,
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

  // Admin: list all users
  adminListAllUsers: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    
    // Get all users
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    // Get all enrollments to map status
    const allEnrollments = await db.select().from(enrollments);
    
    return allUsers.map(user => {
      const mine = allEnrollments.filter(e => e.userId === user.id);
      const enrollment =
        mine.find(e => e.program === "reclaim" && e.status === "active") ??
        mine.find(e => e.status === "active") ??
        mine[0];
      return {
        id: enrollment?.id ?? -user.id, // Negative ID for users without enrollment
        userId: user.id,
        program: enrollment?.program ?? null,
        programs: mine.map(e => e.program),
        status: enrollment?.status ?? "habit-only",
        paymentType: enrollment?.paymentType ?? null,
        depositPaid: enrollment?.depositPaid ?? false,
        balancePaid: enrollment?.balancePaid ?? false,
        enrolledAt: enrollment?.enrolledAt ?? user.createdAt,
        clientName: user.name,
        clientEmail: user.email,
        shareHabitsWithCoach: user.shareHabitsWithCoach,
      };
    }).sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
  }),

  // Admin: get all upcoming scheduled sessions across all users
  adminUpcomingSessions: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    
    const upcoming = await db
      .select({
        id: coachingSessions.id,
        sessionNumber: coachingSessions.sessionNumber,
        scheduledAt: coachingSessions.scheduledAt,
        googleMeetLink: coachingSessions.googleMeetLink,
        clientName: users.name,
        clientEmail: users.email,
        userId: users.id,
        enrollmentId: coachingSessions.enrollmentId,
      })
      .from(coachingSessions)
      .innerJoin(users, eq(coachingSessions.userId, users.id))
      .where(eq(coachingSessions.status, "scheduled"))
      .orderBy(asc(coachingSessions.scheduledAt));

    return upcoming.filter(s => {
      if (!s.scheduledAt) return false;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return s.scheduledAt > oneHourAgo;
    });
  }),

  /**
   * Admin: enroll a person in one or more programs.
   * Creates the account when needed and sends one set-password welcome.
   * The same program twice is skipped. Reclaim still opens six sessions.
   */
  adminCreate: protectedProcedure
    .input(z.object({
      clientEmail: z.string().email(),
      clientName: z.string().trim().min(1).max(200).optional(),
      phone: z.string().trim().max(40).optional(),
      program: z.enum(PROGRAM_IDS).optional(),
      programs: z.array(z.enum(PROGRAM_IDS)).max(PROGRAM_IDS.length).optional(),
      paymentType: z.enum(["full", "deposit"]).default("deposit"),
      depositPaid: z.boolean().default(true),
      balancePaid: z.boolean().default(false),
      notes: z.string().optional(),
      challengeId: z.number().int().positive().optional(),
      applicationId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await ensureProgramEnrollmentSchema(db);

      const programs = [...new Set(input.programs?.length ? input.programs : [input.program ?? "reclaim"])];
      if (programs.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pick at least one program." });
      }

      let challengeThemeTag: string | null = null;
      if (programs.includes("challenge") && input.challengeId) {
        const [challenge] = await db
          .select({ id: challenges.id, themeTag: challenges.themeTag })
          .from(challenges)
          .where(eq(challenges.id, input.challengeId))
          .limit(1);
        if (!challenge) {
          throw new TRPCError({ code: "NOT_FOUND", message: "That challenge doesn't exist." });
        }
        challengeThemeTag = challenge.themeTag;
      }

      const store = drizzleEnrollmentStore(db);
      try {
        const result = await enrollInPrograms(
          store,
          {
            email: input.clientEmail,
            name: input.clientName,
            phone: input.phone,
            programs,
            payment: {
              paymentType: input.paymentType,
              depositPaid: input.depositPaid,
              balancePaid: input.paymentType === "full" ? input.depositPaid || input.balancePaid : input.balancePaid,
            },
            notes: input.notes,
            challengeId: programs.includes("challenge") ? input.challengeId : undefined,
            challengeThemeTag,
          },
          {
            sendWelcome: sendWelcomeAndSetPasswordEmail,
            startSequence: enrollUserInSequence,
          }
        );
        const metabolic =
          result.enrolled.find((row) => row.program === "metabolic") ??
          result.already.find((row) => row.program === "metabolic");
        if (input.applicationId && metabolic) {
          await store.markHolidayAccepted(input.applicationId, metabolic.enrollmentId, new Date());
        }
        return {
          success: true as const,
          enrollmentId: result.enrolled[0]?.enrollmentId ?? metabolic?.enrollmentId ?? 0,
          clientName: result.clientName,
          programs: result.enrolled.map((row) => row.program),
          message: result.message,
        };
      } catch (err) {
        if (err instanceof EnrollmentConflictError) {
          throw new TRPCError({ code: "CONFLICT", message: err.message });
        }
        throw err;
      }
    }),

  adminSearchClients: protectedProcedure
    .input(z.object({ query: z.string().trim().min(2).max(200) }))
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) return [];
      const rows = await searchClients(db, input.query);
      return rows.filter((row) => row.email);
    }),

  adminListHolidayApplications: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    await ensureProgramEnrollmentSchema(db);
    const rows = await db
      .select()
      .from(holidayApplications)
      .orderBy(desc(holidayApplications.createdAt));
    return rows.map((row) => ({
      ...row,
      flags: holidayFlags(row),
    }));
  }),

  adminAcceptHolidayApplication: protectedProcedure
    .input(z.object({ applicationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await ensureProgramEnrollmentSchema(db);
      try {
        const result = await acceptHolidayApplication(drizzleEnrollmentStore(db), input.applicationId, {
          sendWelcome: sendWelcomeAndSetPasswordEmail,
          startSequence: enrollUserInSequence,
        });
        return {
          success: true as const,
          enrollmentId: result.enrollmentId,
          alreadyAccepted: result.alreadyAccepted,
          message: result.message,
        };
      } catch (err) {
        if (err instanceof Error && err.message === "Application not found") {
          throw new TRPCError({ code: "NOT_FOUND", message: "That application isn't here." });
        }
        throw err;
      }
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
          // Omit payment_method_types so Stripe dynamic methods can show Apple Pay, Google Pay, Link, etc.
          phone_number_collection: { enabled: true },
          customer_email: row.clientEmail,
          line_items: [{
            price_data: {
              currency: "usd",
              unit_amount: 39700,
              product_data: {
                name: "R.E.C.L.A.I.M. 6-Week Mind & Body Reset Coaches — Balance Payment",
                description: "Remaining balance for your 6-Week Mind & Body Reset Coaches program.",
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
            .select({ id: users.id, name: users.name, email: users.email })
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
