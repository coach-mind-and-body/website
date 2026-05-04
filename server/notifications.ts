/**
 * Notifications service
 * Handles: Twilio SMS and Mailchimp Transactional (Mandrill) email
 *
 * SMS triggers:
 *   - 24-hour session reminder
 *   - Post-session follow-up (book next session / program complete)
 *
 * Email triggers:
 *   - Post-session follow-up with coach notes
 *   - Program completion congratulations
 */
import { ENV } from "./_core/env";

// ── Twilio SMS ────────────────────────────────────────────────────────────────

function getTwilioClient() {
  if (!ENV.twilioAccountSid || !ENV.twilioAuthToken) return null;
  // Lazy-require to avoid startup errors when credentials aren't set yet
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require("twilio");
  return twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);
}

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const client = getTwilioClient();
  if (!client) {
    console.warn("[SMS] Twilio not configured — skipping SMS to", to);
    return false;
  }
  if (!ENV.twilioPhoneNumber) {
    console.warn("[SMS] TWILIO_PHONE_NUMBER not set");
    return false;
  }
  try {
    await client.messages.create({
      body,
      from: ENV.twilioPhoneNumber,
      to,
    });
    console.log(`[SMS] Sent to ${to}`);
    return true;
  } catch (err) {
    console.error("[SMS] Failed to send:", err);
    return false;
  }
}

/** Send a 24-hour session reminder SMS */
export async function sendSessionReminderSMS(params: {
  clientPhone: string;
  clientName: string;
  sessionNumber: number;
  scheduledAt: Date;
  meetLink?: string | null;
}) {
  const { clientPhone, clientName, sessionNumber, scheduledAt, meetLink } = params;
  const timeStr = scheduledAt.toLocaleString("en-US", {
    timeZone: "America/Denver",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const meetPart = meetLink ? `\nJoin here: ${meetLink}` : "";
  const body = `Hi ${clientName}! Just a reminder that your Session ${sessionNumber} with Lee Anne is tomorrow at ${timeStr}.${meetPart}\n\nQuestions? Reply to this message or visit your portal.`;
  return sendSMS(clientPhone, body);
}

/** Send a post-session follow-up SMS */
export async function sendPostSessionSMS(params: {
  clientPhone: string;
  clientName: string;
  sessionNumber: number;
  isLastSession: boolean;
  portalUrl: string;
}) {
  const { clientPhone, clientName, sessionNumber, isLastSession, portalUrl } = params;
  let body: string;
  if (isLastSession) {
    body = `Congratulations ${clientName}! 🎉 You've completed all 6 sessions of the Mind & Body Reset program. It's been an honor working with you! Visit your portal to access all your session notes: ${portalUrl}`;
  } else {
    const nextSession = sessionNumber + 1;
    body = `Great session today, ${clientName}! Session ${sessionNumber} is complete. When you're ready, log in to your portal to schedule Session ${nextSession}: ${portalUrl}`;
  }
  return sendSMS(clientPhone, body);
}

// ── Mailchimp Transactional (Mandrill) Email ──────────────────────────────────

function getMailchimpClient() {
  if (!ENV.mailchimpApiKey) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mailchimp = require("@mailchimp/mailchimp_transactional");
  return mailchimp(ENV.mailchimpApiKey);
}

export async function sendTransactionalEmail(params: {
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}): Promise<boolean> {
  const client = getMailchimpClient();
  if (!client) {
    console.warn("[Email] Mailchimp not configured — skipping email to", params.to);
    return false;
  }
  try {
    const response = await client.messages.send({
      message: {
        from_email: ENV.mailchimpFromEmail,
        from_name: "Lee Anne — Mind & Body Reset",
        to: [{ email: params.to, name: params.toName, type: "to" }],
        subject: params.subject,
        html: params.htmlBody,
        text: params.textBody,
      },
    });
    console.log(`[Email] Sent to ${params.to}:`, response?.[0]?.status);
    return response?.[0]?.status === "sent" || response?.[0]?.status === "queued";
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

/** Send post-session email with coach notes */
export async function sendPostSessionEmail(params: {
  clientEmail: string;
  clientName: string;
  sessionNumber: number;
  sessionLabel: string;
  adminNotes: string | null;
  isLastSession: boolean;
  portalUrl: string;
}) {
  const { clientEmail, clientName, sessionNumber, sessionLabel, adminNotes, isLastSession, portalUrl } = params;

  const subject = isLastSession
    ? `🎉 Congratulations on Completing Your Mind & Body Reset!`
    : `Session ${sessionNumber} Complete — Your Next Steps`;

  const notesSection = adminNotes
    ? `<div style="background:#f9f5f0;border-left:4px solid #c9a96e;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#5a3e28;">Lee Anne's Notes for You:</p>
        <p style="margin:0;color:#4a4a4a;white-space:pre-wrap;">${adminNotes}</p>
      </div>`
    : "";

  const ctaSection = isLastSession
    ? `<p style="color:#4a4a4a;">It's been an honor being part of your journey. You can always revisit your session notes and resources in your portal.</p>`
    : `<p style="color:#4a4a4a;">When you're ready for Session ${sessionNumber + 1}, log in to your portal to schedule your next appointment with Lee Anne.</p>
       <a href="${portalUrl}" style="display:inline-block;background:#c9a96e;color:white;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:700;margin-top:8px;">Schedule Session ${sessionNumber + 1}</a>`;

  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
      <div style="background:#c9a96e;padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">Mind & Body Reset</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="color:#4a4a4a;font-size:16px;">Hi ${clientName},</p>
        ${isLastSession
          ? `<p style="color:#4a4a4a;font-size:16px;">🎉 <strong>Congratulations!</strong> You've completed all 6 sessions of the Mind & Body Reset program. This is a huge milestone and you should be incredibly proud of the work you've done.</p>`
          : `<p style="color:#4a4a4a;font-size:16px;">Great work completing <strong>Session ${sessionNumber}: ${sessionLabel}</strong>! You're making real progress on your Mind & Body Reset journey.</p>`
        }
        ${notesSection}
        ${ctaSection}
        <hr style="border:none;border-top:1px solid #e8e0d8;margin:32px 0;" />
        <p style="color:#8a9a8a;font-size:13px;text-align:center;">
          Mind & Body Reset with Lee Anne<br/>
          <a href="${portalUrl}" style="color:#c9a96e;">View Your Portal</a>
        </p>
      </div>
    </div>
  `;

  const textBody = isLastSession
    ? `Hi ${clientName},\n\nCongratulations on completing all 6 sessions of the Mind & Body Reset program!\n\n${adminNotes ? `Lee Anne's Notes:\n${adminNotes}\n\n` : ""}Visit your portal: ${portalUrl}`
    : `Hi ${clientName},\n\nGreat work completing Session ${sessionNumber}: ${sessionLabel}!\n\n${adminNotes ? `Lee Anne's Notes:\n${adminNotes}\n\n` : ""}Schedule your next session: ${portalUrl}`;

  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}
