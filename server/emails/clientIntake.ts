import { escapeHtml } from "../../lib/htmlEscape";
import { formatPhoneDisplay } from "../../lib/phone";
import {
  INTAKE,
  clientIntakeAdminUrl,
  clientIntakeAnswerLines,
  type ClientIntakeAnswers,
} from "@shared/clientIntake";

function answerBlock(label: string, value: string): string {
  const safe = escapeHtml(value).replace(/\n/g, "<br>");
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.45;color:#3f3a36;"><span style="color:#8a8178;">${escapeHtml(label)}</span><br><strong>${safe}</strong></p>`;
}

export function clientIntakeSubject(name: string): string {
  const clean = name.replace(/[\r\n]/g, " ").trim() || "New client";
  return `New client intake: ${clean}`;
}

export function buildClientIntakeCoachEmail(input: ClientIntakeAnswers): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = clientIntakeSubject(input.name);
  const lines = clientIntakeAnswerLines({
    ...input,
    phone: formatPhoneDisplay(input.phone),
  });
  const adminUrl = clientIntakeAdminUrl();
  const text = [subject, "", ...lines.flatMap((line) => [line.label, line.value, ""]), `Open in the admin portal: ${adminUrl}`].join(
    "\n"
  );
  const html = `<div style="font-family:Georgia,'Times New Roman',serif;color:#3f3a36;font-size:16px;line-height:1.5;max-width:560px;">
<p style="margin:0 0 18px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#8a8178;">${escapeHtml(INTAKE.eyebrow)}</p>
${lines.map((line) => answerBlock(line.label, line.value)).join("\n")}
<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:14px;"><a href="${escapeHtml(adminUrl)}" style="color:#8a6a32;">Open in the admin portal</a></p>
</div>`;
  return { subject, html, text };
}
