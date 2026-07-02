// @ts-nocheck
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CRM AI Engine (Gemini)
 * Handles:
 *  1. AI-assisted message drafting (sparkle button in compose)
 *  2. Post-call transcription summary
 *  3. Context-aware suggestions using trip data and flight deals
 * ─────────────────────────────────────────────────────────────────────────────
 */

const generateObject = () => {};
import { getDb } from "../db";
import { trips, flightDeals, tripItineraryItems, vacationQuotes, aiKnowledge, systemSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Mind and Body System Persona ──────────────────────────────────────────
const DEFAULT_UTP_PERSONA = `You are a helpful assistant for Carter, a personal travel agent at Mind and Body. 
Carter is friendly, professional, enthusiastic about travel, and specializes in Disney, Universal Studios, Cruises, and flight deals from SLC/PVU airports in Utah.
You help Carter draft short, personalized, conversational SMS/text messages to send to his clients.
Keep messages concise (under 300 characters when possible), warm, and personal.
Never write formal business language. Write like a friendly, trusted travel advisor texting a client.
Do not include subject lines. Do not use asterisks or markdown. Plain text only.
Always sign off naturally — don't add "Carter" signatures unless the context calls for it.

CRITICAL RULES:
1. BILINGUAL SUPPORT: You must ALWAYS respond in the language the user is speaking. If the customer texts in Spanish, draft the reply in Spanish!
2. NO HALLUCINATION: If the customer asks a factual question (like policies, prices, or FAQs), you MUST ONLY use the provided "COMPANY POLICIES & KNOWLEDGE BASE". If the answer is not in the knowledge base, you must NOT invent an answer. Instead, draft a message saying: "I'll have Carter look into that and get right back to you!"
3. DISCOVERY LOOP PREVENTION: Do NOT ask a discovery question if the user has already provided the answer in the chat history. Once you know who they are traveling with and their desired destination, move immediately to Phase 2 and make a recommendation. Do not get stuck in a loop of repeatedly asking questions.`;

export async function getAiPersona(): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return DEFAULT_UTP_PERSONA;
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "AI_PERSONA")
    });
    return setting?.value || DEFAULT_UTP_PERSONA;
  } catch(e) {
    return DEFAULT_UTP_PERSONA;
  }
}

// ─── Draft Message from AI ────────────────────────────────────────────────────
/**
 * Generates a draft SMS message based on the conversation history and context.
 * Called when the admin clicks the ✨ sparkle button in the compose bar.
 */
export async function draftAiMessage(params: {
  conversationHistory: Array<{ direction: string; content: string; senderName?: string | null }>;
  contactName?: string | null;
  contactPhone?: string | null;
  userId?: number | null;
  userInstruction?: string; // Optional: what the admin wants to say
}): Promise<string> {
  const { conversationHistory, contactName, userId, userInstruction } = params;

  // Build context from the last 10 messages in the thread
  const historyContext = conversationHistory
    .slice(-10)
    .map(m => {
      const who = m.direction === "inbound" ? (contactName || "Customer") : "Carter (Admin)";
      return `${who}: ${m.content || "[media]"}`;
    })
    .join("\n");

  // Optionally pull relevant trip/deal data for this user
  let tripContext = "";
  let aiRulesContext = "";
  try {
    const db = await getDb();
    if (db) {
      const rules = await db.query.aiKnowledge.findMany({
        where: eq(aiKnowledge.isActive, true)
      });
      if (rules.length > 0) {
        aiRulesContext = "\n\nCOMPANY POLICIES & KNOWLEDGE BASE (Use these rules to craft your response):\n" + rules.map((r: any) => `[${r.category}] ${r.title}: ${r.content}`).join("\n");
      }

      if (userId) {
        const userTrips = await db
          .select({ destination: trips.destination, status: trips.status, startDate: trips.departureDate })
          .from(trips)
          .where(eq(trips.clientUserId, userId))
          .limit(3);

        if (userTrips.length > 0) {
          tripContext = `\n\nThis customer has existing trips: ${userTrips
            .map(t => `${t.destination} (${t.status})`)
            .join(", ")}.`;
        }
      }
    }
  } catch (_) { /* non-blocking */ }

  const firstName = contactName?.split(" ")[0] || "the customer";

  const prompt = userInstruction
    ? `Draft a friendly SMS to ${firstName}. Context: "${userInstruction}"\n\nRecent conversation:\n${historyContext}${tripContext}${aiRulesContext}`
    : `Based on this conversation with ${firstName}, draft the best next reply Carter should send.\n\nRecent conversation:\n${historyContext}${tripContext}${aiRulesContext}\n\nDraft Carter's next message:`;

  const persona = await getAiPersona();

  const result = await invokeLLM({
    messages: [
      { role: "system", content: persona },
      { role: "user", content: prompt },
    ],
    maxTokens: 300,
  });

  const raw = result.choices?.[0]?.message?.content;
  const text = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.map((p: any) => p.text || "").join("") : "";
  return text.trim();
}

// ─── Continuous Learning: Extract Knowledge ────────────────────────────────────
/**
 * Nightly cron job will call this to analyze closed conversations and extract 
 * new business facts or successful sales strategies as "Draft" facts.
 */
export async function extractKnowledgeFromHistory(history: string): Promise<Array<{ title: string; content: string; category: string }>> {
  if (!history || history.length < 50) return [];

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an AI continuous learning module for Mind and Body. 
Analyze the provided conversation transcript. Extract 1-3 highly specific, reusable business facts, policies, or successful sales strategies that the human agent (Carter) used or mentioned, which would be useful for training an AI assistant.
Do not extract specific customer personal details (like names or specific trip dates), but DO extract generalizable facts (e.g. "Disney requires a $200 deposit for packages", "If a customer is overwhelmed, recommend a split stay").
Format your response ONLY as a valid JSON array of objects with keys: "title" (short 3-5 words), "content" (detailed 1-2 sentence fact), and "category" (Must be exactly one of: "Policy", "Pricing", "Destinations", "Booking", "General"). If there's nothing useful to learn, return an empty array [].`
      },
      {
        role: "user",
        content: `Transcript:\n\n${history}`
      }
    ],
    maxTokens: 500
  });

  try {
    const content = (result.choices?.[0]?.message?.content as string) || "[]";
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    const cleaned = content.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse AI knowledge extraction:", e);
    return [];
  }
}

// ─── Call Summary Generator ───────────────────────────────────────────────────
/**
 * Takes a raw call transcript and generates a structured summary.
 * Injected into the chat thread as a visual call log card after a call ends.
 */
export async function summarizeCallTranscript(transcript: string, customerName?: string | null): Promise<string> {
  if (!transcript || transcript.trim().length < 20) {
    return "Call ended. No transcript available.";
  }

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a travel agency call summarizer. Summarize phone calls between Carter (travel agent) and clients in 2-4 bullet points. 
Focus on: what the client wants, any decisions made, action items for Carter, and any sensitive info that was paused from recording (flag with ⚠️).
Format as plain bullet points. Keep it under 100 words. Be specific and actionable.`,
      },
      {
        role: "user",
        content: `Summarize this call${customerName ? ` with ${customerName}` : ""}:\n\n${transcript}`,
      },
    ],
    maxTokens: 200,
  });

  const raw = result.choices?.[0]?.message?.content;
  const text = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.map((p: any) => p.text || "").join("") : "";
  return text.trim() || "Call summary unavailable.";
}

// ─── Context-Aware Quick Replies ──────────────────────────────────────────────
/**
 * Returns 3 suggested quick-reply options based on the last inbound message.
 * These appear as one-click chips above the compose box.
 */
export async function getQuickReplySuggestions(lastInboundMessage: string, contactName?: string | null): Promise<string[]> {
  const firstName = contactName?.split(" ")[0] || "the customer";

  const result = await invokeLLM({
    messages: [
      { 
        role: "system", 
        content: `${await getAiPersona()}\nReturn ONLY a JSON array of exactly 3 short (under 80 chars each) SMS reply options. No keys, just an array of strings.` 
      },
      {
        role: "user",
        content: `${firstName} just texted: "${lastInboundMessage}"\n\nSuggest 3 good replies Carter could send:`,
      },
    ],
    maxTokens: 200,
    response_format: { type: "json_object" },
  });

  try {
    const raw = result.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : "";
    const parsed = JSON.parse(text);
    // Handle both array and {replies: [...]} shapes
    const arr = Array.isArray(parsed) ? parsed : (parsed.replies || parsed.suggestions || Object.values(parsed)[0]);
    return Array.isArray(arr) ? arr.slice(0, 3).map(String) : [];
  } catch {
    return [];
  }
}
