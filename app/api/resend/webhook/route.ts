import { NextResponse } from "next/server";
import {
  getResendWebhookSecret,
  processResendWebhookEvent,
  verifyResendWebhook,
} from "@/server/resendWebhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resend → Svix webhooks.
 * Configure in Resend dashboard:
 *   URL: https://mindandbodyresetcoach.com/api/resend/webhook
 *   Events: email.sent, email.delivered, email.delivery_delayed,
 *           email.bounced, email.complained, email.opened, email.clicked, email.failed
 *   Secret → RESEND_WEBHOOK_SECRET env (whsec_…)
 *
 * Domain: enable Open + Click tracking in Resend for the sending domain.
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const secret = getResendWebhookSecret();

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  let event: ReturnType<typeof verifyResendWebhook>;

  if (secret) {
    try {
      event = verifyResendWebhook(payload, {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      }, secret);
    } catch (err) {
      console.warn("[Resend Webhook] Verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    // Dev fallback — never skip verification in production
    if (process.env.NODE_ENV === "production") {
      console.error("[Resend Webhook] RESEND_WEBHOOK_SECRET not set");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    try {
      event = JSON.parse(payload);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  if (!svixId) {
    return NextResponse.json({ error: "Missing svix-id" }, { status: 400 });
  }

  try {
    const result = await processResendWebhookEvent(svixId, event);
    console.log(
      `[Resend Webhook] ${event.type} email_id=${event.data?.email_id ?? "?"} →`,
      result
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[Resend Webhook] Processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
