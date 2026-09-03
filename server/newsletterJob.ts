/**
 * Process email newsletters: due schedules → sending → Resend delivery + send log.
 */
import { and, eq, lte } from "drizzle-orm";
import { emailNewsletters, emailNewsletterSends } from "../drizzle/schema";
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

function reasonForAudience(group: string): string {
  if (group === "finance") {
    return "You're receiving this because you joined our Financial Peace list at mindandbodyresetcoach.com.";
  }
  if (group === "snack_hack") {
    return "You're receiving this because you downloaded The Midlife Mindset Snack Hack at mindandbodyresetcoach.com.";
  }
  if (group === "real_food_reset") {
    return "You're receiving this because you registered for the 5-Day Real Food Reset at mindandbodyresetcoach.com.";
  }
  if (group === "health") {
    return "You're receiving this because you joined our health & wellness list at mindandbodyresetcoach.com.";
  }
  return "You're receiving this because you joined our email list at mindandbodyresetcoach.com.";
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
  const reasonLine = reasonForAudience(row.audienceGroup);

  for (const recipient of recipients) {
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
      greetingTemplate: row.greetingTemplate,
      signOffClosing: row.signOffClosing,
      signOffName: row.signOffName,
      signOffTitle: row.signOffTitle,
      bodyHtml: row.bodyHtml,
      ctaLabel: row.ctaLabel
        ? personalizeNewsletterText(row.ctaLabel, first)
        : row.ctaLabel,
      ctaUrl: row.ctaUrl,
    });

    let outcome: "sent" | "failed" | "skipped" = "failed";
    let errorMessage: string | null = null;
    let resendEmailId: string | null = null;
    let deliveryStatus: "unknown" | "sent" | "failed" = "unknown";

    try {
      const result = await sendMarketingEmail({
        to: recipient.email,
        toName: recipient.firstName,
        subject: personalizeNewsletterText(row.subject, first),
        htmlBody,
        reasonLine,
        tags: [
          { name: "type", value: "newsletter" },
          { name: "newsletter_id", value: String(row.id) },
        ],
      });
      resendEmailId = result.resendEmailId ?? null;
      if (result.ok) {
        sentCount++;
        outcome = "sent";
        deliveryStatus = "sent";
      } else if (result.skipped) {
        skippedCount++;
        outcome = "skipped";
        errorMessage = result.error || "Opted out or Resend skipped";
      } else {
        failedCount++;
        outcome = "failed";
        deliveryStatus = "failed";
        errorMessage = result.error || "Resend failed";
      }
    } catch (err) {
      failedCount++;
      outcome = "failed";
      deliveryStatus = "failed";
      errorMessage = err instanceof Error ? err.message.slice(0, 480) : "Send failed";
      console.error(
        `[Newsletter] Failed to send #${row.id} to ${recipient.email}:`,
        err
      );
    }

    try {
      await db.insert(emailNewsletterSends).values({
        newsletterId: row.id,
        email: recipient.email,
        firstName: recipient.firstName,
        resendEmailId,
        status: outcome,
        deliveryStatus,
        errorMessage,
      });
    } catch (logErr) {
      console.warn("[Newsletter] Failed to log send:", logErr);
    }

    await sleep(350);

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
    sentCount > 0
      ? "sent"
      : recipients.length === 0
        ? "failed"
        : failedCount === recipients.length
          ? "failed"
          : "sent";

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

/** Promote due scheduled newsletters to sending, then process all sending. */
export async function processSendingNewsletters() {
  if (processing) return;
  processing = true;
  try {
    const db = await getDb();
    if (!db) return;

    const now = new Date();
    const dueScheduled = await db
      .select()
      .from(emailNewsletters)
      .where(
        and(
          eq(emailNewsletters.status, "scheduled"),
          lte(emailNewsletters.scheduledAt, now)
        )
      );

    for (const row of dueScheduled) {
      await db
        .update(emailNewsletters)
        .set({ status: "sending" })
        .where(eq(emailNewsletters.id, row.id));
      console.log(`[Newsletter] #${row.id} scheduled time reached — starting send`);
    }

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
