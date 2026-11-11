/**
 * Coaching session fields a client may see.
 * Private notes and calendar ids stay on the server.
 * Older apps ignore session objects they don't decode.
 */
export type ClientModuleSession = {
  id: number;
  sessionNumber: number;
  status: "not_scheduled" | "scheduled" | "completed" | "cancelled";
  scheduledAt: Date | null;
  completedAt: Date | null;
  googleMeetLink: string | null;
  /** Shown on the portal module page. Not the private coach notes. */
  adminNotes: string | null;
};

/** The next joinable session for one program. Null when there isn't one. */
export type HubNextSession = {
  id: number;
  sessionNumber: number;
  status: "scheduled";
  scheduledAt: Date;
  googleMeetLink: string | null;
};

export type CoachingSessionSnapshot = {
  id: number;
  enrollmentId: number;
  sessionNumber: number;
  status: ClientModuleSession["status"];
  scheduledAt: Date | null;
  completedAt: Date | null;
  googleMeetLink: string | null;
  adminNotes: string | null;
};

/** Still show Join for an hour after the start, matching the admin upcoming list. */
export const COACHING_JOIN_GRACE_MS = 60 * 60 * 1000;

export function clientModuleSession(row: CoachingSessionSnapshot): ClientModuleSession {
  return {
    id: row.id,
    sessionNumber: row.sessionNumber,
    status: row.status,
    scheduledAt: row.scheduledAt,
    completedAt: row.completedAt,
    googleMeetLink: row.googleMeetLink,
    adminNotes: row.adminNotes,
  };
}

/**
 * Soonest scheduled session for this enrollment that is still joinable.
 * The matching module is often still locked — it unlocks when the session
 * is marked complete — so this is not limited to modules already on the hub.
 */
export function nextCoachingSession(
  rows: CoachingSessionSnapshot[],
  enrollmentId: number,
  now = new Date()
): HubNextSession | null {
  const cutoff = now.getTime() - COACHING_JOIN_GRACE_MS;
  const upcoming = rows
    .filter((row) => row.enrollmentId === enrollmentId)
    .filter((row) => row.status === "scheduled" && row.scheduledAt != null)
    .filter((row) => row.scheduledAt!.getTime() > cutoff)
    .sort(
      (a, b) =>
        a.scheduledAt!.getTime() - b.scheduledAt!.getTime() || a.sessionNumber - b.sessionNumber
    );
  const next = upcoming[0];
  if (!next?.scheduledAt) return null;
  return {
    id: next.id,
    sessionNumber: next.sessionNumber,
    status: "scheduled",
    scheduledAt: next.scheduledAt,
    googleMeetLink: next.googleMeetLink,
  };
}
