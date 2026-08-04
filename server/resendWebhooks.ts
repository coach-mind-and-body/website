/**
 * Resend webhook processing: map delivery/open/click events onto newsletter sends.
 * Signature: Svix (whsec_…) via RESEND_WEBHOOK_SECRET.
 */
import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { emailNewsletterSends, resendWebhookEvents } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";

export type ResendWebhookPayload = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
    from?: string;
    subject?: string;
    click?: { link?: string };
    bounce?: { message?: string };
    tags?: { name?: string; value?: string }[] | Record<string, string>;
    [key: string]: unknown;
  };
};

/** Manual Svix verification (no extra dependency). Throws if invalid. */
export function verifyResendWebhook(
  payload: string,
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
  secret: string
): ResendWebhookPayload {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) {
    throw new Error("Missing svix headers");
  }

  // Reject stale timestamps (±5 min)
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) throw new Error("Invalid svix timestamp");
  const ageMs = Math.abs(Date.now() - ts * 1000);
  if (ageMs > 5 * 60 * 1000) throw new Error("Svix timestamp too old");

  // secret is whsec_<base64>
  const keyPart = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const secretBytes = Buffer.from(keyPart, "base64");
  const signedContent = `${id}.${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const passed = signature.split(" ").flatMap((part) => {
    // formats: "v1,sig" or multiple space-separated
    const pieces = part.split(",");
    return pieces.length === 2 ? [pieces[1]] : pieces.filter((p) => p && p !== "v1");
  });

  const ok = passed.some((sig) => {
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });

  if (!ok) throw new Error("Invalid svix signature");

  return JSON.parse(payload) as ResendWebhookPayload;
}

function extractEmailId(payload: ResendWebhookPayload): string | null {
  const id = payload.data?.email_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * Apply a verified Resend event to our send log.
 * Idempotent on svix-id.
 */
export async function processResendWebhookEvent(
  svixId: string,
  payload: ResendWebhookPayload
): Promise<{ handled: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) return { handled: false, reason: "no_db" };

  // Idempotency
  try {
    await db.insert(resendWebhookEvents).values({
      svixId,
      eventType: payload.type,
      resendEmailId: extractEmailId(payload),
      payloadJson: JSON.stringify(payload).slice(0, 65000),
    });
  } catch (e: unknown) {
    const err = e as { code?: string; cause?: { code?: string } };
    if (err.code === "ER_DUP_ENTRY" || err.cause?.code === "ER_DUP_ENTRY") {
      return { handled: true, reason: "duplicate" };
    }
    // Some drivers wrap differently
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Duplicate") || msg.includes("UNIQUE")) {
      return { handled: true, reason: "duplicate" };
    }
    throw e;
  }

  const emailId = extractEmailId(payload);
  if (!emailId) {
    return { handled: false, reason: "no_email_id" };
  }

  const [row] = await db
    .select()
    .from(emailNewsletterSends)
    .where(eq(emailNewsletterSends.resendEmailId, emailId))
    .limit(1);

  if (!row) {
    // Not a tracked newsletter send (transactional, etc.)
    return { handled: false, reason: "unknown_email" };
  }

  const now = new Date();
  const type = payload.type;

  if (type === "email.delivered") {
    await db
      .update(emailNewsletterSends)
      .set({
        deliveryStatus: "delivered",
        deliveredAt: row.deliveredAt ?? now,
      })
      .where(eq(emailNewsletterSends.id, row.id));
    return { handled: true };
  }

  if (type === "email.delivery_delayed") {
    if (row.deliveryStatus === "unknown" || row.deliveryStatus === "sent") {
      await db
        .update(emailNewsletterSends)
        .set({ deliveryStatus: "delivery_delayed" })
        .where(eq(emailNewsletterSends.id, row.id));
    }
    return { handled: true };
  }

  if (type === "email.bounced") {
    const msg =
      typeof payload.data?.bounce === "object" &&
      payload.data.bounce &&
      "message" in payload.data.bounce
        ? String((payload.data.bounce as { message?: string }).message)
        : "Bounced";
    await db
      .update(emailNewsletterSends)
      .set({
        deliveryStatus: "bounced",
        bouncedAt: now,
        errorMessage: msg.slice(0, 480),
      })
      .where(eq(emailNewsletterSends.id, row.id));
    return { handled: true };
  }

  if (type === "email.complained") {
    await db
      .update(emailNewsletterSends)
      .set({
        deliveryStatus: "complained",
        complainedAt: now,
      })
      .where(eq(emailNewsletterSends.id, row.id));
    return { handled: true };
  }

  if (type === "email.failed") {
    await db
      .update(emailNewsletterSends)
      .set({
        deliveryStatus: "failed",
        errorMessage: (row.errorMessage || "Resend failed").slice(0, 480),
      })
      .where(eq(emailNewsletterSends.id, row.id));
    return { handled: true };
  }

  if (type === "email.opened") {
    await db
      .update(emailNewsletterSends)
      .set({
        openCount: sql`${emailNewsletterSends.openCount} + 1`,
        firstOpenedAt: row.firstOpenedAt ?? now,
        lastOpenedAt: now,
        // Opens imply delivery in practice
        deliveryStatus:
          row.deliveryStatus === "unknown" || row.deliveryStatus === "sent"
            ? "delivered"
            : row.deliveryStatus,
        deliveredAt: row.deliveredAt ?? now,
      })
      .where(eq(emailNewsletterSends.id, row.id));
    return { handled: true };
  }

  if (type === "email.clicked") {
    await db
      .update(emailNewsletterSends)
      .set({
        clickCount: sql`${emailNewsletterSends.clickCount} + 1`,
        firstClickedAt: row.firstClickedAt ?? now,
        lastClickedAt: now,
        openCount: row.openCount > 0 ? row.openCount : sql`${emailNewsletterSends.openCount} + 1`,
        firstOpenedAt: row.firstOpenedAt ?? now,
        lastOpenedAt: row.lastOpenedAt ?? now,
        deliveryStatus:
          row.deliveryStatus === "unknown" || row.deliveryStatus === "sent"
            ? "delivered"
            : row.deliveryStatus,
        deliveredAt: row.deliveredAt ?? now,
      })
      .where(eq(emailNewsletterSends.id, row.id));
    return { handled: true };
  }

  if (type === "email.sent") {
    if (row.deliveryStatus === "unknown") {
      await db
        .update(emailNewsletterSends)
        .set({ deliveryStatus: "sent" })
        .where(eq(emailNewsletterSends.id, row.id));
    }
    return { handled: true };
  }

  return { handled: false, reason: `unhandled_type:${type}` };
}

export function getResendWebhookSecret(): string {
  return ENV.resendWebhookSecret || "";
}
