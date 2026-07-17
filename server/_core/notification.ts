/**
 * Owner alerts — email only (Resend → OWNER_EMAIL).
 * No Manus / Forge dependency. Never throws for delivery failures.
 */
import { TRPCError } from "@trpc/server";
import { sendOwnerEmail } from "../notifications";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Alert the site owner (Lee Anne) via email.
 * Returns true if Resend accepted the message; false if email is unconfigured or failed.
 * Callers must never treat this as required for user-facing success (booking, checkout, etc.).
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  try {
    const htmlBody = `
      <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#3a5a3a;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:white;font-size:20px;font-weight:700;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:28px 32px;color:#4a4a4a;font-size:16px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(content)}</div>
        <div style="padding:0 32px 28px;color:#8a9a8a;font-size:13px;text-align:center;">
          Mind &amp; Body Reset — automated owner alert
        </div>
      </div>
    `;

    return await sendOwnerEmail({
      subject: title,
      htmlBody,
      textBody: content,
    });
  } catch (err) {
    console.warn("[Notification] Owner email failed (non-fatal):", err);
    return false;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
