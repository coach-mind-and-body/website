import {
  COACHING_JOIN_GRACE_MS,
  type HubNextSession,
} from "./coachingSessionHub";

/**
 * Google Calendar times.
 * A dateTime with an offset is an absolute instant.
 * A dateTime without one is wall-clock time in `timeZone` (America/Denver when the event doesn't say).
 * Evening Mountain Time must stay that evening — not the UTC clock reading, and not the next UTC date.
 */

const OFFSET_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const FALLBACK_ZONE = "America/Denver";

export type GoogleEventStart = {
  dateTime?: string | null;
  timeZone?: string | null;
};

export function googleEventInstant(start: GoogleEventStart | null | undefined, nowZone = FALLBACK_ZONE): Date | null {
  const raw = start?.dateTime?.trim();
  if (!raw) return null;
  if (OFFSET_RE.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const zone = start?.timeZone?.trim() || nowZone;
  const local = raw.replace(" ", "T").slice(0, 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const iso = zonedLocalToUtc(local, zone);
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function zonedLocalToUtc(localDatetime: string, timeZone: string): string {
  const target = localDatetime.slice(0, 16);
  const { year, month, day, hour, minute } = parseLocalDatetime(target);
  const targetMs = Date.UTC(year, month - 1, day, hour, minute);
  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  for (let i = 0; i < 6; i++) {
    const formatted = formatZonedLocal(utc, timeZone);
    if (formatted === target) return utc.toISOString();
    const f = parseLocalDatetime(formatted);
    const formattedMs = Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute);
    utc = new Date(utc.getTime() + (targetMs - formattedMs));
  }
  return utc.toISOString();
}

function parseLocalDatetime(localDatetime: string) {
  const [datePart, timePart] = localDatetime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  let [hour, minute] = (timePart ?? "00:00").split(":").map(Number);
  if (hour === 24) hour = 0;
  return { year, month, day, hour, minute };
}

function formatZonedLocal(date: Date, timeZone: string): string {
  let zone = timeZone;
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
  }
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export type CalendarPerson = {
  email?: string | null;
  displayName?: string | null;
  self?: boolean | null;
  organizer?: boolean | null;
};

/** Guest emails on an event. Attendees and the description both count. The coach's own address does not. */
export function calendarGuestEmails(
  event: {
    attendees?: CalendarPerson[] | null;
    description?: string | null;
    summary?: string | null;
    organizer?: { email?: string | null } | null;
  },
  adminEmail?: string | null
): string[] {
  const skip = new Set<string>();
  const admin = adminEmail?.trim().toLowerCase();
  if (admin) skip.add(admin);
  const organizer = event.organizer?.email?.trim().toLowerCase();
  if (organizer) skip.add(organizer);

  const found: string[] = [];
  const add = (value: string | null | undefined) => {
    const email = value?.trim().toLowerCase();
    if (!email || skip.has(email) || found.includes(email)) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    found.push(email);
  };

  for (const attendee of event.attendees ?? []) {
    if (attendee.self || attendee.organizer) continue;
    add(attendee.email);
  }
  const blob = `${event.description ?? ""}\n${event.summary ?? ""}`;
  for (const match of blob.match(EMAIL_RE) ?? []) add(match);
  return found;
}

export function meetLinkFromEvent(event: {
  hangoutLink?: string | null;
  description?: string | null;
  conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> | null } | null;
}): string {
  const fromConference = event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri;
  if (fromConference) return fromConference;
  if (event.hangoutLink) return event.hangoutLink;
  return event.description?.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0] ?? "";
}

export function coachingEventIsJoinable(start: Date, now = new Date()): boolean {
  return start.getTime() > now.getTime() - COACHING_JOIN_GRACE_MS;
}

export type LinkableSession = {
  id: number;
  sessionNumber: number;
  status: string;
  scheduledAt: Date | string | null;
  googleEventId: string | null;
  googleMeetLink?: string | null;
};

/**
 * Which coaching row a calendar event should update.
 * An event already tied to a session keeps that row.
 * A past event must not be given the next open slot — that was swallowing tonight's appointment.
 */
export function pickSessionForCalendarEvent(
  sessions: LinkableSession[],
  eventId: string,
  start: Date
): LinkableSession | null {
  const linked = sessions.find((session) => session.googleEventId === eventId);
  if (linked) {
    if (linked.status === "completed" || linked.status === "cancelled") return null;
    return linked;
  }
  const startMs = start.getTime();
  const near = sessions
    .filter((session) => session.status === "scheduled" && session.scheduledAt)
    .map((session) => ({ session, at: new Date(session.scheduledAt as Date).getTime() }))
    .filter((row) => Number.isFinite(row.at) && Math.abs(row.at - startMs) <= 30 * 60 * 1000)
    .sort((a, b) => a.session.sessionNumber - b.session.sessionNumber)[0];
  if (near) return near.session;
  return (
    sessions
      .filter((session) => session.status === "not_scheduled")
      .sort((a, b) => a.sessionNumber - b.sessionNumber)[0] ?? null
  );
}

export type ClientCalendarEvent = {
  id: string;
  summary?: string | null;
  description?: string | null;
  status?: string | null;
  hangoutLink?: string | null;
  start?: GoogleEventStart | null;
  end?: GoogleEventStart | null;
  attendees?: CalendarPerson[] | null;
  organizer?: { email?: string | null } | null;
  conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> | null } | null;
};

export type UpcomingAppointment = {
  id: string;
  summary: string;
  startTime: Date;
  endTime: Date | null;
  meetLink: string;
  htmlLink: string;
};

/** Upcoming events on the coach calendar that name this client's email. */
export function appointmentsForClient(
  events: ClientCalendarEvent[],
  email: string,
  now = new Date()
): UpcomingAppointment[] {
  const needle = email.trim().toLowerCase();
  if (!needle) return [];
  const upcoming: UpcomingAppointment[] = [];
  for (const event of events) {
    if (event.status === "cancelled" || !event.id) continue;
    const start = googleEventInstant(event.start);
    if (!start || !coachingEventIsJoinable(start, now)) continue;
    const guests = calendarGuestEmails(event);
    if (!guests.includes(needle)) continue;
    upcoming.push({
      id: event.id,
      summary: event.summary?.trim() || "Coaching appointment",
      startTime: start,
      endTime: googleEventInstant(event.end),
      meetLink: meetLinkFromEvent(event),
      htmlLink: "",
    });
  }
  upcoming.sort((a, b) => a.startTime.getTime() - b.startTime.getTime() || a.id.localeCompare(b.id));
  return upcoming;
}

/** Stable id that won't collide with coaching_sessions autoincrement values. */
export function stableCalendarSessionId(eventId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < eventId.length; i++) {
    hash ^= eventId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 1_000_000_000 + ((hash >>> 0) % 900_000_000);
}

/**
 * The card shows the sooner of the saved coaching session and a live calendar appointment.
 * The same slot keeps the coaching row (real session number) and fills in a Meet link.
 */
export function soonestJoinableSession(
  stored: HubNextSession | null,
  appointments: UpcomingAppointment[],
  now = new Date()
): HubNextSession | null {
  const calendarNext = appointments.find((event) => coachingEventIsJoinable(event.startTime, now));
  const fromCalendar: HubNextSession | null = calendarNext
    ? {
        id: stableCalendarSessionId(calendarNext.id),
        sessionNumber: 0,
        status: "scheduled",
        scheduledAt: calendarNext.startTime,
        googleMeetLink: calendarNext.meetLink || null,
        title: calendarNext.summary,
      }
    : null;
  if (!stored?.scheduledAt) return fromCalendar;
  if (!fromCalendar) return stored;
  const delta = Math.abs(stored.scheduledAt.getTime() - fromCalendar.scheduledAt.getTime());
  if (delta <= 30 * 60 * 1000) {
    return {
      ...stored,
      googleMeetLink: stored.googleMeetLink || fromCalendar.googleMeetLink,
      title: stored.title ?? fromCalendar.title,
    };
  }
  return stored.scheduledAt.getTime() <= fromCalendar.scheduledAt.getTime() ? stored : fromCalendar;
}
