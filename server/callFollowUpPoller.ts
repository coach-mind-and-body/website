/**
 * callFollowUpPoller.ts
 *
 * Polls Google Calendar every 5 minutes looking for RECLAIM coaching sessions
 * that ended ~65 minutes ago (50-min session + 15-min buffer).
 *
 * When a completed session is found:
 *  - Identifies the client by their email (the non-Lee-Anne attendee)
 *  - Looks up their enrollment and determines which call number just ended
 *  - If it's calls 1–5: sends a follow-up email with the /reclaim booking link
 *  - If it's call #6: no follow-up email (program complete)
 *  - Marks the session as completed and records followUpEmailSentAt to prevent duplicates
 */

import { getDb } from "./db";
import { coachingSessions, enrollments, users, googleTokens, fpuCoachingSessions, fpuOrders } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getValidAccessToken } from "./googleCalendar";
import { sendTransactionalEmail } from "./notifications";
import { PROGRAM, GOOGLE_CALENDAR, BRAND } from "../shared/brand";

// Number of FPU 1:1 coaching sessions per client
const FPU_COACHING_SESSION_COUNT = 3;
const FPU_COACHING_BOOKING_URL = "https://calendar.app.google/yRUeVUq92caSbC2P9";

// How long a RECLAIM session lasts (minutes)
const SESSION_DURATION_MINS = PROGRAM.sessionDurationMins; // 50

// How many minutes after session start we wait before sending the follow-up
// (session duration + 25 min buffer = 75 min)
const FOLLOWUP_DELAY_MINS = SESSION_DURATION_MINS + 25; // 75

// Window in which we look for "just completed" sessions (to avoid double-sending)
// We look for events that started between 75 and 90 minutes ago
const WINDOW_MINS = 15;

// Maximum number of attendees for a RECLAIM session (Lee Anne + 1 client)
const MAX_ATTENDEES = 2;

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  attendees?: Array<{ email: string; self?: boolean }>;
  status?: string;
}

/**
 * Fetches Google Calendar events that started in the follow-up detection window.
 * Returns events that started between (now - 80min) and (now - 65min).
 */
async function fetchRecentlyEndedEvents(accessToken: string): Promise<CalendarEvent[]> {
  const now = Date.now();
  const windowStart = new Date(now - (FOLLOWUP_DELAY_MINS + WINDOW_MINS) * 60 * 1000);
  const windowEnd = new Date(now - FOLLOWUP_DELAY_MINS * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: windowStart.toISOString(),
    timeMax: windowEnd.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    console.error("[CallPoller] Failed to fetch calendar events:", res.status, await res.text());
    return [];
  }

  const data = await res.json() as { items?: CalendarEvent[] };
  return data.items ?? [];
}

/**
 * Builds the HTML follow-up email for a RECLAIM session.
 */
function buildFollowUpEmail(params: {
  clientName: string;
  sessionNumber: number;
  bookingUrl: string;
  siteUrl: string;
}): { subject: string; html: string; text: string } {
  const { clientName, sessionNumber, bookingUrl, siteUrl } = params;
  const nextSession = sessionNumber + 1;
  const firstName = clientName.split(" ")[0] || clientName;

  const subject = `Great work today, ${firstName}! Ready to book Session ${nextSession}?`;

  const html = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <!-- Header -->
      <div style="background:#5a7a52;padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.02em;">
          Mind &amp; Body Reset
        </h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
          with Lee Anne
        </p>
      </div>

      <!-- Body -->
      <div style="padding:36px 40px;">
        <p style="color:#3a3a3a;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Hi ${firstName},
        </p>
        <p style="color:#3a3a3a;font-size:16px;line-height:1.6;margin:0 0 16px;">
          You did great work in <strong>Session ${sessionNumber}</strong> today! 
          Every call is another step forward — you should be proud of showing up for yourself.
        </p>
        <p style="color:#3a3a3a;font-size:16px;line-height:1.6;margin:0 0 24px;">
          When you're ready, go ahead and book <strong>Session ${nextSession} of ${PROGRAM.sessionCount}</strong> 
          to keep the momentum going. Consistency is where the real transformation happens!
        </p>

        <!-- CTA Button -->
        <div style="text-align:center;margin:32px 0;">
          <a href="${bookingUrl}"
             style="display:inline-block;background:#c9a96e;color:#ffffff;padding:14px 36px;
                    border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px;
                    letter-spacing:0.03em;">
            Book Session ${nextSession} →
          </a>
        </div>

        <p style="color:#6a6a6a;font-size:14px;line-height:1.6;margin:0 0 8px;">
          You have <strong>${PROGRAM.sessionCount - sessionNumber} session${PROGRAM.sessionCount - sessionNumber === 1 ? "" : "s"}</strong> remaining in your R.E.C.L.A.I.M. program.
        </p>
        <p style="color:#6a6a6a;font-size:14px;line-height:1.6;margin:0;">
          If you have any questions before our next call, just reply to this email — 
          I'm here for you!
        </p>

        <hr style="border:none;border-top:1px solid #e8e0d8;margin:32px 0;" />

        <p style="color:#9a9a9a;font-size:12px;text-align:center;margin:0;">
          Mind &amp; Body Reset with Lee Anne &nbsp;|&nbsp;
          <a href="${siteUrl}/reclaim" style="color:#c9a96e;text-decoration:none;">R.E.C.L.A.I.M. Program</a>
        </p>
      </div>
    </div>
  `;

  const text = `Hi ${firstName},\n\nYou did great work in Session ${sessionNumber} today!\n\nWhen you're ready, book Session ${nextSession} here:\n${bookingUrl}\n\nYou have ${PROGRAM.sessionCount - sessionNumber} session(s) remaining in your R.E.C.L.A.I.M. program.\n\nIf you have any questions, just reply to this email!\n\n— Lee Anne\nMind & Body Reset`;

  return { subject, html, text };
}

/**
 * Main polling function — called every 5 minutes.
 * Checks for sessions that ended ~65 minutes ago and sends follow-up emails.
 */
export async function pollForCompletedSessions(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get the admin's Google Calendar access token
  const [adminToken] = await db.select().from(googleTokens).limit(1);
  if (!adminToken) {
    console.log("[CallPoller] No Google Calendar token found — skipping poll");
    return;
  }

  const accessToken = await getValidAccessToken(adminToken.userId);
  if (!accessToken) {
    console.log("[CallPoller] Could not get valid access token — skipping poll");
    return;
  }

  // Get Lee Anne's email from the stored token
  const leeAnneEmail = adminToken.email?.toLowerCase() ?? "";

  // Fetch events that started in the detection window
  const events = await fetchRecentlyEndedEvents(accessToken);

  if (events.length === 0) {
    console.log("[CallPoller] No events in detection window");
    return;
  }

  console.log(`[CallPoller] Found ${events.length} event(s) in detection window`);

  for (const event of events) {
    if (event.status === "cancelled") continue;
    if (!event.start?.dateTime) continue;

    const attendees = event.attendees ?? [];

    // Only process 1-on-1 meetings (Lee Anne + 1 client)
    if (attendees.length === 0 || attendees.length > MAX_ATTENDEES) continue;

    // Find the client email (the attendee who is NOT Lee Anne)
    const clientAttendee = attendees.find(
      (a) => a.email.toLowerCase() !== leeAnneEmail && !a.self
    );
    if (!clientAttendee) continue;

    const clientEmail = clientAttendee.email.toLowerCase();

    // Look up the client in the database
    const [clientUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, clientEmail))
      .limit(1);

    // Also check for FPU coaching clients (they may not have a website account)
    // FPU coaching is tracked by email in fpuOrders, not by user account
    await processFpuCoachingSession(clientEmail, event.id ?? "").catch((err) =>
      console.error(`[CallPoller] FPU coaching check error for ${clientEmail}:`, err)
    );

    if (!clientUser) {
      console.log(`[CallPoller] No user found for email: ${clientEmail} — skipping RECLAIM check`);
      continue;
    }

    // Find their active RECLAIM enrollment
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, clientUser.id),
          eq(enrollments.status, "active")
        )
      )
      .limit(1);

    if (!enrollment) {
      console.log(`[CallPoller] No active RECLAIM enrollment for user ${clientEmail} — skipping RECLAIM check`);
      continue;
    }

    // Find the session linked to this Google Calendar event
    // OR find the most recently scheduled session that hasn't had a follow-up sent
    let targetSession = null;

    // First: try to match by googleEventId
    if (event.id) {
      const sessions = await db
        .select()
        .from(coachingSessions)
        .where(
          and(
            eq(coachingSessions.enrollmentId, enrollment.id),
            eq(coachingSessions.googleEventId, event.id)
          )
        )
        .limit(1);
      if (sessions.length > 0) {
        targetSession = sessions[0];
      }
    }

    // Fallback: find the earliest scheduled session without a follow-up email
    if (!targetSession) {
      const sessions = await db
        .select()
        .from(coachingSessions)
        .where(
          and(
            eq(coachingSessions.enrollmentId, enrollment.id),
            isNull(coachingSessions.followUpEmailSentAt)
          )
        );

      // Pick the session scheduled closest to the event start time
      const eventStart = new Date(event.start.dateTime).getTime();
      const scheduled = sessions
        .filter((s) => s.scheduledAt !== null)
        .sort((a, b) => {
          const diffA = Math.abs((a.scheduledAt?.getTime() ?? 0) - eventStart);
          const diffB = Math.abs((b.scheduledAt?.getTime() ?? 0) - eventStart);
          return diffA - diffB;
        });

      if (scheduled.length > 0) {
        const closest = scheduled[0];
        // Only match if the scheduled time is within 30 minutes of the event start
        const diff = Math.abs((closest.scheduledAt?.getTime() ?? 0) - eventStart);
        if (diff <= 30 * 60 * 1000) {
          targetSession = closest;
        }
      }

      // Last resort: pick the lowest-numbered unprocessed session
      if (!targetSession) {
        const unprocessed = sessions
          .filter((s) => s.status !== "completed")
          .sort((a, b) => a.sessionNumber - b.sessionNumber);
        if (unprocessed.length > 0) {
          targetSession = unprocessed[0];
        }
      }
    }

    if (!targetSession) {
      console.log(`[CallPoller] No matching session found for ${clientEmail} / event ${event.id}`);
      continue;
    }

    // Skip if we already sent a follow-up for this session
    if (targetSession.followUpEmailSentAt) {
      console.log(`[CallPoller] Follow-up already sent for session ${targetSession.id} — skipping`);
      continue;
    }

    const sessionNumber = targetSession.sessionNumber;
    const isLastSession = sessionNumber >= PROGRAM.sessionCount;

    // Mark session as completed
    await db
      .update(coachingSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
        followUpEmailSentAt: new Date(),
      })
      .where(eq(coachingSessions.id, targetSession.id));

    console.log(`[CallPoller] Marked Session ${sessionNumber} as completed for ${clientEmail}`);

    // Send follow-up email for sessions 1–5 only
    if (!isLastSession) {
      const clientName = clientUser.name ?? clientEmail;
      const { subject, html, text } = buildFollowUpEmail({
        clientName,
        sessionNumber,
        bookingUrl: GOOGLE_CALENDAR.reclaimSession,
        siteUrl: BRAND.website,
      });

      const sent = await sendTransactionalEmail({
        to: clientEmail,
        toName: clientName,
        subject,
        htmlBody: html,
        textBody: text,
      });

      if (sent) {
        console.log(`[CallPoller] ✅ Follow-up email sent to ${clientEmail} after Session ${sessionNumber}`);
      } else {
        console.warn(`[CallPoller] ⚠️ Failed to send follow-up email to ${clientEmail} — email service may not be configured`);
      }
    } else {
      console.log(`[CallPoller] Session ${sessionNumber} is the final session for ${clientEmail} — no follow-up email sent`);
      // Optionally mark enrollment as completed
      await db
        .update(enrollments)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(enrollments.id, enrollment.id));
    }
  }
}

/**
 * Processes FPU coaching sessions for a client email.
 * Marks the next unprocessed session as completed and sends a follow-up email
 * for sessions 1 and 2 only (no email after session 3).
 */
async function processFpuCoachingSession(clientEmail: string, eventId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Find the paid FPU coaching order for this client
  const [order] = await db
    .select()
    .from(fpuOrders)
    .where(
      and(
        eq(fpuOrders.clientEmail, clientEmail),
        eq(fpuOrders.status, "paid"),
        eq(fpuOrders.productType, "fpu_coaching")
      )
    )
    .limit(1);

  if (!order) {
    console.log(`[CallPoller] No paid FPU coaching order for ${clientEmail} — skipping`);
    return;
  }

  // Find the next unprocessed FPU coaching session
  const sessions = await db
    .select()
    .from(fpuCoachingSessions)
    .where(
      and(
        eq(fpuCoachingSessions.fpuOrderId, order.id),
        isNull(fpuCoachingSessions.followUpEmailSentAt)
      )
    );

  if (sessions.length === 0) {
    console.log(`[CallPoller] All FPU coaching sessions already processed for ${clientEmail}`);
    return;
  }

  // Pick the lowest-numbered unprocessed session
  const targetSession = sessions.sort((a, b) => a.sessionNumber - b.sessionNumber)[0];

  const sessionNumber = targetSession.sessionNumber;
  const isLastSession = sessionNumber >= FPU_COACHING_SESSION_COUNT;

  // Mark session as completed
  await db
    .update(fpuCoachingSessions)
    .set({
      completedAt: new Date(),
      followUpEmailSentAt: new Date(),
      googleEventId: eventId,
    })
    .where(eq(fpuCoachingSessions.id, targetSession.id));

  console.log(`[CallPoller] Marked FPU Coaching Session ${sessionNumber} as completed for ${clientEmail}`);

  // Send follow-up email for sessions 1 and 2 only
  if (!isLastSession) {
    const clientName = targetSession.clientName ?? clientEmail;
    const firstName = clientName.split(" ")[0] || clientName;
    const nextSession = sessionNumber + 1;

    const subject = `Great work today, ${firstName}! Ready to book FPU Coaching Session ${nextSession}?`;
    const html = `
      <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:#3a5a3a;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Mind &amp; Body Reset</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Financial Peace University Coaching</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#3a3a3a;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${firstName},</p>
          <p style="color:#3a3a3a;font-size:16px;line-height:1.6;margin:0 0 16px;">
            You did amazing work in <strong>FPU Coaching Session ${sessionNumber}</strong> today! 
            Every conversation is building your financial confidence — keep going!
          </p>
          <p style="color:#3a3a3a;font-size:16px;line-height:1.6;margin:0 0 24px;">
            When you're ready, go ahead and book <strong>Session ${nextSession} of ${FPU_COACHING_SESSION_COUNT}</strong> 
            to keep the momentum going.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${FPU_COACHING_BOOKING_URL}"
               style="display:inline-block;background:#c9a96e;color:#ffffff;padding:14px 36px;
                      border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px;">
              Book Session ${nextSession} →
            </a>
          </div>
          <p style="color:#6a6a6a;font-size:14px;line-height:1.6;margin:0 0 8px;">
            You have <strong>${FPU_COACHING_SESSION_COUNT - sessionNumber} session${FPU_COACHING_SESSION_COUNT - sessionNumber === 1 ? "" : "s"}</strong> remaining in your FPU coaching package.
          </p>
          <hr style="border:none;border-top:1px solid #e8e0d8;margin:32px 0;" />
          <p style="color:#9a9a9a;font-size:12px;text-align:center;margin:0;">
            Mind &amp; Body Reset with Lee Anne &nbsp;|&nbsp;
            <a href="${BRAND.website}/financial-peace" style="color:#c9a96e;text-decoration:none;">Financial Peace University</a>
          </p>
        </div>
      </div>
    `;
    const text = `Hi ${firstName},\n\nYou did amazing work in FPU Coaching Session ${sessionNumber} today!\n\nWhen you're ready, book Session ${nextSession} here:\n${FPU_COACHING_BOOKING_URL}\n\nYou have ${FPU_COACHING_SESSION_COUNT - sessionNumber} session(s) remaining.\n\n— Lee Anne\nMind & Body Reset`;

    const sent = await sendTransactionalEmail({
      to: clientEmail,
      toName: clientName,
      subject,
      htmlBody: html,
      textBody: text,
    });

    if (sent) {
      console.log(`[CallPoller] ✅ FPU Coaching follow-up email sent to ${clientEmail} after Session ${sessionNumber}`);
    } else {
      console.warn(`[CallPoller] ⚠️ Failed to send FPU Coaching follow-up to ${clientEmail}`);
    }
  } else {
    console.log(`[CallPoller] FPU Coaching Session ${sessionNumber} is the final session for ${clientEmail} — no follow-up email`);
  }
}

/**
 * Starts the polling loop. Runs immediately, then every 5 minutes.
 * Call this once from server startup.
 */
export function startCallFollowUpPoller(): void {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  console.log("[CallPoller] Starting call follow-up polling service (every 5 minutes)");

  const tick = async () => {
    // Pull new discovery bookings + coaching session links into CRM/DB
    try {
      const { syncRecentCalendarEvents } = await import("./googleCalendar");
      await syncRecentCalendarEvents();
    } catch (err) {
      console.error("[CallPoller] Calendar sync error:", err);
    }
    await pollForCompletedSessions();
  };

  // Run immediately on startup (catches any missed sessions from server restarts)
  tick().catch((err) => console.error("[CallPoller] Initial poll error:", err));

  // Then run every 5 minutes
  setInterval(() => {
    tick().catch((err) => console.error("[CallPoller] Poll error:", err));
  }, INTERVAL_MS);
}
