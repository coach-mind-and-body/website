// @ts-nocheck
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CRM Automations
 * Handles: VCF auto-send, first-message welcome, form-submission triggers,
 * Stripe premium subscriber sync, and Short.io link shortening.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import twilio from "twilio";
import { getDb } from "../db";
import { conversations, messages, users, tags, userTags, sequences, sequenceSteps, sequenceEnrollments } from "../../drizzle/schema";
import { eq, and, asc, sql } from "drizzle-orm";

// ─── Twilio Client (lazy — only used when credentials are set) ────────────────
function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// ─── VCF Contact Card Content ─────────────────────────────────────────────────
// This is the digital business card that auto-sends to new leads.
const UTP_VCF_CONTENT = `BEGIN:VCARD
VERSION:3.0
FN:Carter - Mind and Body
N:;Carter;;;
ORG:Mind and Body
TITLE:Personal Travel Agent
TEL;TYPE=CELL,VOICE:+14354474464
EMAIL;TYPE=INTERNET:info@coachmindandbody.com
URL:https://www.coachmindandbody.com
NOTE:Your personal travel agent for Disney, Universal, Cruise, and more! ✈️
END:VCARD`;

// ─── Short.io Link Shortener ──────────────────────────────────────────────────
/**
 * Shortens a URL using Short.io and returns a branded tracked link.
 * Falls back to the original URL if the API call fails or is not configured.
 */
export async function shortenLink(longUrl: string, domain = "utahtravel.pro"): Promise<string> {
  const apiKey = process.env.SHORTIO_API_KEY;
  if (!apiKey) {
    console.warn("[Short.io] API key not configured, using original URL");
    return longUrl;
  }

  try {
    const response = await fetch("https://api.short.io/links", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ originalURL: longUrl, domain }),
    });

    if (!response.ok) {
      throw new Error(`Short.io API error: ${response.status}`);
    }

    const data = await response.json() as { shortURL?: string };
    return data.shortURL || longUrl;
  } catch (err) {
    console.error("[Short.io] Failed to shorten link:", err);
    return longUrl;
  }
}

/**
 * Finds all URLs in a string and shortens them using shortenLink.
 */
export async function shortenLinksInText(text: string): Promise<string> {
  if (!text) return text;
  let finalContent = text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = finalContent.match(urlRegex) || [];
  for (const url of urls) {
    if (!url.includes("utahtravel.pro")) {
      try {
        const short = await shortenLink(url);
        finalContent = finalContent.replace(url, short);
      } catch (e) {
        console.error("[Short.io] Failed to shorten inline link:", e);
      }
    }
  }
  return finalContent;
}

// ─── Send SMS Helper ──────────────────────────────────────────────────────────
export async function sendSms(to: string, body: string, mediaUrl?: string) {
  let finalBody = body
    .replace(/\(\(review_link\)\)/g, `https://coachmindandbody.com/reviews?p=${encodeURIComponent(to)}`)
    .replace(/\(\(payment_link\)\)/g, `https://coachmindandbody.com/premium?p=${encodeURIComponent(to)}`);

  finalBody = await shortenLinksInText(finalBody);

  const client = getTwilioClient();
  if (!client) {
    console.log(`[LOCAL DEV - Automation] Would have sent SMS to ${to}: ${finalBody}`);
    return null;
  }

  let cleanTo = to.replace(/\D/g, "");
  if (cleanTo.length === 10) cleanTo = "1" + cleanTo;
  
  if (cleanTo.length < 10) {
    throw new Error(`Invalid phone number: ${to}`);
  }
  
  if (!cleanTo.startsWith("+")) cleanTo = "+" + cleanTo;

  return client.messages.create({
    body: finalBody,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    from: process.env.TWILIO_MESSAGING_SERVICE_SID ? undefined : process.env.TWILIO_PHONE_NUMBER,
    to: cleanTo,
    mediaUrl: mediaUrl ? [mediaUrl] : undefined,
    statusCallback: process.env.APP_URL ? `${process.env.APP_URL}/api/crm/messaging/status` : undefined,
  });
}

// ─── VCF Auto-Send ────────────────────────────────────────────────────────────
/**
 * Called when a new conversation is created from an inbound SMS.
 * Sends a welcome text + VCF contact card to the new lead automatically.
 */
export async function sendWelcomeVcf(toPhone: string, conversationId: number) {
  const db = await getDb();

  const welcomeBody =
    "Hi! 👋 Thanks for reaching out to Mind and Body! I'm Carter, your personal travel agent. I've sent you my contact card — save it so you'll always have my info! I'll be in touch shortly. ✈️";

  try {
    // Step 1: Send welcome text
    const welcomeMsg = await sendSms(toPhone, welcomeBody);

    if (db) {
      await db.insert(messages).values({
        conversationId,
        direction: "outbound",
        senderName: "System",
        content: welcomeBody,
        twilioSid: welcomeMsg?.sid || "local_dev",
        status: "sent",
        isAutomated: true,
      });
      await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
    }

    // Step 2: Upload the VCF to Twilio media (or use a hosted URL)
    // For now we send a hosted VCF URL. When deployed, this will be a static asset URL.
    const vcfUrl = `${process.env.APP_URL || "https://www.coachmindandbody.com"}/utah-travel-pros.vcf`;
    const vcfMsg = await sendSms(toPhone, "", vcfUrl);

    if (db && vcfMsg) {
      await db.insert(messages).values({
        conversationId,
        direction: "outbound",
        senderName: "System",
        content: "[VCF Contact Card Sent]",
        mediaUrl: vcfUrl,
        twilioSid: vcfMsg.sid || "local_dev",
        status: "sent",
        isAutomated: true,
      });
      await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
    }

    console.log(`[CRM Automation] VCF welcome sent to ${toPhone}`);
  } catch (err) {
    console.error(`[CRM Automation] Failed to send VCF welcome to ${toPhone}:`, err);
  }
}

/** Sends only the VCF contact card (no extra intro text). */
export async function sendVcfContactCard(toPhone: string, conversationId: number) {
  const db = await getDb();

  try {
    const vcfUrl = `${process.env.APP_URL || "https://www.coachmindandbody.com"}/utah-travel-pros.vcf`;
    const vcfMsg = await sendSms(toPhone, "", vcfUrl);

    if (db && vcfMsg) {
      await db.insert(messages).values({
        conversationId,
        direction: "outbound",
        senderName: "System",
        content: "[VCF Contact Card Sent]",
        mediaUrl: vcfUrl,
        twilioSid: vcfMsg.sid || "local_dev",
        status: "sent",
        isAutomated: true,
      });
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    console.log(`[CRM Automation] VCF contact card sent to ${toPhone}`);
  } catch (err) {
    console.error(`[CRM Automation] Failed to send VCF to ${toPhone}:`, err);
  }
}

// ─── Form Submission Trigger ──────────────────────────────────────────────────
/**
 * Called when a "Plan Your Adventure" or other lead form is submitted.
 * Creates a conversation and sends a personalized first text.
 * This replaces the Zapier workflow.
 */
export async function triggerFormSubmissionSms(data: {
  phone: string;
  firstName: string;
  lastName?: string;
  destination?: string;
  email?: string;
}) {
  const db = await getDb();
  if (!db) return;

  const { phone, firstName, destination } = data;

  // Check if a conversation already exists for this number
  const existing = await db.query.conversations.findFirst({
    where: sql`REPLACE(REPLACE(REPLACE(REPLACE(${conversations.contactPhone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${phone}, 10))`,
  });

  if (existing) {
    // Already have this person, don't spam them
    console.log(`[Form Trigger] Existing conversation found for ${phone}, skipping auto-text`);
    return;
  }

  // Create new conversation
  const existingUser = await db.query.users.findFirst({
    where: eq(users.phone, phone),
  });

  const newConv = await db.insert(conversations).values({
    contactPhone: phone,
    contactEmail: data.email || null,
    userId: existingUser?.id || null,
    platform: "sms",
    status: "open",
    unreadCount: 0,
  });

  const convId = newConv[0].insertId;

  // Build the personalized auto-text
  const dest = destination ? ` to ${destination}` : "";
  const body = `Hi ${firstName}! 👋 Thanks for filling out our form! I'm Carter at Mind and Body and I'd love to help you plan an amazing trip${dest}. I'll be in touch very soon — feel free to reply here anytime! ✈️`;

  // Delay the initial text by 2.5 minutes so it feels more human
  setTimeout(async () => {
    try {
      const msg = await sendSms(phone, body);

      if (db) {
        await db.insert(messages).values({
          conversationId: convId,
          direction: "outbound",
          senderName: "System",
          content: body,
          twilioSid: msg?.sid || "local_dev",
          status: "sent",
          isAutomated: true,
        });
        await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, convId));
      }

      // Also send the VCF card
      await sendWelcomeVcf(phone, convId);

      console.log(`[Form Trigger] Auto-text + VCF sent to new lead: ${phone}`);
    } catch (err) {
      console.error(`[Form Trigger] Delayed auto-text failed for ${phone}:`, err);
    }
  }, 150000); // 2.5 minutes
}

// ─── Premium Subscriber Campaign Sync ────────────────────────────────────────
/**
 * Called from the Stripe webhook after a successful checkout.
 * Sends a "welcome to Premium" text and flags the conversation for the
 * "Flight Deal Friday Premium" campaign list.
 */
export async function syncPremiumSubscriberToCrm(userId: number, phone: string | null | undefined, name: string | null) {
  if (!phone) {
    console.log(`[CRM Premium Sync] User ${userId} has no phone number, skipping SMS`);
    return;
  }

  const db = await getDb();
  if (!db) return;

  // 1. Tag the user as "Premium Subscriber"
  let tag = await db.query.tags.findFirst({
    where: eq(tags.name, "Premium Subscriber"),
  });
  
  if (!tag) {
    const result = await db.insert(tags).values({ name: "Premium Subscriber", color: "#f59e0b" });
    tag = await db.query.tags.findFirst({ where: eq(tags.id, result[0].insertId) });
  }

  if (tag) {
    const existingUserTag = await db.query.userTags.findFirst({
      where: and(eq(userTags.userId, userId), eq(userTags.tagId, tag.id))
    });
    if (!existingUserTag) {
      await db.insert(userTags).values({ userId, tagId: tag.id });
    }
  }

  // 2. Find or create a conversation for this user
  let conv = await db.query.conversations.findFirst({
    where: sql`REPLACE(REPLACE(REPLACE(REPLACE(${conversations.contactPhone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${phone}, 10))`,
  });

  if (!conv) {
    const result = await db.insert(conversations).values({
      contactPhone: phone,
      userId,
      platform: "sms",
      status: "open",
      unreadCount: 0,
    });
    conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, result[0].insertId),
    });
  }

  if (!conv) return;

  // 3. Send the premium welcome text + contact card
  const firstName = name?.split(" ")[0] || "there";
  const body = `🌟 Welcome to Mind and Body Premium, ${firstName}! You'll get personalized deal emails every weekday plus exclusive Flight Deal Friday texts. I'm sending my contact card now — save it! Reply anytime. ✈️`;

  const msg = await sendSms(phone, body);

  await db.insert(messages).values({
    conversationId: conv.id,
    direction: "outbound",
    senderName: "System",
    content: body,
    twilioSid: msg?.sid || "local_dev",
    status: "sent",
    isAutomated: true,
  });
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id));

  await sendVcfContactCard(phone, conv.id);

  console.log(`[CRM Premium Sync] Welcome Premium SMS + VCF sent to user ${userId} at ${phone}`);
}


