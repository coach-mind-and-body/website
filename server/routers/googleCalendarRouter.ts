import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getGoogleCalendarStatus,
  createCalendarEventWithMeet,
  listAdminCalendarEvents,
  syncRecentCalendarEvents,
} from "../googleCalendar";
import { getDb } from "../db";
import { coachingSessions, enrollments, users, leads } from "../../drizzle/schema";
import { asc, eq } from "drizzle-orm";
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

  /** All timed events from the connected Google Calendar (discovery + RECLAIM + other). */
  listAllEvents: protectedProcedure
    .input(
      z
        .object({
          daysPast: z.number().int().min(0).max(60).optional(),
          daysAhead: z.number().int().min(1).max(90).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      return listAdminCalendarEvents({
        daysPast: input?.daysPast,
        daysAhead: input?.daysAhead,
      });
    }),

  /** Manually pull calendar bookings into CRM (leads + RECLAIM session links). */
  syncNow: protectedProcedure.mutation(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    await syncRecentCalendarEvents();
    return { success: true };
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
        summary: `Mind & Body Reset Coaches — Session ${session.sessionNumber} with ${client?.name ?? "Client"}`,
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

  /**
   * Admin: schedule any meeting (discovery call, ad-hoc, etc.) for a contact.
   * Creates a Google Calendar event with Meet and invites the contact by email.
   * Optionally logs the booking on the lead record.
   */
  scheduleMeeting: protectedProcedure
    .input(
      z.object({
        attendeeEmail: z.string().email(),
        attendeeName: z.string().min(1).max(200),
        scheduledAt: z.date(),
        durationMinutes: z.number().int().min(15).max(180).default(30),
        meetingType: z.enum(["discovery", "general"]).default("discovery"),
        leadId: z.number().int().positive().optional(),
        title: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);

      if (input.scheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please pick a time in the future",
        });
      }

      const name = input.attendeeName.trim();
      const email = input.attendeeEmail.trim().toLowerCase();
      const isDiscovery = input.meetingType === "discovery";

      const summary =
        input.title?.trim() ||
        (isDiscovery
          ? `Discovery Call with ${name}`
          : `Meeting with ${name}`);

      const description = [
        isDiscovery
          ? "Free 30-minute discovery call — Mind & Body Reset Coaches."
          : "Meeting scheduled from admin contacts — Mind & Body Reset Coaches.",
        `Guest: ${name}`,
        `Email: ${email}`,
      ].join("\n");

      const calEvent = await createCalendarEventWithMeet({
        adminUserId: ctx.user!.id,
        summary,
        description,
        startTime: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        attendeeEmail: email,
      });

      if (!calEvent) {
        const status = await getGoogleCalendarStatus(ctx.user!.id);
        if (!status.connected) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Google Calendar is not connected. Connect it in Admin → Settings to create Meet links.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Google Calendar event. Try reconnecting Calendar in Settings.",
        });
      }

      // Log on lead notes + bump status new → contacted (by leadId or email)
      {
        const db = await getDb();
        if (db) {
          let lead =
            input.leadId != null
              ? (
                  await db
                    .select()
                    .from(leads)
                    .where(eq(leads.id, input.leadId))
                    .limit(1)
                )[0]
              : undefined;

          // Fallback: match by email (handles contacts merged from multiple lead rows)
          if (!lead) {
            const byEmail = await db
              .select()
              .from(leads)
              .where(eq(leads.email, email))
              .orderBy(asc(leads.id))
              .limit(1);
            lead = byEmail[0];
          }

          // Prefer the provided leadId's email match if leadId pointed at a stale/dupe row
          if (lead && input.leadId != null && lead.email.toLowerCase() !== email) {
            const byEmail = await db
              .select()
              .from(leads)
              .where(eq(leads.email, email))
              .orderBy(asc(leads.id))
              .limit(1);
            if (byEmail[0]) lead = byEmail[0];
          }

          if (lead) {
            const whenLabel = input.scheduledAt.toLocaleString("en-US", {
              timeZone: "America/Denver",
              dateStyle: "full",
              timeStyle: "short",
            });
            const noteBlock = [
              `Scheduled ${isDiscovery ? "discovery call" : "meeting"} (admin)`,
              `When (MT): ${whenLabel}`,
              `Duration: ${input.durationMinutes} min`,
              calEvent.meetLink ? `Meet: ${calEvent.meetLink}` : null,
              calEvent.htmlLink ? `Calendar: ${calEvent.htmlLink}` : null,
              calEvent.eventId ? `gcal_event:${calEvent.eventId}` : null,
            ]
              .filter(Boolean)
              .join("\n");

            const mergedNotes = [lead.notes, noteBlock].filter(Boolean).join("\n\n");
            await db
              .update(leads)
              .set({
                notes: mergedNotes,
                ...(lead.status === "new" ? { status: "contacted" as const } : {}),
              })
              .where(eq(leads.id, lead.id));
          }
        }
      }

      return {
        success: true,
        meetLink: calEvent.meetLink || null,
        calendarLink: calEvent.htmlLink || null,
        eventId: calEvent.eventId,
        googleCalendarConnected: true,
      };
    }),
});
