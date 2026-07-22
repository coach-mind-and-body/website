/**
 * Notifications service
 * Handles: Twilio SMS and Resend email
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
import { Resend } from "resend";

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
    body = `Congratulations ${clientName}! 🎉 You've completed all 6 sessions of the Mind & Body Reset Coaches program. It's been an honor working with you! Visit your portal to access all your session notes: ${portalUrl}`;
  } else {
    const nextSession = sessionNumber + 1;
    body = `Great session today, ${clientName}! Session ${sessionNumber} is complete. When you're ready, log in to your portal to schedule Session ${nextSession}: ${portalUrl}`;
  }
  return sendSMS(clientPhone, body);
}

// ── Resend Email ──────────────────────────────────────────────────────────────

function getResendClient(): Resend | null {
  if (!ENV.resendApiKey) return null;
  return new Resend(ENV.resendApiKey);
}

export async function sendTransactionalEmail(params: {
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn("[Email] Resend not configured — skipping email to", params.to);
    return false;
  }
  try {
    const { error } = await client.emails.send({
      from: `Lee Anne — Mind & Body Reset Coaches <${ENV.resendFromEmail}>`,
      to: [params.to],
      subject: params.subject,
      html: params.htmlBody,
      text: params.textBody,
    });
    if (error) {
      console.error(`[Email] Resend error for ${params.to}:`, error);
      return false;
    }
    console.log(`[Email] Sent via Resend to ${params.to}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

/** Send a formatted alert email to the site owner (Lee Anne) */
export async function sendOwnerEmail(params: {
  subject: string;
  htmlBody: string;
  textBody?: string;
}): Promise<boolean> {
  const { ENV } = await import("./_core/env");
  return sendTransactionalEmail({
    to: ENV.ownerEmail,
    toName: "Lee Anne",
    subject: params.subject,
    htmlBody: params.htmlBody,
    textBody: params.textBody,
  });
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
    ? `🎉 Congratulations on Completing Your Mind & Body Reset Coaches!`
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
        <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">Mind & Body Reset Coaches</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="color:#4a4a4a;font-size:16px;">Hi ${clientName},</p>
        ${isLastSession
          ? `<p style="color:#4a4a4a;font-size:16px;">🎉 <strong>Congratulations!</strong> You've completed all 6 sessions of the Mind & Body Reset Coaches program. This is a huge milestone and you should be incredibly proud of the work you've done.</p>`
          : `<p style="color:#4a4a4a;font-size:16px;">Great work completing <strong>Session ${sessionNumber}: ${sessionLabel}</strong>! You're making real progress on your Mind & Body Reset Coaches journey.</p>`
        }
        ${notesSection}
        ${ctaSection}
        <hr style="border:none;border-top:1px solid #e8e0d8;margin:32px 0;" />
        <p style="color:#8a9a8a;font-size:13px;text-align:center;">
          Mind & Body Reset Coaches with Lee Anne<br/>
          <a href="${portalUrl}" style="color:#c9a96e;">View Your Portal</a>
        </p>
      </div>
    </div>
  `;

  const textBody = isLastSession
    ? `Hi ${clientName},\n\nCongratulations on completing all 6 sessions of the Mind & Body Reset Coaches program!\n\n${adminNotes ? `Lee Anne's Notes:\n${adminNotes}\n\n` : ""}Visit your portal: ${portalUrl}`
    : `Hi ${clientName},\n\nGreat work completing Session ${sessionNumber}: ${sessionLabel}!\n\n${adminNotes ? `Lee Anne's Notes:\n${adminNotes}\n\n` : ""}Schedule your next session: ${portalUrl}`;

  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}

// ── Client Welcome Emails ─────────────────────────────────────────────────────

const WELCOME_PORTAL_URL = "https://mindandbodyresetcoach.com/portal";
const RECLAIM_FIRST_BOOKING_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3tlzR8FWHdYzdtXqI43ULRAnOYehFPjpe7uLgjQn9fJ3udHMCJLlIQhahbQ9-_R-GjtY8r6O5k?gv=true";
const FPU_COACHING_WELCOME_BOOKING_URL = "https://calendar.app.google/yRUeVUq92caSbC2P9";
const FPU_FIRST_SESSION_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0bkAzm-mKLEZx1FBdO_3E5FVC6wR8P1hQRNuFtZWPFT7lFtiWQC7tHupNtWlH0Wt0A_CqUuV71?gv=true";

/** Welcome email sent to a new R.E.C.L.A.I.M. client after payment */
export async function sendReclaimWelcomeEmail(params: {
  clientEmail: string;
  clientName: string;
  isPaidInFull: boolean;
}): Promise<boolean> {
  const { clientEmail, clientName, isPaidInFull } = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Welcome to R.E.C.L.A.I.M., ${firstName}! Here's how to get started`;

  const paymentNote = isPaidInFull
    ? `<p style="color:#4a4a4a;font-size:15px;">Your full payment of <strong>$597</strong> has been received — you're all set!</p>`
    : `<p style="color:#4a4a4a;font-size:15px;">Your <strong>$200 deposit</strong> has been received. Your remaining balance of $397 will be due before your 4th session.</p>`;

  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#3a5a3a 0%,#5a7a5a 100%);padding:40px;text-align:center;">
        <h1 style="margin:0 0 8px;color:white;font-size:28px;font-weight:700;">Welcome to R.E.C.L.A.I.M.</h1>
        <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">Reclaim Your Body. Rewire Your Mind. Reset Your Life.</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Hi ${firstName},</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">I'm so excited to welcome you to the <strong>R.E.C.L.A.I.M. program</strong>! This is a transformative 6-session journey and I can't wait to support you every step of the way.</p>
        ${paymentNote}
        <div style="background:#f4f8f4;border:1px solid #c8dcc8;border-radius:10px;padding:24px 28px;margin:24px 0;">
          <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#3a5a3a;">Here's what to do next:</p>
          <ol style="margin:0;padding-left:20px;color:#4a4a4a;font-size:15px;line-height:1.8;">
            <li><strong>Create your client portal account</strong> at <a href="https://mindandbodyresetcoach.com/portal" style="color:#3a5a3a;font-weight:600;">mindandbodyresetcoach.com/portal</a> — this is where you'll track your sessions and access your resources.</li>
            <li style="margin-top:8px;"><strong>Book your first session</strong> using the button below — pick a time that works for you!</li>
          </ol>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ3tlzR8FWHdYzdtXqI43ULRAnOYehFPjpe7uLgjQn9fJ3udHMCJLlIQhahbQ9-_R-GjtY8r6O5k?gv=true" style="display:inline-block;background:#3a5a3a;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;">Book Your First Session</a>
        </div>
        <p style="color:#4a4a4a;font-size:15px;">If you have any questions before your first session, just reply to this email — I'm here for you!</p>
        <p style="color:#4a4a4a;font-size:15px;margin-top:24px;">With love and excitement,<br/><strong>Lee Anne</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | Mind &amp; Body Reset</span></p>
      </div>
      <div style="background:#f9f5f0;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d8;">
        <p style="margin:0;color:#8a9a8a;font-size:12px;">Mind &amp; Body Reset &middot; <a href="https://mindandbodyresetcoach.com" style="color:#c9a96e;">mindandbodyresetcoach.com</a></p>
      </div>
    </div>
  `;

  const lines = [
    `Hi ${firstName},`,
    ``,
    `Welcome to R.E.C.L.A.I.M.! I'm so excited to have you on this journey.`,
    ``,
    isPaidInFull
      ? `Your full payment of $597 has been received.`
      : `Your $200 deposit has been received. Your remaining balance of $397 is due before your 4th session.`,
    ``,
    `Next steps:`,
    `1. Create your portal account: https://mindandbodyresetcoach.com/portal`,
    `2. Book your first session: https://calendar.google.com/calendar/appointments/schedules/AcZssZ3tlzR8FWHdYzdtXqI43ULRAnOYehFPjpe7uLgjQn9fJ3udHMCJLlIQhahbQ9-_R-GjtY8r6O5k?gv=true`,
    ``,
    `If you have any questions, just reply to this email!`,
    ``,
    `With love,`,
    `Lee Anne`,
    `Mind & Body Reset Coaches`,
  ];
  const textBody = lines.join("\n");

  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}

/** Welcome email sent when an admin manually creates an account for a client */
export async function sendWelcomeAndSetPasswordEmail(params: {
  clientEmail: string;
  clientName: string;
  resetToken: string;
}): Promise<boolean> {
  const { clientEmail, clientName, resetToken } = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Welcome to R.E.C.L.A.I.M., ${firstName}! Action Required`;
  const resetUrl = `${ENV.appPublicUrl || "https://mindandbodyresetcoach.com"}/reset-password?token=${resetToken}`;

  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#3a5a3a 0%,#5a7a5a 100%);padding:40px;text-align:center;">
        <h1 style="margin:0 0 8px;color:white;font-size:28px;font-weight:700;">Welcome to R.E.C.L.A.I.M.</h1>
        <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">Your account has been created!</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Hi ${firstName},</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">I'm so excited to welcome you to the <strong>R.E.C.L.A.I.M. program</strong>! I've created your client portal account.</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">To get started, please set your password by clicking the button below (or you can choose to "Continue with Google" on the login page if you use a Google account):</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#3a5a3a;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;">Set Your Password</a>
        </div>
        <p style="color:#4a4a4a;font-size:15px;margin-top:24px;">With love and excitement,<br/><strong>Lee Anne</strong></p>
      </div>
    </div>
  `;

  const textBody = `Hi ${firstName},\n\nWelcome to R.E.C.L.A.I.M.! I've created your client portal account.\n\nPlease set your password to get started:\n${resetUrl}\n\nWith love,\nLee Anne`;

  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}

/** Welcome email sent to a new FPU client after purchase */
export async function sendFpuWelcomeEmail(params: {
  clientEmail: string;
  clientName: string;
  includesCoaching: boolean;
}): Promise<boolean> {
  const { clientEmail, clientName, includesCoaching } = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Welcome to Financial Peace University, ${firstName}! Here's how to get started`;

  const coachingSection = includesCoaching
    ? `
        <div style="background:#fff8f0;border:1px solid #f0d8b8;border-radius:10px;padding:20px 24px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#c9a96e;">You also have FPU Coaching Sessions!</p>
          <p style="margin:0;font-size:14px;color:#4a4a4a;">Your package includes personal coaching sessions with me. Book your first coaching session here:</p>
          <div style="text-align:center;margin-top:16px;">
            <a href="https://calendar.app.google/yRUeVUq92caSbC2P9" style="display:inline-block;background:#c9a96e;color:white;padding:12px 28px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:700;">Book Your First Coaching Session</a>
          </div>
        </div>`
    : "";

  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#c9a96e 0%,#e8c98a 100%);padding:40px;text-align:center;">
        <h1 style="margin:0 0 8px;color:white;font-size:28px;font-weight:700;">Welcome to FPU!</h1>
        <p style="margin:0;color:rgba(255,255,255,0.9);font-size:15px;">Financial Peace University with Mind &amp; Body Reset</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Hi ${firstName},</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Congratulations on taking this powerful step toward <strong>financial freedom</strong>! I'm so proud of you for investing in yourself and your future.</p>
        <p style="color:#4a4a4a;font-size:15px;">Your payment has been received and your FPU enrollment is confirmed.</p>
        <div style="background:#fffbf4;border:1px solid #f0d8b8;border-radius:10px;padding:24px 28px;margin:24px 0;">
          <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#c9a96e;">Here's what to do next:</p>
          <ol style="margin:0;padding-left:20px;color:#4a4a4a;font-size:15px;line-height:1.8;">
            <li><strong>Book your first FPU session</strong> using the button below to get started on your financial peace journey.</li>
            <li style="margin-top:8px;"><strong>Create your portal account</strong> at <a href="https://mindandbodyresetcoach.com/portal" style="color:#c9a96e;font-weight:600;">mindandbodyresetcoach.com/portal</a> to track your progress.</li>
          </ol>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0bkAzm-mKLEZx1FBdO_3E5FVC6wR8P1hQRNuFtZWPFT7lFtiWQC7tHupNtWlH0Wt0A_CqUuV71?gv=true" style="display:inline-block;background:#c9a96e;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;">Book Your First FPU Session</a>
        </div>
        ${coachingSection}
        <p style="color:#4a4a4a;font-size:15px;">I'm honored to be part of your financial peace journey. If you have any questions, just reply to this email!</p>
        <p style="color:#4a4a4a;font-size:15px;margin-top:24px;">With excitement,<br/><strong>Lee Anne</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | Mind &amp; Body Reset</span></p>
      </div>
      <div style="background:#f9f5f0;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d8;">
        <p style="margin:0;color:#8a9a8a;font-size:12px;">Mind &amp; Body Reset &middot; <a href="https://mindandbodyresetcoach.com" style="color:#c9a96e;">mindandbodyresetcoach.com</a></p>
      </div>
    </div>
  `;

  const coachingLine = includesCoaching ? `\n3. Book your first coaching session: https://calendar.app.google/yRUeVUq92caSbC2P9` : "";
  const lines2 = [
    `Hi ${firstName},`,
    ``,
    `Welcome to Financial Peace University! Your enrollment is confirmed.`,
    ``,
    `Next steps:`,
    `1. Book your first FPU session: https://calendar.google.com/calendar/appointments/schedules/AcZssZ0bkAzm-mKLEZx1FBdO_3E5FVC6wR8P1hQRNuFtZWPFT7lFtiWQC7tHupNtWlH0Wt0A_CqUuV71?gv=true`,
    `2. Create your portal account: https://mindandbodyresetcoach.com/portal${coachingLine}`,
    ``,
    `If you have any questions, just reply to this email!`,
    ``,
    `With excitement,`,
    `Lee Anne`,
    `Mind & Body Reset Coaches`,
  ];
  const textBody = lines2.join("\n");

  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}

/** Send a balance reminder email to a RECLAIM deposit client */
export async function sendBalanceReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  paymentUrl: string;
}): Promise<boolean> {
  const { clientEmail, clientName, paymentUrl } = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Friendly Reminder: Your R.E.C.L.A.I.M. Balance of $397 is Due`;

  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#3a5a3a 0%,#5a7a5a 100%);padding:40px;text-align:center;">
        <h1 style="margin:0 0 8px;color:white;font-size:26px;font-weight:700;">R.E.C.L.A.I.M. Balance Reminder</h1>
        <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">Mind &amp; Body Reset with Lee Anne</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Hi ${firstName},</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">I hope you're enjoying your R.E.C.L.A.I.M. journey so far! This is a friendly reminder that your remaining program balance is due.</p>
        <div style="background:#f9f5f0;border-left:4px solid #c9a96e;padding:20px 24px;margin:24px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#3a5a3a;">Balance Due</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#c9a96e;">$397</p>
          <p style="margin:6px 0 0;font-size:13px;color:#6a6a6a;">Remaining balance for your 6-session R.E.C.L.A.I.M. program</p>
        </div>
        <p style="color:#4a4a4a;font-size:15px;">You can pay securely online using the button below:</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${paymentUrl}" style="display:inline-block;background:#3a5a3a;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;">Pay $397 Balance Now</a>
        </div>
        <p style="color:#4a4a4a;font-size:14px;">If you have any questions or need to discuss payment arrangements, just reply to this email — I'm always happy to help!</p>
        <p style="color:#4a4a4a;font-size:15px;margin-top:24px;">With love,<br/><strong>Lee Anne</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | Mind &amp; Body Reset</span></p>
      </div>
      <div style="background:#f9f5f0;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d8;">
        <p style="margin:0;color:#8a9a8a;font-size:12px;">Mind &amp; Body Reset &middot; <a href="https://mindandbodyresetcoach.com" style="color:#c9a96e;">mindandbodyresetcoach.com</a></p>
      </div>
    </div>
  `;

  const textBody = [
    `Hi ${firstName},`,
    ``,
    `This is a friendly reminder that your R.E.C.L.A.I.M. program balance of $397 is due.`,
    ``,
    `Pay securely here: ${paymentUrl}`,
    ``,
    `If you have any questions, just reply to this email!`,
    ``,
    `With love,`,
    `Lee Anne`,
    `Mind & Body Reset Coaches`,
  ].join("\n");

  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}

/**
 * Notify Lee Anne when someone signs up for the FPU group class via /financial-peace.
 * Includes the client's name and email so she can add them to the Google Calendar event.
 */
export async function sendOwnerFpuGroupSignUpEmail(params: {
  clientName: string;
  clientEmail: string;
}): Promise<boolean> {
  const { clientName, clientEmail } = params;
  const subject = `📚 New FPU Group Sign-Up: ${clientName}`;

  const htmlBody = `
<div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#fffdf9;border:1px solid #e8ddd0;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#3a6b35 0%,#2d5229 100%);padding:28px 32px;text-align:center;">
    <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.75);">Mind & Body Reset Coaches</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">New FPU Group Sign-Up!</h1>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 20px;font-size:16px;color:#3a3028;">Hi Lee Anne,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#5a4a3a;line-height:1.6;">
      Someone just signed up for your <strong>Financial Peace University group class</strong>. Here are their details:
    </p>
    <div style="background:#f4f0eb;border-radius:10px;padding:20px 24px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8a7060;width:80px;">Name</td>
          <td style="padding:6px 0;font-size:15px;color:#3a3028;font-weight:600;">${clientName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8a7060;">Email</td>
          <td style="padding:6px 0;font-size:15px;color:#3a3028;"><a href="mailto:${clientEmail}" style="color:#3a6b35;">${clientEmail}</a></td>
        </tr>
      </table>
    </div>
    <div style="background:#fff8e8;border-left:4px solid #c9a96e;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#5a3e28;">📅 Next Step — Add to Google Calendar</p>
      <ol style="margin:10px 0 0;padding-left:20px;font-size:14px;color:#5a4a3a;line-height:1.8;">
        <li>Open your Tuesday FPU recurring event in Google Calendar</li>
        <li>Click <strong>Edit → "This and following events"</strong></li>
        <li>Go to <strong>Guests</strong> and add <strong>${clientEmail}</strong></li>
        <li>Save — they'll receive the calendar invite automatically</li>
      </ol>
    </div>
    <p style="margin:0;font-size:14px;color:#8a7060;line-height:1.6;">
      This sign-up was recorded in your portal. You can view all FPU group sign-ups in the Admin dashboard.
    </p>
  </div>
  <div style="background:#f4f0eb;padding:16px 32px;text-align:center;border-top:1px solid #e8ddd0;">
    <p style="margin:0;font-size:12px;color:#8a7060;">Mind & Body Reset Coaches · Sent via your portal</p>
  </div>
</div>`;

  const textBody = [
    `New FPU Group Sign-Up!`,
    ``,
    `Name: ${clientName}`,
    `Email: ${clientEmail}`,
    ``,
    `Next step: Add ${clientEmail} to your Tuesday FPU recurring Google Calendar event.`,
    `(Edit → "This and following events" → Guests → Save)`,
    ``,
    `Lee Anne — Mind & Body Reset Coaches`,
  ].join("\n");

  return sendOwnerEmail({ subject, htmlBody, textBody });
}

/**
 * Send a confirmation email to the visitor who just signed up for the FPU group class.
 * Lets them know Lee Anne received their sign-up and will be in touch with the calendar invite.
 */
export async function sendFpuGroupSignUpConfirmationEmail(params: {
  clientName: string;
  clientEmail: string;
}): Promise<boolean> {
  const { clientName, clientEmail } = params;
  const subject = `You're signed up for Financial Peace University! 🎉`;

  const htmlBody = `
<div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#fffdf9;border:1px solid #e8ddd0;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#3a6b35 0%,#2d5229 100%);padding:28px 32px;text-align:center;">
    <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.75);">Mind & Body Reset Coaches</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">You're In! 🎉</h1>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 16px;font-size:16px;color:#3a3028;">Hi ${clientName},</p>
    <p style="margin:0 0 20px;font-size:15px;color:#5a4a3a;line-height:1.6;">
      I'm so excited you signed up for <strong>Financial Peace University</strong>! You've just taken a huge step toward financial freedom — and I can't wait to walk this journey with you.
    </p>
    <div style="background:#f4f0eb;border-radius:10px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#5a3e28;">📅 What Happens Next</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#5a4a3a;line-height:1.8;">
        <li>I'll add you to our Tuesday group session on Google Calendar</li>
        <li>You'll receive a calendar invite at this email address</li>
        <li>Our next cohort kicks off <strong>May 12, 2026</strong></li>
      </ul>
    </div>
    <div style="background:#fff8e8;border-left:4px solid #c9a96e;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#5a4a3a;line-height:1.6;">
        <strong style="color:#5a3e28;">Questions before we start?</strong><br/>
        Just reply to this email — I read every one.
      </p>
    </div>
    <p style="margin:0;font-size:15px;color:#5a4a3a;line-height:1.6;">
      See you on Tuesday! 💚
    </p>
    <p style="margin:16px 0 0;font-size:15px;color:#3a3028;font-weight:600;">
      — Lee Anne<br/>
      <span style="font-weight:400;color:#8a7060;font-size:13px;">Mind & Body Reset Coaches · Certified Life &amp; Health Coach</span>
    </p>
  </div>
  <div style="background:#f4f0eb;padding:16px 32px;text-align:center;border-top:1px solid #e8ddd0;">
    <p style="margin:0;font-size:12px;color:#8a7060;">Mind & Body Reset Coaches · You're receiving this because you signed up for FPU.</p>
  </div>
</div>`;

  const textBody = [
    `Hi ${clientName},`,
    ``,
    `You're signed up for Financial Peace University! 🎉`,
    ``,
    `What happens next:`,
    `- I'll add you to our Tuesday group session on Google Calendar`,
    `- You'll receive a calendar invite at this email address`,
    `- Our next cohort kicks off May 12, 2026`,
    ``,
    `Questions? Just reply to this email.`,
    ``,
    `See you on Tuesday! 💚`,
    ``,
    `— Lee Anne`,
    `Mind & Body Reset Coaches`,
  ].join("\n");

  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}

// ── Reclaim LMS Emails ────────────────────────────────────────────────────────

export async function sendModuleUnlockedEmail(params: {
  clientEmail: string;
  clientName: string;
  moduleTitle: string;
  moduleOrder: number;
}): Promise<boolean> {
  const { clientEmail, clientName, moduleTitle, moduleOrder } = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Module ${moduleOrder} Unlocked: ${moduleTitle}`;

  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#3a5a3a 0%,#5a7a5a 100%);padding:40px;text-align:center;">
        <h1 style="margin:0 0 8px;color:white;font-size:24px;font-weight:700;">New Module Unlocked!</h1>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Hi ${firstName},</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Based on your recent progress, <strong>Module ${moduleOrder}: ${moduleTitle}</strong> is now available in your portal.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="https://mindandbodyresetcoach.com/portal/hub" style="display:inline-block;background:#3a5a3a;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;">View Your New Module</a>
        </div>
        <p style="color:#4a4a4a;font-size:15px;margin-top:24px;">With love,<br/><strong>Lee Anne</strong></p>
      </div>
    </div>
  `;

  const textBody = `Hi ${firstName},\n\nModule ${moduleOrder}: ${moduleTitle} is now available in your portal.\n\nView it here: https://mindandbodyresetcoach.com/portal/hub\n\nWith love,\nLee Anne`;
  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}

export async function sendModuleReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  moduleTitle: string;
  moduleOrder: number;
}): Promise<boolean> {
  const { clientEmail, clientName, moduleTitle, moduleOrder } = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Gentle Reminder: Module ${moduleOrder} is waiting for you`;

  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#3a5a3a 0%,#5a7a5a 100%);padding:40px;text-align:center;">
        <h1 style="margin:0 0 8px;color:white;font-size:24px;font-weight:700;">A Gentle Reminder</h1>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Hi ${firstName},</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">I noticed you haven't completed the assignments for <strong>Module ${moduleOrder}: ${moduleTitle}</strong> yet.</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Taking the time to reflect and complete these exercises is a crucial part of your Mind & Body Reset Coaches journey. Whenever you're ready, you can jump back in.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="https://mindandbodyresetcoach.com/portal/hub" style="display:inline-block;background:#3a5a3a;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;">Continue Your Module</a>
        </div>
        <p style="color:#4a4a4a;font-size:15px;margin-top:24px;">With love,<br/><strong>Lee Anne</strong></p>
      </div>
    </div>
  `;

  const textBody = `Hi ${firstName},\n\nI noticed you haven't completed the assignments for Module ${moduleOrder}: ${moduleTitle} yet.\n\nWhenever you're ready, jump back in here: https://mindandbodyresetcoach.com/portal/hub\n\nWith love,\nLee Anne`;
  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}

export async function sendOwnerAssignmentSubmittedEmail(params: {
  clientName: string;
  moduleTitle: string;
}): Promise<boolean> {
  const { clientName, moduleTitle } = params;
  const subject = `📝 Assignment Submitted: ${clientName}`;
  const htmlBody = `
    <div style="font-family:'Georgia',serif;padding:32px;">
      <p style="margin:0 0 20px;font-size:16px;">Hi Lee Anne,</p>
      <p style="margin:0 0 20px;font-size:15px;"><strong>${clientName}</strong> just submitted their assignment for <strong>${moduleTitle}</strong>.</p>
      <a href="https://mindandbodyresetcoach.com/admin" style="display:inline-block;background:#3a6b35;color:white;padding:10px 20px;border-radius:4px;text-decoration:none;">Review Submission</a>
    </div>
  `;
  const textBody = `Hi Lee Anne,\n\n${clientName} just submitted their assignment for ${moduleTitle}.\n\nReview it in your Admin portal.`;
  return sendOwnerEmail({ subject, htmlBody, textBody });
}

export async function sendAssignmentFeedbackEmail(params: {
  clientEmail: string;
  clientName: string;
  moduleTitle: string;
}): Promise<boolean> {
  const { clientEmail, clientName, moduleTitle } = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Lee Anne left feedback on your assignment`;

  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;padding:36px 40px;">
      <p style="color:#4a4a4a;font-size:16px;">Hi ${firstName},</p>
      <p style="color:#4a4a4a;font-size:16px;">Lee Anne just reviewed your assignment for <strong>${moduleTitle}</strong> and left some feedback for you.</p>
      <p style="color:#4a4a4a;font-size:16px;">If you're finding these modules helpful but would like 1-on-1 support to dive deeper into your personal journey, I’d love to chat. You can reply directly to this email or <a href="${ENV.appPublicUrl}/contact" style="color:#3a5a3a;font-weight:bold;text-decoration:underline;">reach out here</a> to discuss coaching.</p>
      <div style="margin-top:24px;">
        <a href="https://mindandbodyresetcoach.com/portal/hub" style="display:inline-block;background:#3a5a3a;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-weight:700;">Read Feedback</a>
      </div>
    </div>
  `;
  const textBody = `Hi ${firstName},\n\nLee Anne left feedback on your assignment for ${moduleTitle}.\n\nIf you're finding these modules helpful but would like 1-on-1 support to dive deeper into your personal journey, I’d love to chat. You can reply directly to this email or reach out here: ${ENV.appPublicUrl}/contact\n\nRead your feedback here: https://mindandbodyresetcoach.com/portal/hub`;
  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}

export async function sendSnackHackEmail(params: {
  clientEmail: string;
  clientName: string;
}): Promise<boolean> {
  const { clientEmail, clientName } = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Your Guide: The Midlife Mindset Snack Hack`;
  const pdfUrl = `${ENV.appPublicUrl}/late-night-snack-hack.pdf`;

  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:#FDFBF7;padding:30px;text-align:center;border-bottom:1px solid #f0e8e4;">
        <img src="${ENV.appPublicUrl}/logo-wide.jpg" alt="Mind & Body Reset Coaches" style="max-width:200px;height:auto;" />
      </div>
      <div style="background:linear-gradient(135deg,#fbeee9 0%,#f5dcd3 100%);padding:30px;text-align:center;">
        <h1 style="margin:0 0 8px;color:#8a7060;font-size:26px;font-weight:700;">The Midlife Mindset Guide</h1>
        <p style="margin:0;color:#8a7060;font-size:15px;">Finding Peace and Control with Late-Night Snacking</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Hi ${firstName},</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">I'm so excited to share this guide with you. The evening hours don't have to be a battleground. I hope these strategies bring you a profound sense of peace and control over your mindset.</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">You can download your free PDF guide below:</p>
        
        <div style="text-align:center;margin:32px 0;">
          <a href="${pdfUrl}" style="display:inline-block;background:#c9a96e;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;">Download the PDF Guide</a>
        </div>
        
        <div style="background:#fbeee9;border-left:4px solid #c9a96e;padding:20px 24px;margin:32px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#2d3b2d;">Bonus: Track Your Daily Reset</p>
          <p style="margin:0 0 16px;color:#5a6b5a;font-size:15px;line-height:1.6;">I've also created a free habit tracker for you to use. You can track your daily habits right on your phone or computer to start building momentum today!</p>
          <a href="${ENV.appPublicUrl}/habit-tracker" style="color:#c9a96e;font-weight:700;text-decoration:underline;">Open Your Free Habit Tracker</a>
        </div>

        <div style="margin:32px 0;padding:24px;border:1px solid #f0e8e4;border-radius:8px;background:#fff;">
          <h3 style="margin:0 0 12px;font-size:18px;color:#3a5a3a;">Tired of doing it alone?</h3>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.6;">A PDF is a great start, but real, lasting transformation usually requires someone in your corner. I am offering a free 30-minute Discovery Call to help you map out a personalized plan for your body and your habits.</p>
          <div style="text-align:center;">
            <a href="${ENV.appPublicUrl}/book" style="display:inline-block;background:#3a5a3a;color:white;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:700;">Book Your Free Discovery Call</a>
          </div>
        </div>

        <p style="color:#4a4a4a;font-size:15px;margin-top:32px;">With love and excitement,<br/><strong>Lee Anne</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | Mind &amp; Body Reset</span></p>
      </div>
    </div>
  `;

  const textBody = `Hi ${firstName},

I'm so excited to share this guide with you. The evening hours don't have to be a battleground. I hope these strategies bring you a profound sense of peace and control.

Download the PDF here: ${pdfUrl}

Bonus: Track Your Daily Reset
I've also created a free habit tracker for you to use. You can track your daily habits right on your phone or computer to start building momentum today!
Access it here: ${ENV.appPublicUrl}/habit-tracker

If you're tired of doing it alone, I am offering a free 30-minute Discovery Call to help you map out a personalized plan for your body and your habits. 
Book your free call here: ${ENV.appPublicUrl}/book

With love and excitement,
Lee Anne`;

  return sendTransactionalEmail({ to: clientEmail, toName: clientName, subject, htmlBody, textBody });
}
