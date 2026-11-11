import * as jose from "jose";

export type ApnsConfig = {
  keyId: string;
  teamId: string;
  keyP8: string;
  bundleId: string;
  environment: string;
};

export type ApnsTransportRequest = {
  host: string;
  path: string;
  headers: Record<string, string>;
  body: string;
};

export type ApnsTransport = (
  request: ApnsTransportRequest
) => Promise<{ status: number; body: string }>;

export type ApnsSendInput = {
  config: ApnsConfig | null;
  tokens: string[];
  alert: { title: string; body: string };
  data: { tab: string; url: string; conversationId: number };
  transport?: ApnsTransport;
  now?: Date;
};

export type ApnsSendResult = {
  sent: number;
  failed: number;
  removed: string[];
  skipped: boolean;
};

const APNS_ENV_NAMES = ["APNS_KEY_ID", "APNS_TEAM_ID", "APNS_KEY_P8", "APNS_BUNDLE_ID", "APNS_ENV"] as const;

let loggedMissingConfig = false;
const jwtCache = new Map<string, { token: string; expiresAt: number }>();

export function resetApnsCachesForTests() {
  loggedMissingConfig = false;
  jwtCache.clear();
}

/** 64 hex characters, the token iOS gives registerForRemoteNotifications. */
export function normalizeApnsToken(raw: string): string | null {
  const hex = raw.replace(/[<>\s]/g, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) return null;
  return hex;
}

export function apnsHost(environment: string): string {
  return environment.trim().toLowerCase() === "production"
    ? "api.push.apple.com"
    : "api.sandbox.push.apple.com";
}

export function apnsConfigFromEnv(
  env: Record<string, string | undefined> = process.env
): ApnsConfig | null {
  const values = APNS_ENV_NAMES.map((name) => env[name]?.trim() ?? "");
  if (values.some((value) => !value)) return null;
  const [keyId, teamId, keyP8, bundleId, environment] = values;
  return {
    keyId,
    teamId,
    keyP8: normalizeP8(keyP8),
    bundleId,
    environment,
  };
}

function normalizeP8(raw: string): string {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value.replace(/\\n/g, "\n").trim();
}

function logMissingConfig() {
  if (loggedMissingConfig) return;
  loggedMissingConfig = true;
  console.warn(
    "[APNs] APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8, APNS_BUNDLE_ID, or APNS_ENV is not set — skipping push."
  );
}

export function buildApnsBody(
  alert: { title: string; body: string },
  data: { tab: string; url: string; conversationId: number }
): string {
  return JSON.stringify({
    aps: {
      alert: { title: alert.title, body: alert.body },
      sound: "default",
    },
    tab: data.tab,
    url: data.url,
    conversationId: data.conversationId,
  });
}

async function providerToken(config: ApnsConfig, now: Date): Promise<string> {
  const cacheKey = `${config.keyId}:${config.teamId}:${config.keyP8.length}`;
  const cached = jwtCache.get(cacheKey);
  const nowMs = now.getTime();
  if (cached && cached.expiresAt > nowMs) return cached.token;

  const key = await jose.importPKCS8(config.keyP8, "ES256");
  const token = await new jose.SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: config.keyId })
    .setIssuer(config.teamId)
    .setIssuedAt(Math.floor(nowMs / 1000))
    .sign(key);
  jwtCache.set(cacheKey, { token, expiresAt: nowMs + 50 * 60 * 1000 });
  return token;
}

function shouldDropToken(status: number, body: string): boolean {
  if (status === 410) return true;
  if (status !== 400) return false;
  return (
    body.includes("BadDeviceToken") ||
    body.includes("Unregistered") ||
    body.includes("DeviceTokenNotForTopic")
  );
}

export async function defaultApnsTransport(
  request: ApnsTransportRequest
): Promise<{ status: number; body: string }> {
  const http2 = await import("node:http2");
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${request.host}`);
    let settled = false;
    const finish = (err?: Error, result?: { status: number; body: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.close();
      if (err) reject(err);
      else resolve(result!);
    };
    const timer = setTimeout(() => {
      client.destroy();
      finish(new Error("APNs timeout"));
    }, 10_000);
    client.on("error", (err) => finish(err));
    const stream = client.request({
      ":method": "POST",
      ":scheme": "https",
      ":path": request.path,
      ...request.headers,
    });
    const chunks: Buffer[] = [];
    let status = 0;
    stream.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    stream.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => finish(undefined, { status, body: Buffer.concat(chunks).toString("utf8") }));
    stream.on("error", (err) => finish(err));
    stream.end(request.body);
  });
}

export async function sendApnsAlerts(input: ApnsSendInput): Promise<ApnsSendResult> {
  if (!input.config) {
    logMissingConfig();
    return { sent: 0, failed: 0, removed: [], skipped: true };
  }
  const tokens = [...new Set(input.tokens.map((token) => token.trim()).filter(Boolean))];
  if (!tokens.length) {
    return { sent: 0, failed: 0, removed: [], skipped: false };
  }

  const now = input.now ?? new Date();
  const transport = input.transport ?? defaultApnsTransport;
  const host = apnsHost(input.config.environment);
  const body = buildApnsBody(input.alert, input.data);
  let jwt: string;
  try {
    jwt = await providerToken(input.config, now);
  } catch (err) {
    console.error("[APNs] could not sign provider token:", err instanceof Error ? err.message : "error");
    return { sent: 0, failed: tokens.length, removed: [], skipped: false };
  }

  let sent = 0;
  let failed = 0;
  const removed: string[] = [];
  await Promise.all(
    tokens.map(async (token) => {
      try {
        const response = await transport({
          host,
          path: `/3/device/${token}`,
          headers: {
            authorization: `bearer ${jwt}`,
            "apns-topic": input.config!.bundleId,
            "apns-push-type": "alert",
            "apns-priority": "10",
            "content-type": "application/json",
          },
          body,
        });
        if (response.status === 200) {
          sent += 1;
          return;
        }
        failed += 1;
        if (shouldDropToken(response.status, response.body)) removed.push(token);
        let reason = "";
        try {
          reason = String((JSON.parse(response.body) as { reason?: string }).reason ?? "");
        } catch {
          reason = "";
        }
        console.warn(`[APNs] push failed status=${response.status} reason=${reason || "unknown"}`);
      } catch (err) {
        failed += 1;
        console.warn("[APNs] push request failed:", err instanceof Error ? err.message : "error");
      }
    })
  );

  return { sent, failed, removed, skipped: false };
}
