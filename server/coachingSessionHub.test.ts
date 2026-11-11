import { describe, expect, it } from "vitest";
import {
  clientModuleSession,
  nextCoachingSession,
  type CoachingSessionSnapshot,
} from "./coachingSessionHub";

const now = new Date("2026-11-11T15:00:00.000Z");
const minute = 60 * 1000;

function session(partial: Partial<CoachingSessionSnapshot> & Pick<CoachingSessionSnapshot, "id">): CoachingSessionSnapshot {
  return {
    enrollmentId: 10,
    sessionNumber: partial.id,
    status: "scheduled",
    scheduledAt: new Date("2026-11-12T18:00:00.000Z"),
    completedAt: null,
    googleMeetLink: "https://meet.google.com/abc-defg-hij",
    adminNotes: null,
    ...partial,
  };
}

describe("client coaching session", () => {
  it("keeps the portal fields and leaves private notes off the payload", () => {
    const stored = {
      ...session({ id: 4, sessionNumber: 2, adminNotes: "Bring the worksheet" }),
      privateNotes: "only for Lee Anne",
      googleEventId: "evt_123",
      userId: 9,
    };
    const visible = clientModuleSession(stored);
    expect(visible).toEqual({
      id: 4,
      sessionNumber: 2,
      status: "scheduled",
      scheduledAt: new Date("2026-11-12T18:00:00.000Z"),
      completedAt: null,
      googleMeetLink: "https://meet.google.com/abc-defg-hij",
      adminNotes: "Bring the worksheet",
    });
    expect(visible).not.toHaveProperty("privateNotes");
    expect(visible).not.toHaveProperty("googleEventId");
  });
});

describe("next coaching session on the hub", () => {
  it("picks the soonest joinable session for that enrollment", () => {
    const sooner = new Date("2026-11-12T18:00:00.000Z");
    const later = new Date("2026-11-20T18:00:00.000Z");
    const next = nextCoachingSession(
      [
        session({ id: 2, sessionNumber: 3, enrollmentId: 99, scheduledAt: new Date("2026-11-11T16:00:00.000Z") }),
        session({ id: 8, sessionNumber: 4, scheduledAt: later }),
        session({ id: 3, sessionNumber: 2, scheduledAt: sooner, googleMeetLink: null }),
      ],
      10,
      now
    );
    expect(next).toEqual({
      id: 3,
      sessionNumber: 2,
      status: "scheduled",
      scheduledAt: sooner,
      googleMeetLink: null,
    });
  });

  it("keeps a session that started within the last hour and drops older or closed ones", () => {
    const next = nextCoachingSession(
      [
        session({ id: 1, scheduledAt: new Date(now.getTime() - 30 * minute) }),
        session({ id: 2, sessionNumber: 2, scheduledAt: new Date(now.getTime() - 61 * minute) }),
        session({ id: 3, sessionNumber: 3, status: "cancelled", scheduledAt: new Date("2026-11-12T18:00:00.000Z") }),
        session({ id: 4, sessionNumber: 4, status: "completed", scheduledAt: new Date("2026-11-12T18:00:00.000Z") }),
        session({ id: 5, sessionNumber: 5, status: "not_scheduled", scheduledAt: null }),
        session({ id: 6, sessionNumber: 6, status: "scheduled", scheduledAt: null }),
      ],
      10,
      now
    );
    expect(next?.id).toBe(1);
  });

  it("returns null when nothing is upcoming", () => {
    expect(
      nextCoachingSession(
        [session({ id: 1, status: "completed", scheduledAt: new Date("2026-11-01T18:00:00.000Z") })],
        10,
        now
      )
    ).toBeNull();
  });
});
