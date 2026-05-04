import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { enrollments, coachingSessions, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sendPostSessionEmail, sendPostSessionSMS } from "../notifications";

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
        enrolledAt: enrollments.enrolledAt,
        clientName: users.name,
        clientEmail: users.email,
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.userId, users.id))
      .orderBy(desc(enrollments.enrolledAt));
    return rows;
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
