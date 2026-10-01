/**
 * Upserts a draft newsletter inviting the full list to the iPhone app.
 * Does not send. Review in Admin → Newsletters, then schedule.
 *
 * Usage: npx tsx scripts/seed-app-store-newsletter.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { emailNewsletters } from "../drizzle/schema";
import { BRAND } from "../shared/brand";
import { countNewsletterAudience } from "../server/newsletterAudience";
import { mountainToUtc } from "../lib/mountainTime";
import {
  DEFAULT_GREETING,
  DEFAULT_SIGN_OFF_CLOSING,
  DEFAULT_SIGN_OFF_NAME,
  DEFAULT_SIGN_OFF_TITLE,
} from "../server/emails/newsletterShell";

const SUBJECT = "The iPhone app is live — it's free";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  const audience = await countNewsletterAudience(db, { audienceGroup: "all" });
  console.log(`Everyone audience: ${audience.total}`);

  const values = {
    subject: SUBJECT,
    previewText: "Mind & Body Reset is free on the App Store",
    headline: "The iPhone app is live",
    subheadline: "Free — habits, food log, recipes, and this week's challenge",
    greetingTemplate: DEFAULT_GREETING,
    signOffClosing: DEFAULT_SIGN_OFF_CLOSING,
    signOffName: DEFAULT_SIGN_OFF_NAME,
    signOffTitle: DEFAULT_SIGN_OFF_TITLE,
    bodyHtml: `<p>The Mind &amp; Body Reset app is on the App Store. It's free.</p>
<p>If you've been using the tracker in your browser, this is the same home — habits, food log, recipes, the 5-Day No Processed Food Challenge, and the podcast — as a real iPhone app.</p>
<p>Install it, then sign in with <strong>this same email</strong> so your challenge and check-ins stay with you.</p>
<p>On Android? Keep using the tracker on the website. It still works.</p>`,
    ctaLabel: "Get the iPhone app",
    ctaUrl: BRAND.appStoreUrl,
    audienceGroup: "all" as const,
    excludeEnrolled: false,
    excludeEmails: "[]",
    status: "draft" as const,
    scheduledAt: new Date(mountainToUtc("2026-09-29T10:00")),
  };

  const existing = await db
    .select({ id: emailNewsletters.id, status: emailNewsletters.status })
    .from(emailNewsletters)
    .where(eq(emailNewsletters.subject, SUBJECT))
    .limit(1);

  if (existing[0]) {
    if (existing[0].status === "sent" || existing[0].status === "sending") {
      console.log("already sent — leaving it");
      return;
    }
    await db
      .update(emailNewsletters)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(emailNewsletters.id, existing[0].id));
    console.log(`updated draft id=${existing[0].id} (not sent — review in Newsletters)`);
  } else {
    const [res] = await db.insert(emailNewsletters).values(values);
    console.log(`created draft id=${res.insertId} (not sent — review in Newsletters)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
