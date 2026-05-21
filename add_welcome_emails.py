#!/usr/bin/env python3
"""Appends welcome email functions to notifications.ts"""

PORTAL_URL = "https://mindandbodyresetcoach.com/portal"
RECLAIM_BOOKING_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3tlzR8FWHdYzdtXqI43ULRAnOYehFPjpe7uLgjQn9fJ3udHMCJLlIQhahbQ9-_R-GjtY8r6O5k?gv=true"
FPU_COACHING_BOOKING_URL = "https://calendar.app.google/yRUeVUq92caSbC2P9"
FPU_FIRST_SESSION_BOOKING_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0bkAzm-mKLEZx1FBdO_3E5FVC6wR8P1hQRNuFtZWPFT7lFtiWQC7tHupNtWlH0Wt0A_CqUuV71?gv=true"

addition = f'''
// ── Client Welcome Emails ─────────────────────────────────────────────────────

const WELCOME_PORTAL_URL = "{PORTAL_URL}";
const RECLAIM_FIRST_BOOKING_URL =
  "{RECLAIM_BOOKING_URL}";
const FPU_COACHING_WELCOME_BOOKING_URL = "{FPU_COACHING_BOOKING_URL}";
const FPU_FIRST_SESSION_URL =
  "{FPU_FIRST_SESSION_BOOKING_URL}";

/** Welcome email sent to a new R.E.C.L.A.I.M. client after payment */
export async function sendReclaimWelcomeEmail(params: {{
  clientEmail: string;
  clientName: string;
  isPaidInFull: boolean;
}}): Promise<boolean> {{
  const {{ clientEmail, clientName, isPaidInFull }} = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Welcome to R.E.C.L.A.I.M., ${{firstName}}! Here's how to get started`;

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
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Hi ${{firstName}},</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">I'm so excited to welcome you to the <strong>R.E.C.L.A.I.M. program</strong>! This is a transformative 6-session journey and I can't wait to support you every step of the way.</p>
        ${{paymentNote}}
        <div style="background:#f4f8f4;border:1px solid #c8dcc8;border-radius:10px;padding:24px 28px;margin:24px 0;">
          <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#3a5a3a;">Here's what to do next:</p>
          <ol style="margin:0;padding-left:20px;color:#4a4a4a;font-size:15px;line-height:1.8;">
            <li><strong>Create your client portal account</strong> at <a href="{PORTAL_URL}" style="color:#3a5a3a;font-weight:600;">mindandbodyresetcoach.com/portal</a> — this is where you'll track your sessions and access your resources.</li>
            <li style="margin-top:8px;"><strong>Book your first session</strong> using the button below — pick a time that works for you!</li>
          </ol>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="{RECLAIM_BOOKING_URL}" style="display:inline-block;background:#3a5a3a;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;">Book Your First Session</a>
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
    `Hi ${{firstName}},`,
    ``,
    `Welcome to R.E.C.L.A.I.M.! I'm so excited to have you on this journey.`,
    ``,
    isPaidInFull
      ? `Your full payment of $597 has been received.`
      : `Your $200 deposit has been received. Your remaining balance of $397 is due before your 4th session.`,
    ``,
    `Next steps:`,
    `1. Create your portal account: {PORTAL_URL}`,
    `2. Book your first session: {RECLAIM_BOOKING_URL}`,
    ``,
    `If you have any questions, just reply to this email!`,
    ``,
    `With love,`,
    `Lee Anne`,
    `Mind & Body Reset`,
  ];
  const textBody = lines.join("\\n");

  return sendTransactionalEmail({{ to: clientEmail, toName: clientName, subject, htmlBody, textBody }});
}}

/** Welcome email sent to a new FPU client after purchase */
export async function sendFpuWelcomeEmail(params: {{
  clientEmail: string;
  clientName: string;
  includesCoaching: boolean;
}}): Promise<boolean> {{
  const {{ clientEmail, clientName, includesCoaching }} = params;
  const firstName = clientName.split(" ")[0] || clientName;
  const subject = `Welcome to Financial Peace University, ${{firstName}}! Here's how to get started`;

  const coachingSection = includesCoaching
    ? `
        <div style="background:#fff8f0;border:1px solid #f0d8b8;border-radius:10px;padding:20px 24px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#c9a96e;">You also have FPU Coaching Sessions!</p>
          <p style="margin:0;font-size:14px;color:#4a4a4a;">Your package includes personal coaching sessions with me. Book your first coaching session here:</p>
          <div style="text-align:center;margin-top:16px;">
            <a href="{FPU_COACHING_BOOKING_URL}" style="display:inline-block;background:#c9a96e;color:white;padding:12px 28px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:700;">Book Your First Coaching Session</a>
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
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Hi ${{firstName}},</p>
        <p style="color:#4a4a4a;font-size:16px;margin:0 0 16px;">Congratulations on taking this powerful step toward <strong>financial freedom</strong>! I'm so proud of you for investing in yourself and your future.</p>
        <p style="color:#4a4a4a;font-size:15px;">Your payment has been received and your FPU enrollment is confirmed.</p>
        <div style="background:#fffbf4;border:1px solid #f0d8b8;border-radius:10px;padding:24px 28px;margin:24px 0;">
          <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#c9a96e;">Here's what to do next:</p>
          <ol style="margin:0;padding-left:20px;color:#4a4a4a;font-size:15px;line-height:1.8;">
            <li><strong>Book your first FPU session</strong> using the button below to get started on your financial peace journey.</li>
            <li style="margin-top:8px;"><strong>Create your portal account</strong> at <a href="{PORTAL_URL}" style="color:#c9a96e;font-weight:600;">mindandbodyresetcoach.com/portal</a> to track your progress.</li>
          </ol>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="{FPU_FIRST_SESSION_BOOKING_URL}" style="display:inline-block;background:#c9a96e;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;">Book Your First FPU Session</a>
        </div>
        ${{coachingSection}}
        <p style="color:#4a4a4a;font-size:15px;">I'm honored to be part of your financial peace journey. If you have any questions, just reply to this email!</p>
        <p style="color:#4a4a4a;font-size:15px;margin-top:24px;">With excitement,<br/><strong>Lee Anne</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | Mind &amp; Body Reset</span></p>
      </div>
      <div style="background:#f9f5f0;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d8;">
        <p style="margin:0;color:#8a9a8a;font-size:12px;">Mind &amp; Body Reset &middot; <a href="https://mindandbodyresetcoach.com" style="color:#c9a96e;">mindandbodyresetcoach.com</a></p>
      </div>
    </div>
  `;

  const coachingLine = includesCoaching ? `\\n3. Book your first coaching session: {FPU_COACHING_BOOKING_URL}` : "";
  const lines2 = [
    `Hi ${{firstName}},`,
    ``,
    `Welcome to Financial Peace University! Your enrollment is confirmed.`,
    ``,
    `Next steps:`,
    `1. Book your first FPU session: {FPU_FIRST_SESSION_BOOKING_URL}`,
    `2. Create your portal account: {PORTAL_URL}${{coachingLine}}`,
    ``,
    `If you have any questions, just reply to this email!`,
    ``,
    `With excitement,`,
    `Lee Anne`,
    `Mind & Body Reset`,
  ];
  const textBody = lines2.join("\\n");

  return sendTransactionalEmail({{ to: clientEmail, toName: clientName, subject, htmlBody, textBody }});
}}
'''

with open('server/notifications.ts', 'a') as f:
    f.write(addition)

print("Done - welcome email functions appended to notifications.ts")
