/**
 * Marketing email helpers: opt-out tracking + Resend-compliant unsubscribe.
 * Marketing sequences must use sendMarketingEmail (not raw transactional).
 */
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { Resend } from "resend";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { sequenceEnrollments, subscribers } from "../drizzle/schema";
import { SITE_URL } from "@shared/brand";

/** Segment flag stored on subscribers.segments JSON */
export const EMAIL_OPT_OUT_SEGMENT = "email_opt_out";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 year

function getSigningSecret(): string {
  return ENV.cookieSecret || ENV.resendApiKey || "mbr-email-unsub-dev";
}

/** HMAC token for unsubscribe links (email-bound, long-lived). */
export function createUnsubscribeToken(email: string): string {
  const normalized = email.toLowerCase().trim();
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ e: normalized, exp }), "utf8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyUnsubscribeToken(
  token: string
): { email: string } | { error: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { error: "Invalid link" };
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { error: "Invalid link" };
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      e?: string;
      exp?: number;
    };
    if (!data.e || typeof data.e !== "string") return { error: "Invalid link" };
    if (data.exp && Date.now() > data.exp) return { error: "This link has expired" };
    return { email: data.e.toLowerCase().trim() };
  } catch {
    return { error: "Invalid link" };
  }
}

export function buildUnsubscribeUrl(email: string): string {
  const base = (ENV.appPublicUrl || SITE_URL).replace(/\/$/, "");
  const token = createUnsubscribeToken(email);
  return `${base}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function parseSegments(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function isEmailOptedOut(segmentsRaw: string | null | undefined): boolean {
  return parseSegments(segmentsRaw).includes(EMAIL_OPT_OUT_SEGMENT);
}

/** Mark contact opted out locally + Resend audience + cancel nurture sequences. */
export async function markEmailOptedOut(email: string): Promise<{ success: boolean; message: string }> {
  const normalized = email.toLowerCase().trim();
  const db = await getDb();
  if (!db) return { success: false, message: "Unable to update preferences right now." };

  const [sub] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, normalized))
    .limit(1);

  if (sub) {
    const segs = parseSegments(sub.segments);
    if (!segs.includes(EMAIL_OPT_OUT_SEGMENT)) segs.push(EMAIL_OPT_OUT_SEGMENT);
    await db
      .update(subscribers)
      .set({ segments: JSON.stringify(segs), updatedAt: new Date() })
      .where(eq(subscribers.id, sub.id));

    // Email nurture sequences store subscriber.id on userId (see enrollUserInSequence)
    await db
      .update(sequenceEnrollments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(eq(sequenceEnrollments.userId, sub.id), eq(sequenceEnrollments.status, "active"))
      );
  }

  // Resend audience (Broadcasts / contact unsubscribed flag)
  if (ENV.resendApiKey && ENV.resendAudienceId) {
    try {
      const resend = new Resend(ENV.resendApiKey);
      await resend.contacts.update({
        email: normalized,
        audienceId: ENV.resendAudienceId,
        unsubscribed: true,
      });
    } catch (err) {
      console.warn("[Email] Resend contact unsubscribe update failed:", err);
    }
  }

  return {
    success: true,
    message: "You're unsubscribed. You won't receive more marketing emails from us.",
  };
}

export function marketingEmailFooter(unsubUrl: string, reasonLine: string): string {
  return `
    <div style="padding:28px 40px 36px;border-top:1px solid #f0e8e4;text-align:center;">
      <p style="margin:0 0 10px;color:#8a9a8a;font-size:12px;line-height:1.5;">
        ${reasonLine}
      </p>
      <p style="margin:0;color:#8a9a8a;font-size:12px;line-height:1.5;">
        <a href="${unsubUrl}" style="color:#8a7060;text-decoration:underline;">Unsubscribe</a>
        &nbsp;·&nbsp;
        <a href="${(ENV.appPublicUrl || SITE_URL).replace(/\/$/, "")}/privacy" style="color:#8a7060;text-decoration:underline;">Privacy</a>
      </p>
      <p style="margin:12px 0 0;color:#b0b8b0;font-size:11px;">
        Mind and Body Reset Coaching · mindandbodyresetcoach.com
      </p>
    </div>`;
}

export type MarketingSendResult = {
  ok: boolean;
  /** True when contact is opted out or Resend is not configured */
  skipped?: boolean;
  resendEmailId?: string | null;
  error?: string;
};

/**
 * Send a marketing email via Resend with List-Unsubscribe (RFC 8058 one-click).
 * Skips send if the contact is opted out in our DB.
 * Returns Resend email id for webhook analytics matching.
 */
export async function sendMarketingEmail(params: {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  /** Shown above the unsubscribe link */
  reasonLine?: string;
  /** Tags stored on Resend (ASCII letters/numbers/_/- only) */
  tags?: { name: string; value: string }[];
}): Promise<MarketingSendResult> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] Resend not configured — skipping marketing email to", params.to);
    return { ok: false, skipped: true, error: "Resend not configured" };
  }

  const to = params.to.toLowerCase().trim();
  const db = await getDb();
  if (db) {
    const [sub] = await db
      .select({ segments: subscribers.segments })
      .from(subscribers)
      .where(eq(subscribers.email, to))
      .limit(1);
    if (sub && isEmailOptedOut(sub.segments)) {
      console.log(`[Email] Skip marketing to opted-out ${to}`);
      return { ok: false, skipped: true, error: "Opted out" };
    }
  }

  const unsubUrl = buildUnsubscribeUrl(to);
  const reason =
    params.reasonLine ??
    "You're receiving this because you joined our email list at mindandbodyresetcoach.com.";
  const html =
    params.htmlBody.includes("<!--UNSUB_FOOTER-->")
      ? params.htmlBody.replace(
          "<!--UNSUB_FOOTER-->",
          marketingEmailFooter(unsubUrl, reason)
        )
      : `${params.htmlBody}${marketingEmailFooter(unsubUrl, reason)}`;

  const text =
    params.textBody ??
    `View this email in an HTML client.\n\nUnsubscribe: ${unsubUrl}`;

  try {
    const resend = new Resend(ENV.resendApiKey);
    const { data, error } = await resend.emails.send({
      from: `Lee Anne — Mind and Body Reset Coaching <${ENV.resendFromEmail}>`,
      to: [to],
      subject: params.subject,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: params.tags,
    });
    if (error) {
      console.error(`[Email] Resend marketing error for ${to}:`, error);
      return {
        ok: false,
        error: typeof error === "object" && error && "message" in error
          ? String((error as { message?: string }).message)
          : "Resend error",
      };
    }
    const resendEmailId = data?.id ?? null;
    console.log(`[Email] Marketing sent via Resend to ${to}${resendEmailId ? ` id=${resendEmailId}` : ""}`);
    return { ok: true, resendEmailId };
  } catch (err) {
    console.error("[Email] Marketing send failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Send failed",
    };
  }
}
