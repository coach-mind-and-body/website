/**
 * Process email newsletters that are in "sending" status.
 * Mirrors SMS campaign job: worker polls and delivers via Resend.
 */
import { eq } from "drizzle-orm";
import { emailNewsletters } from "../drizzle/schema";
import { getDb } from "./db";
import { sendMarketingEmail } from "./emailMarketing";
import {
  buildNewsletterHtml,
  personalizeNewsletterText,
} from "./emails/newsletterShell";
import {
  resolveNewsletterAudience,
  type NewsletterAudienceGroup,
} from "./newsletterAudience";

let processing = false;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseExcludeEmails(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((e): e is string => typeof e === "string")
      : [];
  } catch {
    return [];
  }
}

async function processOneNewsletter(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  row: typeof emailNewsletters.$inferSelect
) {
  const recipients = await resolveNewsletterAudience(db, {
    audienceGroup: row.audienceGroup as NewsletterAudienceGroup,
    excludeEnrolled: row.excludeEnrolled,
    excludeEmails: parseExcludeEmails(row.excludeEmails),
  });

  await db
    .update(emailNewsletters)
    .set({
      recipientCount: recipients.length,
      status: "sending",
    })
    .where(eq(emailNewsletters.id, row.id));

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  const reasonLine =
    row.audienceGroup === "finance"
      ? "You're receiving this because you joined our Financial Peace list at mindandbodyresetcoach.com."
      : row.audienceGroup === "health"
        ? "You're receiving this because you joined our health & wellness list at mindandbodyresetcoach.com."
        : "You're receiving this because you joined our email list at mindandbodyresetcoach.com.";

  for (const recipient of recipients) {
    // Re-check status in case cancelled mid-send
    const [current] = await db
      .select({ status: emailNewsletters.status })
      .from(emailNewsletters)
      .where(eq(emailNewsletters.id, row.id))
      .limit(1);
    if (current?.status === "cancelled") {
      console.log(`[Newsletter] ${row.id} cancelled mid-send`);
      break;
    }

    const first = recipient.firstName;
    const htmlBody = buildNewsletterHtml({
      firstName: first,
      previewText: row.previewText
        ? personalizeNewsletterText(row.previewText, first)
        : row.previewText,
      headline: row.headline
        ? personalizeNewsletterText(row.headline, first)
        : row.headline,
      subheadline: row.subheadline
        ? personalizeNewsletterText(row.subheadline, first)
        : row.subheadline,
      bodyHtml: row.bodyHtml,
      ctaLabel: row.ctaLabel
        ? personalizeNewsletterText(row.ctaLabel, first)
        : row.ctaLabel,
      ctaUrl: row.ctaUrl,
    });

    try {
      const ok = await sendMarketingEmail({
        to: recipient.email,
        toName: recipient.firstName,
        subject: personalizeNewsletterText(row.subject, first),
        htmlBody,
        reasonLine,
      });
      if (ok) sentCount++;
      else skippedCount++; // opted out or resend misconfigured
    } catch (err) {
      failedCount++;
      console.error(
        `[Newsletter] Failed to send #${row.id} to ${recipient.email}:`,
        err
      );
    }

    // Gentle pacing for Resend rate limits (~2/sec max on free tiers)
    await sleep(350);

    // Periodic progress updates every 10 sends
    if ((sentCount + failedCount + skippedCount) % 10 === 0) {
      await db
        .update(emailNewsletters)
        .set({ sentCount, failedCount, skippedCount })
        .where(eq(emailNewsletters.id, row.id));
    }
  }

  const [finalRow] = await db
    .select({ status: emailNewsletters.status })
    .from(emailNewsletters)
    .where(eq(emailNewsletters.id, row.id))
    .limit(1);

  if (finalRow?.status === "cancelled") {
    await db
      .update(emailNewsletters)
      .set({ sentCount, failedCount, skippedCount })
      .where(eq(emailNewsletters.id, row.id));
    return;
  }

  const finalStatus =
    sentCount > 0 ? "sent" : recipients.length === 0 ? "failed" : failedCount === recipients.length ? "failed" : "sent";

  await db
    .update(emailNewsletters)
    .set({
      sentCount,
      failedCount,
      skippedCount,
      recipientCount: recipients.length,
      status: finalStatus,
      sentAt: new Date(),
    })
    .where(eq(emailNewsletters.id, row.id));

  console.log(
    `[Newsletter] #${row.id} "${row.subject}" finished: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped of ${recipients.length}`
  );
}

export async function processSendingNewsletters() {
  if (processing) return;
  processing = true;
  try {
    const db = await getDb();
    if (!db) return;

    const due = await db
      .select()
      .from(emailNewsletters)
      .where(eq(emailNewsletters.status, "sending"));

    for (const row of due) {
      try {
        await processOneNewsletter(db, row);
      } catch (err) {
        console.error(`[Newsletter] Fatal error processing #${row.id}:`, err);
        await db
          .update(emailNewsletters)
          .set({ status: "failed" })
          .where(eq(emailNewsletters.id, row.id));
      }
    }
  } finally {
    processing = false;
  }
}
