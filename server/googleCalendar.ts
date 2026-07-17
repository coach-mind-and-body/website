/**
 * Google Calendar OAuth + API helpers
 * Handles: connect flow, token storage/refresh, event creation with Meet links
 */
import { getDb } from "./db";
import { googleTokens } from "../drizzle/schema";
import { and, eq, like, or } from "drizzle-orm";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { type Request } from "express";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

function getRedirectUri(req: Request) {
  const host = req.get("host") ?? "localhost:3000";
  const protocol = ENV.isProduction ? "https" : req.protocol;
  return `${protocol}://${host}/api/auth/google-calendar/callback`;
}

// ── Token helpers ─────────────────────────────────────────────────────────────

async function refreshAccessToken(userId: number, refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json() as { access_token?: string; expires_in?: number; error?: string };
    if (!data.access_token) return null;
    const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    const db = await getDb();
    if (!db) return null;
    await db
      .update(googleTokens)
      .set({ accessToken: data.access_token, expiresAt })
      .where(eq(googleTokens.userId, userId));
    return data.access_token;
  } catch {
    return null;
  }
}

export async function getValidAccessToken(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const [token] = await db.select().from(googleTokens).where(eq(googleTokens.userId, userId));
  if (!token) return null;
  if (token.expiresAt < Date.now() + 5 * 60 * 1000) {
    return refreshAccessToken(userId, token.refreshToken);
  }
  return token.accessToken;
}

export async function getGoogleCalendarStatus(userId: number): Promise<{ connected: boolean; email?: string }> {
  const db = await getDb();
  if (!db) return { connected: false };
  const [token] = await db.select().from(googleTokens).where(eq(googleTokens.userId, userId));
  return { connected: !!token, email: token?.email ?? undefined };
}

// ── Create a Calendar event with Google Meet ──────────────────────────────────

export interface CreateEventParams {
  adminUserId: number;
  summary: string;
  description?: string;
  startTime: Date;
  durationMinutes?: number;
  attendeeEmail?: string;
}

export interface CalendarEvent {
  eventId: string;
  meetLink: string;
  htmlLink: string;
}

export async function createCalendarEventWithMeet(params: CreateEventParams): Promise<CalendarEvent | null> {
  const { adminUserId, summary, description, startTime, durationMinutes = 60, attendeeEmail } = params;
  const accessToken = await getValidAccessToken(adminUserId);
  if (!accessToken) return null;

  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const body: Record<string, unknown> = {
    summary,
    description: description ?? "",
    start: { dateTime: startTime.toISOString(), timeZone: "America/Denver" },
    end: { dateTime: endTime.toISOString(), timeZone: "America/Denver" },
    conferenceData: {
      createRequest: {
        requestId: `mbr-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  if (attendeeEmail) {
    body.attendees = [{ email: attendeeEmail }];
  }

  try {
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const event = await res.json() as {
      id?: string;
      htmlLink?: string;
      conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
      error?: unknown;
    };
    if (!event.id) {
      console.error("Google Calendar event creation failed:", event);
      return null;
    }
    const meetEntry = event.conferenceData?.entryPoints?.find(e => e.entryPointType === "video");
    return {
      eventId: event.id,
      meetLink: meetEntry?.uri ?? "",
      htmlLink: event.htmlLink ?? "",
    };
  } catch (err) {
    console.error("createCalendarEventWithMeet error:", err);
    return null;
  }
}

export async function getUpcomingEventsForEmail(email: string) {
  const db = await getDb();
  if (!db) return [];

  const [adminToken] = await db.select().from(googleTokens).limit(1);
  if (!adminToken) return [];

  const accessToken = await getValidAccessToken(adminToken.userId);
  if (!accessToken) return [];

  const timeMin = new Date().toISOString();
  // Fetch next 30 days
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  // `q` parameter searches the event summary, description, attendees, etc.
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&q=${encodeURIComponent(email)}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json() as any;
    if (!data.items) return [];

    const events = data.items
      .filter((event: any) => event.status !== "cancelled" && event.start?.dateTime)
      .filter((event: any) => {
        // Ensure the email is actually an attendee or in the description/summary
        const attendeeEmails = (event.attendees ?? []).map((a: any) => a.email.toLowerCase());
        return attendeeEmails.includes(email.toLowerCase()) || 
               event.summary?.toLowerCase().includes(email.toLowerCase()) ||
               event.description?.toLowerCase().includes(email.toLowerCase());
      })
      .map((event: any) => {
        const meetEntry = event.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video");
        return {
          id: event.id,
          summary: event.summary,
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime),
          meetLink: meetEntry?.uri ?? "",
          htmlLink: event.htmlLink ?? "",
        };
      });

    return events;
  } catch (err) {
    console.error("getUpcomingEventsForEmail error:", err);
    return [];
  }
}

// ── Google Calendar Webhook (Push Notifications) ──────────────────────────────
// When a new event is created on Lee Anne's calendar via the booking page,
// Google sends a push notification to our webhook endpoint.
// We match the event to a coaching session by checking attendee email + time.
// We also upsert discovery-call bookings into the leads table.

import {
  coachingSessions,
  enrollments,
  users,
  leads,
  subscribers,
  sequenceEnrollments,
} from "../drizzle/schema";

// String IDs (avoid importing sequences.ts and risking circular deps)
const SNACK_HACK_SEQUENCE_ID = "snack_hack_nurture";
const FOOD_QUIZ_SEQUENCE_ID = "food_quiz_nurture";

type GCalEvent = {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    self?: boolean;
    organizer?: boolean;
  }>;
  conferenceData?: { entryPoints?: Array<{ entryPointType: string; uri: string }> };
  status?: string;
  htmlLink?: string;
  creator?: { email?: string };
  organizer?: { email?: string; displayName?: string };
};

function extractPhoneFromText(text: string): string | undefined {
  if (!text) return undefined;
  // Prefer labeled phone fields from Google Appointment Schedule forms
  const labeled = text.match(
    /(?:phone(?:\s*(?:number|#))?|mobile|cell|tel)\s*[:#\-]\s*([+\d(][\d\s().\-]{8,20}\d)/i
  );
  if (labeled?.[1]) {
    const cleaned = labeled[1].trim();
    if (/\d{7,}/.test(cleaned.replace(/\D/g, ""))) return cleaned;
  }
  const m = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return m?.[0]?.trim();
}

function extractNameFromDescription(description: string): string | undefined {
  const patterns = [
    /(?:^|\n)\s*(?:name|guest name|full name)\s*[:\-]\s*(.+)/i,
    /booked by\s+(.+)/i,
  ];
  for (const re of patterns) {
    const m = description.match(re);
    if (m?.[1]) return m[1].trim().split("\n")[0].slice(0, 120);
  }
  return undefined;
}

export type AdminCalendarEvent = {
  id: string;
  summary: string;
  description: string | null;
  startTime: string; // ISO
  endTime: string | null;
  htmlLink: string | null;
  meetLink: string | null;
  status: string;
  kind: "discovery" | "reclaim" | "fpu" | "other";
  guests: Array<{ email: string; name: string | null }>;
  phone: string | null;
};

function classifyEventKind(summary: string, description: string): AdminCalendarEvent["kind"] {
  const blob = `${summary} ${description}`.toLowerCase();
  if (/fpu|financial peace/.test(blob)) return "fpu";
  if (/reclaim|session\s*[1-6]|coaching session/.test(blob)) return "reclaim";
  if (/discovery|clarity|fit call|consultation|30[\s-]?min/.test(blob)) return "discovery";
  if (/appointment|booked|schedule|invitee|guest/.test(blob)) return "discovery";
  return "other";
}

/**
 * List all events on the connected admin Google Calendar for the admin UI.
 * Past 7 days → next 45 days (single-instance expanded).
 */
export async function listAdminCalendarEvents(opts?: {
  daysPast?: number;
  daysAhead?: number;
}): Promise<{ connected: boolean; events: AdminCalendarEvent[]; error?: string }> {
  const db = await getDb();
  if (!db) return { connected: false, events: [], error: "DB unavailable" };

  const [adminToken] = await db.select().from(googleTokens).limit(1);
  if (!adminToken) return { connected: false, events: [] };

  const accessToken = await getValidAccessToken(adminToken.userId);
  if (!accessToken) {
    return { connected: true, events: [], error: "Could not refresh Google token — reconnect Calendar in Settings" };
  }

  const daysPast = opts?.daysPast ?? 7;
  const daysAhead = opts?.daysAhead ?? 45;
  const timeMin = new Date(Date.now() - daysPast * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
  const adminEmail = adminToken.email?.toLowerCase();

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(timeMin)}` +
    `&timeMax=${encodeURIComponent(timeMax)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=150`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as { items?: GCalEvent[]; error?: { message?: string } };
    if (!res.ok || data.error) {
      return {
        connected: true,
        events: [],
        error: data.error?.message ?? `Google API error (${res.status})`,
      };
    }

    const events: AdminCalendarEvent[] = [];
    for (const event of data.items ?? []) {
      if (event.status === "cancelled") continue;
      // Include timed events; all-day optional skip for cleaner list
      const startIso = event.start?.dateTime;
      if (!startIso) continue;

      const description = event.description ?? "";
      const summary = event.summary?.trim() || "(No title)";
      const meetEntry = event.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      );
      // Meet link sometimes lives in description / hangoutLink-style fields
      const meetFromDesc =
        description.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0] ?? null;

      const guests = (event.attendees ?? [])
        .filter((a) => {
          if (!a.email) return false;
          if (a.self) return false;
          const em = a.email.toLowerCase();
          if (adminEmail && em === adminEmail) return false;
          if (event.organizer?.email && em === event.organizer.email.toLowerCase()) return false;
          return true;
        })
        .map((a) => ({
          email: a.email!.toLowerCase(),
          name: a.displayName?.trim() || null,
        }));

      events.push({
        id: event.id,
        summary,
        description: description || null,
        startTime: startIso,
        endTime: event.end?.dateTime ?? null,
        htmlLink: event.htmlLink ?? null,
        meetLink: meetEntry?.uri ?? meetFromDesc,
        status: event.status ?? "confirmed",
        kind: classifyEventKind(summary, description),
        guests,
        phone: extractPhoneFromText(description) ?? null,
      });
    }

    return { connected: true, events };
  } catch (err) {
    console.error("[GCal] listAdminCalendarEvents error:", err);
    return { connected: true, events: [], error: "Failed to fetch calendar events" };
  }
}

/** Appointment-schedule / discovery-style events (not random personal calendar noise). */
function isLikelyClientBooking(event: GCalEvent): boolean {
  const blob = `${event.summary ?? ""} ${event.description ?? ""}`.toLowerCase();
  return /discovery|clarity|consultation|fit call|reclaim|mind\s*(?:&|and)\s*body|coaching|appointment|booked|schedule|30[\s-]?min|50[\s-]?min|guest|invitee/i.test(
    blob
  );
}

function gcalEventNoteMarker(eventId: string): string {
  return `gcal_event:${eventId}`;
}

/**
 * Pull guest info from a calendar booking into the leads table.
 * Google Appointment Schedule already requires name + email for Meet;
 * we merge that into Admin → Contacts without a separate website form.
 * Same email as a snack-hack / quiz signup keeps all prior timeline + tags.
 */
async function upsertDiscoveryLeadFromCalendarEvent(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  event: GCalEvent,
  adminEmail: string | undefined
): Promise<void> {
  if (!isLikelyClientBooking(event)) return;
  if (!event.start?.dateTime) return;

  const marker = gcalEventNoteMarker(event.id);
  const existingByEvent = await db
    .select({ id: leads.id })
    .from(leads)
    .where(like(leads.notes, `%${marker}%`))
    .limit(1);
  if (existingByEvent.length > 0) return;

  const guests = (event.attendees ?? []).filter((a) => {
    if (!a.email) return false;
    if (a.self) return false;
    const email = a.email.toLowerCase();
    if (adminEmail && email === adminEmail.toLowerCase()) return false;
    if (event.organizer?.email && email === event.organizer.email.toLowerCase()) return false;
    return true;
  });

  if (guests.length === 0 || guests.length > 3) return;

  const description = event.description ?? "";
  const phoneFromDesc = extractPhoneFromText(description);
  const nameFromDesc = extractNameFromDescription(description);
  const scheduledAt = new Date(event.start.dateTime);
  const whenLabel = scheduledAt.toLocaleString("en-US", {
    timeZone: "America/Denver",
    dateStyle: "full",
    timeStyle: "short",
  });

  for (const guest of guests) {
    const email = guest.email!.toLowerCase().trim();
    const name =
      guest.displayName?.trim() ||
      nameFromDesc ||
      email.split("@")[0] ||
      "Discovery Call Guest";

    const noteBlock = [
      marker,
      `Booked via Google Calendar`,
      `When (MT): ${whenLabel}`,
      event.summary ? `Event: ${event.summary}` : null,
      phoneFromDesc ? `Phone: ${phoneFromDesc}` : null,
      event.htmlLink ? `Calendar: ${event.htmlLink}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const [existingLead] = await db
      .select()
      .from(leads)
      .where(eq(leads.email, email))
      .limit(1);

    const betterName = (current: string | null | undefined, incoming: string) => {
      if (!current || current === "Unknown" || current.toLowerCase() === email.split("@")[0]) {
        return incoming;
      }
      // Prefer a full name with a space over a single token if we get one
      if (incoming.includes(" ") && !current.includes(" ")) return incoming;
      return current;
    };

    if (existingLead) {
      const mergedNotes = existingLead.notes?.includes(marker)
        ? existingLead.notes
        : [existingLead.notes, noteBlock].filter(Boolean).join("\n\n");
      await db
        .update(leads)
        .set({
          name: betterName(existingLead.name, name),
          phone: existingLead.phone || phoneFromDesc || null,
          notes: mergedNotes,
        })
        .where(eq(leads.id, existingLead.id));
      console.log(`[GCal Sync] Updated lead #${existingLead.id} from calendar booking ${email}`);
    } else {
      await db.insert(leads).values({
        name,
        email,
        phone: phoneFromDesc ?? null,
        notes: noteBlock,
        status: "new",
      });
      console.log(`[GCal Sync] Created discovery lead from calendar: ${name} <${email}>`);

      try {
        const { sendOwnerEmail } = await import("./notifications");
        await sendOwnerEmail({
          subject: `Discovery Call Booked (Calendar): ${name}`,
          htmlBody: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#3a5a3a;">New discovery call on your calendar</h2>
              <p><strong>${name}</strong></p>
              <p>Email: <a href="mailto:${email}">${email}</a></p>
              ${phoneFromDesc ? `<p>Phone: ${phoneFromDesc}</p>` : ""}
              <p>When (Mountain): <strong>${whenLabel}</strong></p>
              ${event.summary ? `<p>Event: ${event.summary}</p>` : ""}
              ${event.htmlLink ? `<p><a href="${event.htmlLink}">Open in Google Calendar</a></p>` : ""}
              <p style="color:#888;font-size:13px;">Pulled automatically from Google Calendar booking (no website form).</p>
            </div>
          `,
          textBody: `Discovery call booked\n\n${name}\n${email}\n${phoneFromDesc ?? ""}\nWhen (MT): ${whenLabel}\n${event.htmlLink ?? ""}`,
        });
      } catch (err) {
        console.warn("[GCal Sync] Owner email failed (non-fatal):", err);
      }

      // Server-side conversion for Meta (replaces the old /book form Lead event)
      try {
        const { fireMetaPixelLead } = await import("./metaCapi");
        await fireMetaPixelLead({
          customerEmail: email,
          customerName: name,
          customerPhone: phoneFromDesc,
          contentName: "Discovery Call Booking (Google Calendar)",
          eventSourceUrl: "https://mindandbodyresetcoach.com/book",
          eventId: `gcal_${event.id}_${email}`,
        });
      } catch (err) {
        console.warn("[GCal Sync] Meta CAPI failed (non-fatal):", err);
      }
    }

    // Stop snack-hack / food-quiz nurture once they've booked a call
    try {
      const [sub] = await db
        .select({ id: subscribers.id })
        .from(subscribers)
        .where(eq(subscribers.email, email))
        .limit(1);
      if (sub) {
        await db
          .update(sequenceEnrollments)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(
            and(
              eq(sequenceEnrollments.userId, sub.id),
              eq(sequenceEnrollments.status, "active"),
              or(
                eq(sequenceEnrollments.sequenceId, SNACK_HACK_SEQUENCE_ID),
                eq(sequenceEnrollments.sequenceId, FOOD_QUIZ_SEQUENCE_ID)
              )
            )
          );
      }
    } catch (err) {
      console.warn("[GCal Sync] Sequence cancel failed (non-fatal):", err);
    }
  }
}

/**
 * Fetches events from Lee Anne's calendar (last 7 days → next 60 days) and:
 * 1) Auto-schedules matching R.E.C.L.A.I.M. coaching sessions
 * 2) Upserts discovery-call guests into the leads CRM
 */
export async function syncRecentCalendarEvents() {
  const db = await getDb();
  if (!db) return;

  // Get the admin's Google token (user id 1 = owner, or find first admin)
  const [adminToken] = await db.select().from(googleTokens).limit(1);
  if (!adminToken) return;

  const accessToken = await getValidAccessToken(adminToken.userId);
  if (!accessToken) return;

  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(timeMin)}` +
    `&timeMax=${encodeURIComponent(timeMax)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as { items?: GCalEvent[]; error?: unknown };
  if (!data.items) {
    if (data.error) console.error("[GCal Sync] API error:", data.error);
    return;
  }

  const adminEmail = adminToken.email?.toLowerCase();

  for (const event of data.items) {
    if (event.status === "cancelled") continue;
    if (!event.start?.dateTime) continue;

    const attendeeEmails = (event.attendees ?? [])
      .map((a) => a.email?.toLowerCase())
      .filter((e): e is string => !!e);
    if (attendeeEmails.length === 0) continue;

    const meetEntry = event.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    );
    const meetLink = meetEntry?.uri ?? "";

    let matchedCoachingSession = false;

    // Find a client by attendee email
    for (const email of attendeeEmails) {
      if (adminEmail && email === adminEmail) continue;

      const [matchedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!matchedUser) continue;

      // Find their active enrollment
      const [enrollment] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.userId, matchedUser.id))
        .limit(1);
      if (!enrollment) continue;

      // Find the next unscheduled session for this enrollment
      const unscheduledSessions = await db
        .select()
        .from(coachingSessions)
        .where(eq(coachingSessions.enrollmentId, enrollment.id));

      const nextSession = unscheduledSessions
        .filter((s) => s.status === "not_scheduled")
        .sort((a, b) => a.sessionNumber - b.sessionNumber)[0];

      if (!nextSession) continue;

      // Check if this event is already linked to a session
      const alreadyLinked = unscheduledSessions.some((s) => s.googleEventId === event.id);
      if (alreadyLinked) {
        matchedCoachingSession = true;
        break;
      }

      // Update the session with the scheduled time and meet link
      const scheduledAt = new Date(event.start.dateTime);
      await db
        .update(coachingSessions)
        .set({
          status: "scheduled",
          scheduledAt,
          googleEventId: event.id,
          googleMeetLink: meetLink || null,
        })
        .where(eq(coachingSessions.id, nextSession.id));

      console.log(
        `[GCal Sync] Auto-scheduled Session ${nextSession.sessionNumber} for user ${matchedUser.email} at ${event.start.dateTime}`
      );
      matchedCoachingSession = true;
      break;
    }

    // Discovery / public appointment bookings → leads CRM
    if (!matchedCoachingSession) {
      try {
        await upsertDiscoveryLeadFromCalendarEvent(db, event, adminEmail);
      } catch (err) {
        console.error("[GCal Sync] Discovery lead upsert failed:", err);
      }
    }
  }
}

/**
 * Register a Google Calendar push notification channel.
 * Call this once after connecting Google Calendar to start receiving webhooks.
 */
export async function registerCalendarWatchChannel(adminUserId: number, webhookUrl: string): Promise<{ channelId: string; expiration: number } | null> {
  const accessToken = await getValidAccessToken(adminUserId);
  if (!accessToken) return null;

  const channelId = `mbr-watch-${Date.now()}`;
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events/watch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: channelId,
      type: "web_hook",
      address: webhookUrl,
      params: { ttl: "604800" }, // 7 days
    }),
  });

  const data = await res.json() as { id?: string; expiration?: string; error?: unknown };
  if (!data.id) {
    console.error("[GCal] Watch channel registration failed:", data);
    return null;
  }

  return { channelId: data.id, expiration: parseInt(data.expiration ?? "0") };
}
