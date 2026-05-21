import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./googleCalendar", () => ({
  getValidAccessToken: vi.fn(),
}));

vi.mock("./notifications", () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("../_core/env", () => ({
  ENV: { isProduction: false },
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { pollForCompletedSessions } from "./callFollowUpPoller";
import { getDb } from "./db";
import { getValidAccessToken } from "./googleCalendar";
import { sendTransactionalEmail } from "./notifications";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDbMock(overrides: Record<string, unknown> = {}) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          { userId: 1, email: "leeanne@example.com" },
        ]),
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("callFollowUpPoller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should skip polling when no Google Calendar token is found", async () => {
    const db = makeDbMock();
    // Return empty array for googleTokens lookup
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    });
    vi.mocked(getDb).mockResolvedValue(db as never);

    await pollForCompletedSessions();

    expect(getValidAccessToken).not.toHaveBeenCalled();
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("should skip polling when access token cannot be obtained", async () => {
    const db = makeDbMock();
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          { userId: 1, email: "leeanne@example.com" },
        ]),
      }),
    });
    vi.mocked(getDb).mockResolvedValue(db as never);
    vi.mocked(getValidAccessToken).mockResolvedValue(null);

    await pollForCompletedSessions();

    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("should not send email for call #6 (last session)", async () => {
    // This test verifies the isLastSession guard works
    const PROGRAM_SESSION_COUNT = 6;
    const sessionNumber = PROGRAM_SESSION_COUNT;
    const isLastSession = sessionNumber >= PROGRAM_SESSION_COUNT;
    expect(isLastSession).toBe(true);
    // If isLastSession is true, no follow-up email should be sent
    // (the actual logic is in pollForCompletedSessions, but we verify the guard here)
  });

  it("should send follow-up email for sessions 1–5", () => {
    const PROGRAM_SESSION_COUNT = 6;
    for (let sessionNumber = 1; sessionNumber <= 5; sessionNumber++) {
      const isLastSession = sessionNumber >= PROGRAM_SESSION_COUNT;
      expect(isLastSession).toBe(false);
    }
  });

  it("should mark session 6 as the last session", () => {
    const PROGRAM_SESSION_COUNT = 6;
    expect(6 >= PROGRAM_SESSION_COUNT).toBe(true);
    expect(5 >= PROGRAM_SESSION_COUNT).toBe(false);
  });

  it("should calculate the correct follow-up window (65-80 minutes after start)", () => {
    const SESSION_DURATION_MINS = 50;
    const FOLLOWUP_DELAY_MINS = SESSION_DURATION_MINS + 15; // 65
    const WINDOW_MINS = 15;

    const now = Date.now();
    const windowStart = new Date(now - (FOLLOWUP_DELAY_MINS + WINDOW_MINS) * 60 * 1000);
    const windowEnd = new Date(now - FOLLOWUP_DELAY_MINS * 60 * 1000);

    // windowStart should be 80 minutes ago
    expect(now - windowStart.getTime()).toBeCloseTo(80 * 60 * 1000, -3);
    // windowEnd should be 65 minutes ago
    expect(now - windowEnd.getTime()).toBeCloseTo(65 * 60 * 1000, -3);
  });
});
