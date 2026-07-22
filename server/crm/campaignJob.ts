import { getDb } from "../db";
import { campaigns, users, leads } from "../../drizzle/schema";
import { eq, and, lte, isNotNull, ne } from "drizzle-orm";
import { sendSms } from "./automations";

let processing = false;

function normalizePhoneKey(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

async function collectRecipientPhones(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const userRows = await db
    .select({ phone: users.phone })
    .from(users)
    .where(and(isNotNull(users.phone), ne(users.phone, "")));

  const leadRows = await db
    .select({ phone: leads.phone })
    .from(leads)
    .where(and(isNotNull(leads.phone), ne(leads.phone, "")));

  const seen = new Set<string>();
  const phones: string[] = [];

  for (const row of userRows) {
    if (!row.phone) continue;
    const key = normalizePhoneKey(row.phone);
    if (key.length >= 10 && !seen.has(key)) {
      seen.add(key);
      phones.push(row.phone);
    }
  }

  for (const row of leadRows) {
    if (!row.phone) continue;
    const key = normalizePhoneKey(row.phone);
    if (key.length >= 10 && !seen.has(key)) {
      seen.add(key);
      phones.push(row.phone);
    }
  }

  return phones;
}

async function processCampaign(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  campaign: typeof campaigns.$inferSelect
) {
  await db
    .update(campaigns)
    .set({ status: "sending" })
    .where(eq(campaigns.id, campaign.id));

  const phones = await collectRecipientPhones(db);
  let sentCount = 0;
  let failedCount = 0;

  for (const phone of phones) {
    try {
      await sendSms(phone, campaign.messageBody, campaign.mediaUrl ?? undefined);
      sentCount++;
    } catch (err) {
      failedCount++;
      console.error(`[Campaign Job] Failed to send campaign ${campaign.id} to ${phone}:`, err);
    }
  }

  const finalStatus = sentCount > 0 ? "completed" : "failed";

  await db
    .update(campaigns)
    .set({
      sentCount,
      failedCount,
      status: finalStatus,
    })
    .where(eq(campaigns.id, campaign.id));

  console.log(
    `[Campaign Job] Campaign ${campaign.id} "${campaign.name}" finished: ${sentCount} sent, ${failedCount} failed`
  );
}

export async function processScheduledCampaigns() {
  if (processing) return;
  processing = true;

  try {
    const db = await getDb();
    if (!db) return;

    const now = new Date();
    const dueCampaigns = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.status, "scheduled"), lte(campaigns.scheduledAt, now)));

    for (const campaign of dueCampaigns) {
      try {
        await processCampaign(db, campaign);
      } catch (err) {
        console.error(`[Campaign Job] Campaign ${campaign.id} failed:`, err);
        await db
          .update(campaigns)
          .set({ status: "failed" })
          .where(eq(campaigns.id, campaign.id));
      }
    }
  } finally {
    processing = false;
  }
}
