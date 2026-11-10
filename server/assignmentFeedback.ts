function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAssignmentFeedbackMessage(input: {
  clientName: string;
  programLabel: string;
  moduleTitle: string;
  question: string;
  feedback: string;
}): { subject: string; htmlBody: string; textBody: string } {
  const name = input.clientName.trim() || "there";
  const subject = `Feedback from Lee Anne on ${input.moduleTitle}`;
  const hubUrl = "https://mindandbodyresetcoach.com/portal/hub";
  const textBody = [
    `Hi ${name},`,
    "",
    `Lee Anne left feedback on your ${input.programLabel} work.`,
    "",
    input.moduleTitle,
    input.question,
    "",
    input.feedback,
    "",
    `Open your program: ${hubUrl}`,
    "",
    "With love,",
    "Lee Anne",
  ].join("\n");

  const htmlBody = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#faf5f5;font-family:Georgia,serif;color:#2d3b2d;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="font-size:16px;">Hi ${escapeHtml(name)},</p>
    <p style="font-size:16px;line-height:1.5;">Lee Anne left feedback on your <strong>${escapeHtml(input.programLabel)}</strong> work.</p>
    <p style="margin:0 0 8px;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;color:#8a9a8a;">${escapeHtml(input.moduleTitle)}</p>
    <p style="margin:0 0 16px;font-size:15px;color:#5a6b5a;">${escapeHtml(input.question)}</p>
    <div style="background:#ffffff;border-left:4px solid #c9a96e;padding:16px 20px;border-radius:0 12px 12px 0;">
      <p style="margin:0;white-space:pre-wrap;font-size:16px;line-height:1.5;">${escapeHtml(input.feedback)}</p>
    </div>
    <p style="margin-top:24px;">
      <a href="${hubUrl}" style="display:inline-block;background:#c9a96e;color:#ffffff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:700;">Open your program</a>
    </p>
    <p style="color:#8a9a8a;font-size:14px;">With love,<br/>Lee Anne</p>
  </div>
</body>
</html>`;

  return { subject, htmlBody, textBody };
}
