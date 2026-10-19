import { escapeHtml } from "../../lib/htmlEscape";
import { formatPhoneDisplay } from "../../lib/phone";
import {
  HOLIDAY_COPY,
  HOLIDAY_YES_NO,
  applicationFirstName,
  holidayCoachSubject,
  holidayFlags,
  type HolidayApplicationInput,
  type HolidayYesNoKey,
} from "@shared/holidayCoaching";

function yn(value: "yes" | "no"): string {
  return value === "yes" ? "Yes" : "No";
}

function line(label: string, value: string): string {
  const safe = escapeHtml(value).replace(/\n/g, "<br>");
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.45;color:#3f3a36;"><span style="color:#8a8178;">${escapeHtml(label)}</span><br><strong>${safe}</strong></p>`;
}

export function buildHolidayApplicantEmail(fullName: string): {
  subject: string;
  html: string;
  text: string;
} {
  const first = applicationFirstName(fullName);
  const hello = first === "there" ? "Hi," : `Hi ${first},`;
  const body = HOLIDAY_COPY.applicantThanks;
  const text = `${hello}\n\n${body}\n\nLee Anne\nMind and Body Reset Coaching`;
  const html = `<div style="font-family:Georgia,'Times New Roman',serif;color:#3f3a36;font-size:17px;line-height:1.55;max-width:520px;">
<p style="margin:0 0 14px;">${escapeHtml(hello)}</p>
<p style="margin:0 0 14px;">${escapeHtml(body)}</p>
<p style="margin:18px 0 0;">Lee Anne<br><span style="font-family:Arial,sans-serif;font-size:13px;color:#8a8178;">Mind and Body Reset Coaching</span></p>
</div>`;
  return {
    subject: "I have your application",
    html,
    text,
  };
}

export function buildHolidayCoachEmail(input: HolidayApplicationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = holidayCoachSubject(input.fullName);
  const phone = formatPhoneDisplay(input.phone);
  const flags = holidayFlags(input);
  const answers = HOLIDAY_YES_NO.map((question) => ({
    label: question.label,
    value: yn(input[question.key as HolidayYesNoKey]),
  }));

  const utmRows: { label: string; value: string }[] = [
    ["utm_source", input.utmSource],
    ["utm_medium", input.utmMedium],
    ["utm_campaign", input.utmCampaign],
    ["utm_content", input.utmContent],
    ["utm_term", input.utmTerm],
    ["fbclid", input.fbclid],
    ["Landing URL", input.landingUrl],
  ]
    .filter((row): row is [string, string] => Boolean(row[1]))
    .map(([label, value]) => ({ label, value }));

  const textParts = [
    subject,
    "",
    input.fullName,
    input.email,
    phone,
    "",
  ];
  if (flags.length) {
    textParts.push("Flags:", ...flags.map((flag) => `- ${flag}`), "");
  }
  textParts.push(
    "Why coaching:",
    input.whyCoaching,
    "",
    "What she hopes for:",
    input.hopes,
    ""
  );
  for (const answer of answers) {
    textParts.push(`${answer.label} ${answer.value}`);
  }
  textParts.push("");
  if (utmRows.length === 0) {
    textParts.push("No UTM parameters on this visit.");
  } else {
    textParts.push("Tracking:");
    for (const row of utmRows) textParts.push(`${row.label}: ${row.value}`);
  }

  const flagHtml = flags.length
    ? `<div style="margin:0 0 18px;padding:12px 14px;background:#f8efe4;border-radius:8px;">
        <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#8a5a2a;">Flags</p>
        <ul style="margin:0;padding-left:18px;">${flags
          .map((flag) => `<li style="margin:0 0 4px;">${escapeHtml(flag)}</li>`)
          .join("")}</ul>
      </div>`
    : "";

  const utmHtml =
    utmRows.length === 0
      ? `<p style="margin:0;color:#8a8178;font-size:14px;">No UTM parameters on this visit.</p>`
      : utmRows.map((row) => line(row.label, row.value)).join("");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#3f3a36;max-width:560px;">
<p style="margin:0 0 8px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#8a8178;">Holiday coaching application</p>
<p style="margin:0 0 12px;font-size:20px;line-height:1.3;">${escapeHtml(input.fullName)}</p>
<p style="margin:0 0 4px;"><a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></p>
<p style="margin:0 0 16px;"><a href="tel:${escapeHtml(input.phone.replace(/[^\d+]/g, ""))}">${escapeHtml(phone)}</a></p>
${flagHtml}
${line("Why coaching", input.whyCoaching)}
${line("What she hopes for", input.hopes)}
${answers.map((answer) => line(answer.label, answer.value)).join("")}
<h2 style="margin:20px 0 8px;font-size:15px;">Tracking</h2>
${utmHtml}
</div>`;

  return { subject, html, text: textParts.join("\n") };
}
