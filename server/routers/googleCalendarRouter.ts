import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getGoogleCalendarStatus, createCalendarEventWithMeet } from "../googleCalendar";
import { getDb } from "../db";
import { coachingSessions, enrollments, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

export const googleCalendarRouter = router({
  // Check if Google Calendar is connected for the current admin
  status: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    return getGoogleCalendarStatus(ctx.user!.id);
  }),

  // Admin: schedule a session and create a Google Meet event
  scheduleSession: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      scheduledAt: z.date(),
      durationMinutes: z.number().default(60),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get session + enrollment + client info
      const [session] = await db.select().from(coachingSessions).where(eq(coachingSessions.id, input.sessionId));
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, session.enrollmentId));
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });

      const [client] = await db.select().from(users).where(eq(users.id, enrollment.userId));

      // Try to create Google Calendar event with Meet link
      const calEvent = await createCalendarEventWithMeet({
        adminUserId: ctx.user!.id,
        summary: `Mind & Body Reset — Session ${session.sessionNumber} with ${client?.name ?? "Client"}`,
        description: `Coaching session ${session.sessionNumber} of 6 for the R.E.C.L.A.I.M. program.`,
        startTime: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        attendeeEmail: client?.email ?? undefined,
      });

      // Update session with scheduled time and meet link (if created)
      await db.update(coachingSessions).set({
        scheduledAt: input.scheduledAt,
        status: "scheduled",
        googleMeetLink: calEvent?.meetLink ?? null,
      }).where(eq(coachingSessions.id, input.sessionId));

      return {
        success: true,
        meetLink: calEvent?.meetLink ?? null,
        calendarLink: calEvent?.htmlLink ?? null,
        googleCalendarConnected: !!calEvent,
      };
    }),
});
