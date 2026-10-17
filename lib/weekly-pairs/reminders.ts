import { Resend } from "resend";
import { APP_NAME } from "./config";
import type { Member } from "./schema";
import { andList, toE164 } from "./format";
import { appUrl } from "./url";
import { checkInPhrases, currentPeriodStart, isBiweekly, weekRangeLabel } from "./week";

type SendResult = { to: string; via: "email" | "sms"; ok: boolean; error?: string };

function fromAddress() {
  return (
    process.env.RESEND_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "coach@mindandbodyresetcoach.com"
  );
}

function resend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  const client = resend();
  const from = fromAddress();
  if (!client || !from) {
    return { to, via: "email", ok: false, error: "Email is not configured" };
  }
  try {
    const fromHeader = from.includes("<") ? from : `${APP_NAME} <${from}>`;
    const { error } = await client.emails.send({
      from: fromHeader,
      to: [to],
      subject,
      html,
      text,
    });
    if (error) return { to, via: "email", ok: false, error: error.message };
    return { to, via: "email", ok: true };
  } catch (err) {
    return { to, via: "email", ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}

async function sendSms(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  const e164 = toE164(to);
  if (!sid || !token || !from || !e164) {
    return { to, via: "sms", ok: false, error: "SMS is not configured" };
  }
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: e164, From: from, Body: body }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { to, via: "sms", ok: false, error: text.slice(0, 180) };
    }
    return { to, via: "sms", ok: true };
  } catch (err) {
    return { to, via: "sms", ok: false, error: err instanceof Error ? err.message : "sms failed" };
  }
}

function wrapHtml(title: string, body: string) {
  return `<!doctype html><html><body style="font-family:Georgia,serif;background:#f4f1ea;padding:24px;color:#1b1a17;">
  <div style="max-width:480px;margin:0 auto;background:#fffaf3;border:1px solid #e4d9c8;padding:28px 24px;border-radius:16px;">
    <p style="letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#1f5c57;font-weight:700;margin:0 0 8px;">${APP_NAME}</p>
    <h1 style="font-size:26px;line-height:1.2;margin:0 0 16px;">${title}</h1>
    <div style="font-size:16px;line-height:1.55;">${body}</div>
  </div>
</body></html>`;
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && fromAddress());
}

export function smsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
  );
}

export async function notifyMember(
  member: Member,
  message: { subject: string; preview: string; htmlBody: string; sms: string }
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  if (member.email) {
    results.push(
      await sendEmail(member.email, message.subject, wrapHtml(message.subject, message.htmlBody), message.preview)
    );
  }
  if (member.phone && smsConfigured()) {
    results.push(await sendSms(member.phone, message.sms));
  }
  return results;
}

export async function rsvpReminderCopy(member: Member, link: string, periodStart: string) {
  const first = member.name.split(" ")[0];
  const { span } = checkInPhrases(periodStart);
  const when = isBiweekly(periodStart) ? `${span} (${weekRangeLabel(periodStart)})` : span;
  return {
    subject: "One tap before Sunday's pairs",
    preview: `Hi ${first}, Lee Anne pairs the group Sunday evening. Are you coaching ${when}? ${link}`,
    htmlBody: `<p>Hi ${escapeHtml(first)},</p>
      <p>Lee Anne pairs the group Sunday evening. One tap tells her if you're coaching ${escapeHtml(when)}.</p>
      <p><a href="${link}" style="display:inline-block;background:#1f5c57;color:#fffaf3;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">I'm in or out</a></p>
      <p style="color:#6b645b;font-size:14px;">If the button doesn't work: ${escapeHtml(link)}</p>`,
    sms: `Hi ${first} — Lee Anne pairs the group Sunday evening. Are you coaching ${when}? ${link}`,
  };
}

export async function matchNoticeCopy(
  member: Member,
  partnerNames: string[],
  link: string,
  periodStart: string
) {
  const first = member.name.split(" ")[0];
  const withWho = andList(partnerNames);
  const { span } = checkInPhrases(periodStart);
  const when = isBiweekly(periodStart) ? `${span} (${weekRangeLabel(periodStart)})` : span;
  return {
    subject: `You're with ${withWho} ${span}`,
    preview: `You're with ${withWho} ${when}. Text them to pick a time. ${link}`,
    htmlBody: `<p>Hi ${escapeHtml(first)},</p>
      <p>You're with <strong>${escapeHtml(withWho)}</strong> ${escapeHtml(when)}.</p>
      <p>Text each other to pick a time — this tool doesn't schedule the meeting.</p>
      <p><a href="${link}" style="display:inline-block;background:#1f5c57;color:#fffaf3;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">See the pairs</a></p>`,
    sms: `You're with ${withWho} ${when}. Text them to pick a time. ${link}`,
  };
}

export async function checkInGroupText(periodStart = currentPeriodStart()) {
  const url = await appUrl();
  if (!isBiweekly(periodStart)) {
    return `This week's check-in is open.

Tap your name and say if you're in or out:
${url}`;
  }
  return `Check-in for these two weeks (${weekRangeLabel(periodStart)}) is open.

Tap your name and say if you're in or out:
${url}`;
}

export async function matchedGroupText(periodStart = currentPeriodStart()) {
  const url = await appUrl();
  if (!isBiweekly(periodStart)) {
    return `This week's pairs are up:
${url}

Text your person to pick a time.`;
  }
  return `Pairs for these two weeks (${weekRangeLabel(periodStart)}) are up:
${url}

Text your person to pick a time.`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
