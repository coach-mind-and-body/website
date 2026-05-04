import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Unit tests for Google Calendar helper functions ──────────────────────────
// These tests mock DB and fetch calls to verify logic without real credentials.

// Mock getDb so tests don't need a real database
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock ENV to avoid missing env vars
vi.mock("./_core/env", () => ({
  ENV: {
    googleClientId: "test-client-id",
    googleClientSecret: "test-client-secret",
    isProduction: false,
  },
}));

import { getGoogleCalendarStatus, getValidAccessToken } from "./googleCalendar";
import { getDb } from "./db";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);
});

describe("getGoogleCalendarStatus", () => {
  it("returns connected: false when no token exists", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const status = await getGoogleCalendarStatus(1);
    expect(status.connected).toBe(false);
  });

  it("returns connected: true with email when token exists", async () => {
    mockDb.where.mockResolvedValueOnce([{
      userId: 1,
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: Date.now() + 3600_000,
      email: "leeanne@example.com",
    }]);
    const status = await getGoogleCalendarStatus(1);
    expect(status.connected).toBe(true);
    expect(status.email).toBe("leeanne@example.com");
  });

  it("returns connected: false when db is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const status = await getGoogleCalendarStatus(1);
    expect(status.connected).toBe(false);
  });
});

describe("getValidAccessToken", () => {
  it("returns null when no token row exists", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const token = await getValidAccessToken(1);
    expect(token).toBeNull();
  });

  it("returns access token directly when not expired", async () => {
    mockDb.where.mockResolvedValueOnce([{
      userId: 1,
      accessToken: "valid-token",
      refreshToken: "ref",
      expiresAt: Date.now() + 3600_000, // 1 hour from now
      email: null,
    }]);
    const token = await getValidAccessToken(1);
    expect(token).toBe("valid-token");
  });

  it("returns null when db is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const token = await getValidAccessToken(1);
    expect(token).toBeNull();
  });
});
