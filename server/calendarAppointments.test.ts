import { describe, expect, it } from "vitest";
import {
  appointmentsForClient,
  calendarGuestEmails,
  coachingEventIsJoinable,
  googleEventInstant,
  pickSessionForCalendarEvent,
  soonestJoinableSession,
  type LinkableSession,
} from "./calendarAppointments";
import { nextCoachingSession, type CoachingSessionSnapshot } from "./coachingSessionHub";

/** 9:51am MST on Wed Nov 11, 2026. Tonight is still ahead. */
const morning = new Date("2026-11-11T16:51:00.000Z");
/** 7:00pm MST that evening = 02:00 UTC the next calendar day. */
const tonightUtc = new Date("2026-11-12T02:00:00.000Z");

describe("google event instants", () => {
  it("keeps an offset and treats a bare Mountain Time clock as that evening", () => {
    expect(googleEventInstant({ dateTime: "2026-11-11T19:00:00-07:00" })?.toISOString()).toBe(
      tonightUtc.toISOString()
    );
    expect(
      googleEventInstant({ dateTime: "2026-11-11T19:00:00", timeZone: "America/Denver" })?.toISOString()
    ).toBe(tonightUtc.toISOString());
    expect(googleEventInstant({ dateTime: "2026-11-11T19:00:00" })?.toISOString()).toBe(
      tonightUtc.toISOString()
    );
  });

  it("does not turn tonight into a UTC date that is already over by morning", () => {
    const start = googleEventInstant({ dateTime: "2026-11-11T19:00:00", timeZone: "America/Denver" })!;
    expect(coachingEventIsJoinable(start, morning)).toBe(true);
    expect(start.getTime()).toBeGreaterThan(morning.getTime());
  });
});

describe("calendar guest emails", () => {
  it("reads the booker from attendees or the description and skips the coach", () => {
    expect(
      calendarGuestEmails(
        {
          attendees: [{ email: "LeeAnne@mindandbodyreset.com", self: true }],
          description: "Booked by\nCarter\nCarter.Test@Example.com",
          organizer: { email: "leeanne@mindandbodyreset.com" },
        },
        "leeanne@mindandbodyreset.com"
      )
    ).toEqual(["carter.test@example.com"]);
  });
});

describe("which session a calendar event updates", () => {
  const sessions: LinkableSession[] = [
    { id: 1, sessionNumber: 1, status: "scheduled", scheduledAt: new Date("2026-11-01T18:00:00.000Z"), googleEventId: "past" },
    { id: 2, sessionNumber: 2, status: "not_scheduled", scheduledAt: null, googleEventId: null },
  ];

  it("does not treat a past event as joinable, so it cannot take the open slot", () => {
    const past = new Date("2026-11-09T18:00:00.000Z");
    expect(coachingEventIsJoinable(past, morning)).toBe(false);
  });

  it("gives a new upcoming event the next open session", () => {
    expect(pickSessionForCalendarEvent(sessions, "tonight", tonightUtc)?.id).toBe(2);
  });

  it("keeps an event on the session it is already tied to", () => {
    expect(pickSessionForCalendarEvent(sessions, "past", tonightUtc)?.id).toBe(1);
  });

  it("leaves a completed session alone", () => {
    const done: LinkableSession[] = [
      { id: 4, sessionNumber: 1, status: "completed", scheduledAt: tonightUtc, googleEventId: "tonight" },
      { id: 5, sessionNumber: 2, status: "not_scheduled", scheduledAt: null, googleEventId: null },
    ];
    expect(pickSessionForCalendarEvent(done, "tonight", tonightUtc)).toBeNull();
  });
});

describe("next session card", () => {
  it("shows tonight from the calendar when the saved session is a later week", () => {
    const later = new Date("2026-11-20T18:00:00.000Z");
    const next = soonestJoinableSession(
      {
        id: 8,
        sessionNumber: 3,
        status: "scheduled",
        scheduledAt: later,
        googleMeetLink: null,
      },
      [
        {
          id: "evt-tonight",
          summary: "Session with Carter",
          startTime: tonightUtc,
          endTime: null,
          meetLink: "https://meet.google.com/abc-defg-hij",
          htmlLink: "",
        },
      ],
      morning
    );
    expect(next?.scheduledAt.toISOString()).toBe(tonightUtc.toISOString());
    expect(next?.googleMeetLink).toBe("https://meet.google.com/abc-defg-hij");
    expect(next?.sessionNumber).toBe(0);
    expect(next?.title).toBe("Session with Carter");
  });

  it("keeps the coaching row when the calendar event is the same time", () => {
    const next = soonestJoinableSession(
      {
        id: 3,
        sessionNumber: 2,
        status: "scheduled",
        scheduledAt: tonightUtc,
        googleMeetLink: null,
      },
      [
        {
          id: "evt-tonight",
          summary: "Session",
          startTime: tonightUtc,
          endTime: null,
          meetLink: "https://meet.google.com/abc-defg-hij",
          htmlLink: "",
        },
      ],
      morning
    );
    expect(next).toMatchObject({ id: 3, sessionNumber: 2, googleMeetLink: "https://meet.google.com/abc-defg-hij" });
  });

  it("matches a description-only booking for tonight and ignores one that already ended", () => {
    const events = appointmentsForClient(
      [
        {
          id: "old",
          summary: "Yesterday",
          start: { dateTime: "2026-11-10T19:00:00", timeZone: "America/Denver" },
          description: "carter@example.com",
        },
        {
          id: "tonight",
          summary: "Clarity call",
          start: { dateTime: "2026-11-11T19:00:00", timeZone: "America/Denver" },
          description: "Guest email: Carter@Example.com",
          hangoutLink: "https://meet.google.com/xyz-abcd-efg",
        },
      ],
      "carter@example.com",
      morning
    );
    expect(events.map((event) => event.id)).toEqual(["tonight"]);
    expect(events[0].startTime.toISOString()).toBe(tonightUtc.toISOString());
    expect(events[0].meetLink).toBe("https://meet.google.com/xyz-abcd-efg");
  });
});

describe("saved coaching session still includes tonight", () => {
  it("does not drop an evening Mountain Time instant that is the next UTC day", () => {
    const row: CoachingSessionSnapshot = {
      id: 9,
      enrollmentId: 10,
      sessionNumber: 1,
      status: "scheduled",
      scheduledAt: tonightUtc,
      completedAt: null,
      googleMeetLink: "https://meet.google.com/abc-defg-hij",
      adminNotes: null,
    };
    expect(nextCoachingSession([row], 10, morning)?.id).toBe(9);
  });
});
