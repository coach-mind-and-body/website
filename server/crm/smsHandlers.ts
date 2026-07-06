// @ts-nocheck
import twilio from "twilio";
import { notifyAllAdmins } from "../routers/push";
const createPatchedFetch = () => {}; const generateObject = () => {};
import { sendSms } from "../crm/automations";
import { getDb } from "../db";
import { conversations, messages, users, callLogs, aiKnowledge } from "../../drizzle/schema";
import { eq, desc, sql, and, or, like } from "drizzle-orm";
import { sendWelcomeVcf, triggerFormSubmissionSms } from "../crm/automations";
import { MESSAGE_TEMPLATES, resolvePlaceholders } from "../crm/templates";
import { formatSmsPushBody, resolveContactByPhone } from "../crm/contactResolver";
const reportError = (e) => console.error(e);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || "AC_placeholder",
  process.env.TWILIO_AUTH_TOKEN || "auth_placeholder"
);

export async function handleInboundSms(formData: Record<string, string>) {

  let { From, Body, MessageSid, MediaUrl0 } = formData;
  
  if (!From) {
    return "<Response><Say>No From</Say></Response>";
  }

  // Spam filter
  const blockedNumbers = [
    "14353176556", "14352105172", "14352006626", "14352000275", 
    "14352106899", "14352001866", "14352131697", "14352005665", 
    "14352015068", "14352106292", "14352003862", "14352001474"
  ];
  const cleanFrom = From.replace(/\D/g, '');
  if (blockedNumbers.some(num => cleanFrom.endsWith(num))) {
    console.log(`[SPAM FILTER] Blocked SMS from ${From}`);
    const twiml = new twilio.twiml.MessagingResponse();
    return twiml.toString();
  }

  // Parse platform prefix if it exists
  let platform: "sms" | "whatsapp" | "facebook" | "instagram" = "sms";
  if (From.startsWith("whatsapp:")) {
    platform = "whatsapp";
    From = From.replace("whatsapp:", "");
  } else if (From.startsWith("messenger:")) {
    platform = "facebook";
    From = From.replace("messenger:", "");
  } else if (From.startsWith("instagram:")) {
    platform = "instagram";
    From = From.replace("instagram:", "");
  }

  try {
    const db = await getDb();
    if (!db) return "<Response><Say>Database unavailable</Say></Response>";

    // 🚀 MFA Intercept & Forwarding
    const lowerBody = Body?.toLowerCase() || "";
    const isMfa = ["code", "verification", "g-", "pin", "instagram"].some(keyword => lowerBody.includes(keyword));
    
    if (isMfa && platform === "sms") {
      try {
        const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
        const targetCell = "+14358285621";
        if (twilioClient && twilioNumber) {
          await twilioClient.messages.create({
            body: `Fwd from ${From}:\n${Body}`,
            from: twilioNumber,
            to: targetCell,
          });
          console.log(`[MFA Intercept] Forwarded MFA SMS to Carter from ${From}`);
        }
      } catch (err) {
        console.error("[MFA Intercept] Failed to forward SMS:", err);
      }
    }

    // Idempotency: Twilio may retry the same MessageSid
    if (MessageSid) {
      const duplicate = await db.query.messages.findFirst({
        where: eq(messages.twilioSid, MessageSid),
      });
      if (duplicate) {
        console.log(`[SMS] Duplicate webhook for ${MessageSid}, acknowledging without re-processing`);
        const twiml = new twilio.twiml.MessagingResponse();
        return twiml.toString();
      }
    }

    // 1. Check if a conversation already exists for this number and platform
    let conv = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.platform, platform as any),
        platform === "sms" || platform === "whatsapp" 
          ? sql`REPLACE(REPLACE(REPLACE(REPLACE(${conversations.contactPhone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${From}, 10))`
          : eq(conversations.contactPhone, From)
      ),
      orderBy: [desc(conversations.lastMessageAt)]
    });

    // 2. If not, create a new conversation + fire VCF welcome
    if (!conv) {
      // Look up if this number belongs to an existing user using fuzzy match
      const phoneMatchSql = sql`REPLACE(REPLACE(REPLACE(REPLACE(${users.phone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${From}, 10))`;
      const existingUser = await db.query.users.findFirst({
        where: phoneMatchSql,
      });

      const newConv = await db.insert(conversations).values({
        contactPhone: From,
        contactEmail: existingUser?.email || null,
        userId: existingUser?.id || null,
        platform: platform as any,
        status: "open",
        unreadCount: 1,
      });


      conv = await db.query.conversations.findFirst({
        where: eq(conversations.id, newConv[0].insertId),
      });

      // ✨ Auto-send welcome text + VCF contact card to new leads
      if (conv) {
        sendWelcomeVcf(From, conv.id).catch(err =>
          console.error("[CRM] VCF auto-send failed:", err)
        );
      }
    } else {
      // Increment unread count and update last message time
      await db.update(conversations)
        .set({
          unreadCount: conv.unreadCount + 1,
          lastMessageAt: new Date(),
          status: "open" // reopen if it was closed
        })
        .where(eq(conversations.id, conv.id));
    }

    // 3. Log the inbound message
    await db.insert(messages).values({
      conversationId: conv!.id,
      direction: "inbound",
      content: Body,
      mediaUrl: MediaUrl0 || null,
      twilioSid: MessageSid,
      status: "received"
    });

    // Cancel active nurture + review drips when the customer replies
    const replyUserId = conv!.userId ?? (await resolveContactByPhone(db, From)).userId;
    if (replyUserId) {
      const { cancelActiveEnrollmentsForUser } = await import("./sequenceEnrollment");
      const { SEQUENCES_TO_CANCEL_ON_REPLY } = await import("./reviewSequenceEnrollment");
      cancelActiveEnrollmentsForUser(db, replyUserId, SEQUENCES_TO_CANCEL_ON_REPLY).catch(
        (err) => console.error("[CRM] Failed to cancel sequences on reply:", err)
      );
    }

    // Update conversation stats
    await db.update(conversations)
      .set({ 
        lastMessageAt: new Date(),
        unreadCount: sql`unreadCount + 1` 
      })
      .where(eq(conversations.id, conv!.id));

    // 4. Return an empty TwiML response to Twilio to acknowledge receipt
    const twiml = new twilio.twiml.MessagingResponse();
    /* Handled in route.ts */
    
    // 5. Fire PWA Push Notification
    const contact = await resolveContactByPhone(db, From);
    const senderName = contact.name || From;
    let isPremiumSubscriber = false;
    if (contact.userId) {
      const u = await db.query.users.findFirst({ where: eq(users.id, contact.userId) });
      if (u?.isPremium) isPremiumSubscriber = true;
    }

    notifyAllAdmins({
      title: senderName,
      body: formatSmsPushBody(Body),
      url: `/admin?tab=contacts`,
    }).catch(err => console.error("Push failed:", err));

    // 5.5 Keyword Responders
    if (Body && Body.trim().toUpperCase() === "BYU") {
      try {
        const { generateSubscriptionCheckoutUrl } = { generateSubscriptionCheckoutUrl: async () => "" };
        const { shortenLink } = await import("../crm/automations");
        const checkoutUrl = await generateSubscriptionCheckoutUrl(conv!.userId || 0, "byu");
        const shortUrl = checkoutUrl ? await shortenLink(checkoutUrl) : "";
        const replyText = `Thanks for your interest! Here is your exclusive $29/year BYU discount for the Flight Deal Premium Subscription: ${shortUrl}`;
        await sendSms(From, replyText);
        
        await db.insert(messages).values({
          conversationId: conv!.id,
          direction: "outbound",
          content: replyText,
          twilioSid: "keyword_auto",
          status: "sent",
          isAutomated: true
        });
        await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv!.id));
        
        // Skip AI responder for this message
        return;
      } catch (err) {
        console.error("Keyword responder error:", err);
      }
    }

    // 6. AI Auto-responder
    // Check for recent human intervention (within 48 hours)
    let isRecentHumanIntervention = false;
    if (conv) {
      const lastHumanMsg = await db.query.messages.findFirst({
        where: and(
          eq(messages.conversationId, conv.id),
          eq(messages.direction, "outbound"),
          eq(messages.isAutomated, false)
        ),
        orderBy: [desc(messages.createdAt)]
      });
      if (lastHumanMsg) {
        const hoursSinceHuman = (Date.now() - lastHumanMsg.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceHuman < 48) {
          isRecentHumanIntervention = true;
        }
      }
    }

    if (conv && conv.botActive && platform === "sms" && !isRecentHumanIntervention) {
      try {
        const threadDesc = await db.query.messages.findMany({
          where: eq(messages.conversationId, conv.id),
          orderBy: [desc(messages.createdAt)],
          limit: 15
        });
        const thread = threadDesc.reverse();
        
        const history = thread.map(m => `${m.direction === 'inbound' ? 'Customer' : 'Bot/Admin'}: ${m.content}`).join('\n');

        const rules = await db.query.aiKnowledge.findMany({
          where: eq(aiKnowledge.isActive, true)
        });
        const aiRulesContext = rules.length > 0 
          ? "\nCOMPANY POLICIES & KNOWLEDGE BASE:\n" + rules.map(r => `[${r.category}] ${r.title}: ${r.content}`).join("\n")
          : "";
        
        let dynamicContext = "";
        const lowerHistory = history.toLowerCase();
        const lowerBody = Body?.toLowerCase() || "";

        if (lowerHistory.includes("flight") || lowerHistory.includes("deal") || lowerBody.includes("flight") || lowerBody.includes("deal")) {
          const { flightDeals } = await import("../../drizzle/schema");
          const activeDeals = await db.query.flightDeals.findMany({
            where: eq(flightDeals.status, "active"),
            limit: 50,
            orderBy: (deals, { desc }) => [desc(deals.createdAt)]
          });
          if (activeDeals.length > 0) {
            dynamicContext += "\n\n--- CURRENT ACTIVE FLIGHT DEALS ---\n";
            dynamicContext += activeDeals.map(d => `- ${d.destinationCity} (from ${d.departureAirport}): $${d.dealPrice} ${d.airline ? "on " + d.airline : ""} (Dates: ${d.mainDates || 'Flexible/Various Dates'})`).join("\n");
          }
        }
        
        const prompt = `You are an AI assistant for Mind and Body.
Follow these 3 core sales phases in your text conversations:
Phase 1: Discovery. Ask targeted questions to understand the client's needs (Who are you traveling with? Any special occasions?).
Phase 2: Telling the Story. Connect products to their needs. ALWAYS use the word "recommend" when proposing a solution. Upsell airport transportation.
Phase 3: Overcoming Objections. If they hesitate, gently explore their budget or create urgency.

Keep your answers very brief, friendly, and conversational via SMS (1-2 sentences).
If this is the first message of the conversation, politely introduce yourself as an AI assistant.
If they want hotel recommendations, text them a brief overview based on their preferences.
If they ask about flight deals, ${isPremiumSubscriber ? "you can share as many flight deals as they want from the active deals list" : "you can help them with up to 3 flight deals from the active deals list"}. ONLY share deals if they are specifically relevant to their request (e.g., matching destination AND matching dates/months if specified). If no active deals match their exact request, politely tell them that you will look into it more and keep them in the loop. ${!isPremiumSubscriber ? "If they ask for more than 3, provide this upgrade link: https://coachmindandbody.com/premium" : ""}
If they ask for a human, or have a complex request, output HANDOFF. Otherwise, output your response text.

CRITICAL RULE: Do NOT ask a discovery question if the user has already provided the answer in the chat history. Once you know who they are traveling with and their desired destination, move immediately to Phase 2 and make a recommendation. Do not get stuck in a loop of repeatedly asking questions.

${aiRulesContext}${dynamicContext}

Conversation History:
${history}
Customer: ${Body}`;

        const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
        let text = "";
        if (typeof response.choices[0]?.message?.content === "string") {
          text = response.choices[0].message.content.trim();
        }

        if (text.includes("HANDOFF") || text.includes("handoff")) {
          await db.update(conversations).set({ botActive: false }).where(eq(conversations.id, conv.id));
          notifyAllAdmins({
            title: "AI Agent Handoff",
            body: `${senderName} has requested human assistance.`,
            url: `/admin?tab=contacts`,
          });
        } else if (text) {
          // Send response via twilio
          await sendSms(From, text);
          
          await db.insert(messages).values({
            conversationId: conv.id,
            direction: "outbound",
            content: text,
            twilioSid: "ai_auto",
            status: "sent",
            isAutomated: true
          });
          await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id));
        }
      } catch (err) {
        console.error("[AI Responder Error]:", err);
      }
    }
  } catch (error) {
    reportError("smsHandlers.inbound", error, { from: formData.From });
    return "<Response></Response>";
  }
}

export async function handleMessagingStatus(formData: Record<string, string>) {

  const { MessageSid, MessageStatus } = formData;
  
  if (MessageSid && MessageStatus) {
    try {
      const db = await getDb();
      if (db) {
        await db.update(messages)
          .set({ status: MessageStatus as any })
          .where(eq(messages.twilioSid, MessageSid));
      }
    } catch (e) {
      console.error("[Twilio Status Webhook Error]:", e);
    }
  }
  
  /* handled in route */
}
