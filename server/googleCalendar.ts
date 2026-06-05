/**
 * Google Calendar OAuth + API helpers
 * Handles: connect flow, token storage/refresh, event creation with Meet links
 */
import type { Express, Request } from "express";
import { getDb } from "./db";
import { googleTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

function getRedirectUri(req: Request) {
  const host = req.get("host") ?? "localhost:3000";
  const protocol = ENV.isProduction ? "https" : req.protocol;
  return `${protocol}://${host}/api/auth/google-calendar/callback`;
}

export function registerGoogleCalendarRoutes(app: Express) {
  // Step 1: Redirect admin to Google consent screen
  app.get("/api/auth/google-calendar/connect", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }
      const redirectUri = getRedirectUri(req);
      const params = new URLSearchParams({
        client_id: ENV.googleClientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: String(user.id),
      });
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    } catch {
      res.status(403).json({ error: "Not authenticated" });
    }
  });

  // Step 2: Handle callback, exchange code for tokens, store them
  app.get("/api/auth/google-calendar/callback", async (req, res) => {
    const { code, state, error } = req.query as Record<string, string>;
    if (error || !code || !state) {
      return res.redirect("/admin?gcal=error");
    }
    try {
      const redirectUri = getRedirectUri(req);
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json() as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        error?: string;
      };
      if (tokenData.error || !tokenData.access_token) {
        console.error("Google token exchange failed:", tokenData);
        return res.redirect("/admin?gcal=error");
      }

      // Get the calendar owner's email
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await profileRes.json() as { email?: string };

      const userId = parseInt(state);
      const expiresAt = Date.now() + tokenData.expires_in * 1000;

      const db = await getDb();
      if (!db) return res.redirect("/admin?gcal=error");

      await db
        .insert(googleTokens)
        .values({
          userId,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
          email: profile.email ?? null,
        })
        .onDuplicateKeyUpdate({
          set: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt,
            email: profile.email ?? null,
          },
        });

      res.redirect("/admin?gcal=connected");
    } catch (err) {
      console.error("Google Calendar callback error:", err);
      res.redirect("/admin?gcal=error");
    }
  });

  // Step 3: Disconnect (delete tokens)
  app.delete("/api/auth/google-calendar/disconnect", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable" });
      await db.delete(googleTokens).where(eq(googleTokens.userId, user.id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to disconnect" });
    }
  });
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

import { coachingSessions, enrollments, users } from "../drizzle/schema";

export function registerGoogleCalendarWebhook(app: Express) {
  /**
   * POST /api/google-calendar/webhook
   * Receives push notifications from Google Calendar.
   * Google sends a sync notification when any event changes.
   * We then poll the calendar for recent events and match them to sessions.
   */
  app.post("/api/google-calendar/webhook", async (req, res) => {
    // Acknowledge immediately (Google requires 200 within 10s)
    res.status(200).send("OK");

    const channelId = req.headers["x-goog-channel-id"] as string;
    const resourceState = req.headers["x-goog-resource-state"] as string;

    // Ignore sync messages (initial handshake)
    if (resourceState === "sync") return;

    console.log(`[GCal Webhook] Notification received: state=${resourceState}, channel=${channelId}`);

    try {
      await syncRecentCalendarEvents();
    } catch (err) {
      console.error("[GCal Webhook] Sync error:", err);
    }
  });
}

/**
 * Fetches events created/updated in the last 24 hours from Lee Anne's calendar
 * and auto-schedules any matching coaching sessions.
 */
export async function syncRecentCalendarEvents() {
  const db = await getDb();
  if (!db) return;

  // Get the admin's Google token (user id 1 = owner, or find first admin)
  const [adminToken] = await db.select().from(googleTokens).limit(1);
  if (!adminToken) return;

  const accessToken = await getValidAccessToken(adminToken.userId);
  if (!accessToken) return;

  // Fetch events updated in the last 24 hours
  const timeMin = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime&maxResults=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json() as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string };
      end?: { dateTime?: string };
      attendees?: Array<{ email: string }>;
      conferenceData?: { entryPoints?: Array<{ entryPointType: string; uri: string }> };
      status?: string;
    }>;
  };

  if (!data.items) return;

  for (const event of data.items) {
    if (event.status === "cancelled") continue;
    if (!event.start?.dateTime) continue;

    const attendeeEmails = (event.attendees ?? []).map(a => a.email.toLowerCase());
    if (attendeeEmails.length === 0) continue;

    const meetEntry = event.conferenceData?.entryPoints?.find(e => e.entryPointType === "video");
    const meetLink = meetEntry?.uri ?? "";

    // Find a client by attendee email
    for (const email of attendeeEmails) {
      const [matchedUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
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
        .filter(s => s.status === "not_scheduled")
        .sort((a, b) => a.sessionNumber - b.sessionNumber)[0];

      if (!nextSession) continue;

      // Check if this event is already linked to a session
      const alreadyLinked = unscheduledSessions.some(s => s.googleEventId === event.id);
      if (alreadyLinked) continue;

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

      console.log(`[GCal Webhook] Auto-scheduled Session ${nextSession.sessionNumber} for user ${matchedUser.email} at ${event.start.dateTime}`);
      break;
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
