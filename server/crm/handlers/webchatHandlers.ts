// @ts-nocheck
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Webchat AI Agent — Server Endpoints
 *
 * Powers the floating chat widget on the Mind and Body website.
 * Gemini handles conversations until a handoff condition is met,
 * at which point the conversation is moved to the Admin Inbox and
 * Carter receives a push notification.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from "../../db";
import { conversations, messages, flightDeals, aiKnowledge } from "../../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../../_core/llm";
import { sendWelcomeVcf } from "../../crm/automations";
import fs from "fs";
import path from "path";
// ─── Session Store (per browser session ID) ───────────────────────────────────
export interface WebchatSession {
  history: Array<{ role: "user" | "assistant"; content: string }>;
  exchangeCount: number;
  visitorName?: string;
  visitorPhone?: string;
  handedOff: boolean;
  conversationId?: number;
  initialUrl?: string;
}
export const sessions = new Map<string, WebchatSession>();

// ─── System Persona ───────────────────────────────────────────────────────────
export async function buildSystemPrompt(): Promise<string> {
  // Pull live flight deals for context
  let dealsContext = "No active deals right now — check back soon!";
  let aiRulesContext = "";
  try {
    const db = await getDb();
    if (db) {
      const deals = await db
        .select({
          city: flightDeals.destinationCity,
          price: flightDeals.dealPrice,
          airport: flightDeals.departureAirport,
          dates: flightDeals.mainDates,
        })
        .from(flightDeals)
        .where(eq(flightDeals.isActive, true))
        .orderBy(desc(flightDeals.updatedAt))
        .limit(10);

      if (deals.length > 0) {
        dealsContext = deals
          .map(d => `• ${d.city} from ${d.airport}: $${d.price}${d.dates ? ` (${d.dates})` : ""}`)
          .join("\n");
      }

      const rules = await db.query.aiKnowledge.findMany({
        where: eq(aiKnowledge.isActive, true)
      });
      if (rules.length > 0) {
        aiRulesContext = "\nCOMPANY POLICIES & KNOWLEDGE BASE:\n" + rules.map(r => `[${r.category}] ${r.title}: ${r.content}`).join("\n");
      }
    }
  } catch (_) {}

  return `You are the Mind and Body AI chat assistant on the website. You help visitors plan amazing vacations with Carter, a personal travel agent.

CURRENT LIVE FLIGHT DEALS:
${dealsContext}
${aiRulesContext}

Your personality: Warm, enthusiastic, helpful. You love travel and helping people plan dream vacations.

CURRENT DATE: ${new Date().toLocaleDateString()}

What you can help with:
- Flight deals from Salt Lake City (SLC) and Provo (PVU) airports
- Disney World, Disneyland, Disney Cruise, Aulani
- Universal Orlando (including Epic Universe, which opened in 2025), Universal Hollywood
- Beach destinations, international travel, cruises
- Directing visitors to fill out the "Plan Your Adventure" form

Follow these 3 core sales phases in your conversations:
Phase 1: Discovery. Ask targeted questions to understand the client's needs (Who are you traveling with? Any special occasions?).
Phase 2: Telling the Story. Connect products to their needs. ALWAYS use the word "recommend" when proposing a solution. Upsell airport transportation.
Phase 3: Overcoming Objections. If they hesitate, gently explore their budget or create urgency.

Note: Disney no longer uses Genie+ (it was replaced by Lightning Lane Multi Pass and Single Pass).

Keep responses SHORT and conversational. 2-3 sentences max. Use emojis sparingly.

COLLECT INFO: Naturally ask for the visitor's first name early on. 
When they ask a complex question, want pricing, or are ready to book, politely explain that you need to get Carter (the human expert) and naturally ask: "What's the best cell number to text you at?"

HANDOFF TRIGGERS — respond with exactly: HANDOFF_NEEDED
When any of these happen:
- Visitor provides their phone number in the chat (even if they just type digits)
- Visitor asks to talk to a human / Carter / agent
- Visitor wants specific pricing or availability you can't confirm
- 6+ exchanges have occurred
- Visitor says they're ready to book

If asked to hand off or if you collected a phone number, say something warm like "Great! Let me get Carter's attention — he'll be able to help you directly!" then include HANDOFF_NEEDED on a new line.

DO NOT make up specific prices not in the deals list above. DO NOT promise specific availability.`;
}

// ─── Extract info from conversation ──────────────────────────────────────────
export function extractVisitorInfo(history: Array<{ role: string; content: string }>) {
  const userText = history
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join(" ");

  const nameMatch = userText.match(/(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+)/i);
  const phoneMatch = userText.match(/(\+?1?\s*[\(\-]?\d{3}[\)\-\s]?\s*\d{3}[\-\s]?\d{4})/);

  return {
    name: nameMatch?.[1] || undefined,
    phone: phoneMatch?.[0]?.replace(/\D/g, "") || undefined,
  };
}


