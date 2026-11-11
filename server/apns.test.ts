import { generateKeyPairSync } from "node:crypto";
import * as jose from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import {
  apnsConfigFromEnv,
  apnsHost,
  buildApnsBody,
  normalizeApnsToken,
  resetApnsCachesForTests,
  sendApnsAlerts,
  type ApnsConfig,
} from "./apns";
import { assignDeviceToken, InvalidDeviceTokenError } from "./apnsDevices";

function testKey() {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  return {
    pem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    publicPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
  };
}

function config(environment: string, pem: string): ApnsConfig {
  return {
    keyId: "KEYID12345",
    teamId: "TEAMID1234",
    keyP8: pem,
    bundleId: "com.mindandbodyreset.habittracker",
    environment,
  };
}

describe("APNs", () => {
  beforeEach(() => {
    resetApnsCachesForTests();
    vi.restoreAllMocks();
  });

  it("normalizes a 64-character device token and rejects anything else", () => {
    const token = "ab".repeat(32);
    expect(normalizeApnsToken(`<${token.toUpperCase()}>`)).toBe(token);
    expect(normalizeApnsToken(`${token.slice(0, 8)} ${token.slice(8)}`)).toBe(token);
    expect(normalizeApnsToken("zz")).toBeNull();
    expect(normalizeApnsToken("")).toBeNull();
  });

  it("reads the five APNs env vars and turns literal newlines in the key back into line breaks", () => {
    const env = {
      APNS_KEY_ID: "KEYID12345",
      APNS_TEAM_ID: "TEAMID1234",
      APNS_KEY_P8: "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----",
      APNS_BUNDLE_ID: "com.mindandbodyreset.habittracker",
      APNS_ENV: "production",
    };
    expect(apnsConfigFromEnv(env)?.keyP8).toBe(
      "-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----"
    );
    expect(apnsConfigFromEnv(env)?.environment).toBe("production");
    expect(apnsConfigFromEnv({ ...env, APNS_KEY_P8: "  " })).toBeNull();
    expect(apnsConfigFromEnv({ ...env, APNS_ENV: "" })).toBeNull();
  });

  it("uses the sandbox host unless APNS_ENV is production", () => {
    expect(apnsHost("sandbox")).toBe("api.sandbox.push.apple.com");
    expect(apnsHost("development")).toBe("api.sandbox.push.apple.com");
    expect(apnsHost("Production")).toBe("api.push.apple.com");
  });

  it("no-ops with one log line when the APNs env is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const transport = vi.fn();
    const first = await sendApnsAlerts({
      config: null,
      tokens: ["ab".repeat(32)],
      alert: { title: "Hi", body: "There" },
      data: {
        tab: "coach",
        url: "/habit-tracker/coach",
        category: "coach-message",
        conversationId: 1,
        threadId: 1,
        mutableContent: true,
      },
      transport,
    });
    const second = await sendApnsAlerts({
      config: null,
      tokens: ["ab".repeat(32)],
      alert: { title: "Hi", body: "There" },
      data: {
        tab: "coach",
        url: "/habit-tracker/coach",
        category: "coach-message",
        conversationId: 1,
        threadId: 1,
        mutableContent: true,
      },
      transport,
    });
    expect(first).toEqual({ sent: 0, failed: 0, removed: [], skipped: true });
    expect(second.skipped).toBe(true);
    expect(transport).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("APNS_KEY_ID");
    expect(String(warn.mock.calls[0]?.[0])).not.toContain("BEGIN PRIVATE KEY");
  });

  it("sends a token-auth alert that opens the coach thread and drops dead tokens", async () => {
    const keys = testKey();
    const token = "cd".repeat(32);
    const transport = vi.fn(async (request: { host: string; path: string; headers: Record<string, string>; body: string }) => {
      expect(request.host).toBe("api.sandbox.push.apple.com");
      expect(request.path).toBe(`/3/device/${token}`);
      expect(request.headers["apns-topic"]).toBe("com.mindandbodyreset.habittracker");
      expect(request.headers["apns-push-type"]).toBe("alert");
      expect(request.headers.authorization.startsWith("bearer ")).toBe(true);
      const jwt = request.headers.authorization.slice("bearer ".length);
      const publicKey = await jose.importSPKI(keys.publicPem, "ES256");
      const verified = await jose.jwtVerify(jwt, publicKey, { issuer: "TEAMID1234" });
      expect(verified.protectedHeader.kid).toBe("KEYID12345");
      expect(verified.protectedHeader.alg).toBe("ES256");
      expect(JSON.parse(request.body)).toEqual({
        aps: {
          alert: { title: "Lee Anne sent a message", body: "Thursday" },
          sound: "default",
          category: "coach-message",
          "mutable-content": 1,
          "thread-id": "42",
        },
        tab: "coach",
        url: "/habit-tracker/coach",
        category: "coach-message",
        conversationId: 42,
        threadId: 42,
        messageId: 9,
      });
      return { status: 410, body: '{"reason":"Unregistered"}' };
    });

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await sendApnsAlerts({
      config: config("sandbox", keys.pem),
      tokens: [token],
      alert: { title: "Lee Anne sent a message", body: "Thursday" },
      data: {
        tab: "coach",
        url: "/habit-tracker/coach",
        category: "coach-message",
        conversationId: 42,
        threadId: 42,
        messageId: 9,
        mutableContent: true,
      },
      transport,
    });
    expect(result).toEqual({ sent: 0, failed: 1, removed: [token], skipped: false });
    expect(warn.mock.calls.some((call) => String(call[0]).includes(token))).toBe(false);
  });

  it("posts to the production host and keeps a token that Apple rejected for another reason", async () => {
    const keys = testKey();
    const token = "ef".repeat(32);
    const transport = vi.fn(async (request: { host: string }) => {
      expect(request.host).toBe("api.push.apple.com");
      return { status: 400, body: '{"reason":"BadDeviceToken"}' };
    });
    const bad = await sendApnsAlerts({
      config: config("production", keys.pem),
      tokens: [token],
      alert: { title: "Hi", body: "There" },
      data: {
        tab: "coach",
        url: "/admin",
        category: "coach-client-message",
        conversationId: 3,
        threadId: 3,
        mutableContent: true,
      },
      transport,
    });
    expect(bad.removed).toEqual([token]);

    const keep = await sendApnsAlerts({
      config: config("production", keys.pem),
      tokens: [token],
      alert: { title: "Hi", body: "There" },
      data: {
        tab: "coach",
        url: "/admin",
        category: "coach-client-message",
        conversationId: 3,
        threadId: 3,
        mutableContent: true,
      },
      transport: async () => ({ status: 429, body: '{"reason":"TooManyRequests"}' }),
    });
    expect(keep.removed).toEqual([]);
    expect(keep.failed).toBe(1);
  });

  it("puts the thread id in the payload the app reads on tap", () => {
    const body = JSON.parse(
      buildApnsBody(
        { title: "New client message", body: "Ava: hi" },
        {
          tab: "coach",
          url: "/admin",
          category: "coach-client-message",
          conversationId: 9,
          threadId: 9,
          mutableContent: true,
        }
      )
    );
    expect(body.conversationId).toBe(9);
    expect(body.threadId).toBe(9);
    expect(body.tab).toBe("coach");
    expect(body.category).toBe("coach-client-message");
    expect(body.aps.category).toBe("coach-client-message");
    expect(body.aps["thread-id"]).toBe("9");
    expect(body.aps["mutable-content"]).toBe(1);
    expect(body.aps.sound).toBe("default");
  });

  it("marks a session reminder time-sensitive and keeps the meet link", () => {
    const body = JSON.parse(
      buildApnsBody(
        { title: "Next session", body: "Your Reclaim session starts in about 15 minutes." },
        {
          tab: "programs",
          url: "/habit-tracker",
          category: "session-reminder",
          sessionUrl: "https://meet.google.com/abc-defg-hij",
          interruptionLevel: "time-sensitive",
        }
      )
    );
    expect(body.aps.category).toBe("session-reminder");
    expect(body.aps["interruption-level"]).toBe("time-sensitive");
    expect(body.sessionUrl).toBe("https://meet.google.com/abc-defg-hij");
    expect(body.aps["mutable-content"]).toBeUndefined();
  });

  it("stores one token per device and moves it when a different user signs in", async () => {
    const rows = new Map<string, number>();
    const store = {
      async upsert(userId: number, token: string) {
        rows.set(token, userId);
      },
    };
    const token = "ab".repeat(32);
    await assignDeviceToken(store, 4, token);
    await assignDeviceToken(store, 8, `<${token.toUpperCase()}>`);
    expect(rows.size).toBe(1);
    expect(rows.get(token)).toBe(8);
    await expect(assignDeviceToken(store, 4, "nope")).rejects.toBeInstanceOf(InvalidDeviceTokenError);
  });

  it("requires a signed-in user to register a device token", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: new Request("https://mindandbodyresetcoach.com/api/trpc"),
    });
    await expect(caller.push.registerDeviceToken({ token: "ab".repeat(32) })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
