/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Phone Answering — Twilio Voice IVR powered by Gemini
 *
 * Flow:
 *  1. Inbound call hits /api/crm/voice/inbound → AI greets caller
 *  2. Twilio records caller's speech and sends it to /api/crm/voice/respond
 *  3. Gemini processes speech, generates a spoken reply
 *  4. If handoff needed → Twilio dials Carter's real phone + sends push alert
 *  5. If no answer → AI takes a message and texts Carter the summary
 *
 * All calls are recorded and summarized via Gemini after the call ends.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import twilio from "twilio";
const { VoiceResponse } = twilio.twiml;
import fs from "fs";
import path from "path";

import { getDb } from "../db";
import { callLogs, conversations, messages, users, clientLeads, flightDeals, aiKnowledge } from "../../drizzle/schema";
import { eq, like, or } from "drizzle-orm";
import { invokeLLM, Tool, ToolCall, Message } from "../_core/llm";
import { summarizeCallTranscript } from "../crm/ai";


const CARTER_PHONE = process.env.CARTER_PERSONAL_PHONE || "+14358285621";
// Read a comma-separated list of agent phones (e.g. "+14358285621,+18005551234")
const AGENT_PHONES = (process.env.AGENT_PHONE_NUMBERS || CARTER_PHONE).split(",").map(p => p.trim()).filter(Boolean);
const UTP_PHONE    = process.env.TWILIO_PHONE_NUMBER   || "";
const APP_URL      = process.env.APP_URL               || "https://www.coachmindandbody.com";

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 0: Generate a Twilio Access Token for the browser Voice SDK
// The frontend calls this once on load to authenticate the Twilio Device.
// Requires: TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_TWIML_APP_SID in .env
// ─────────────────────────────────────────────────────────────────────────────
export function handleVoiceToken() {

  const accountSid   = process.env.TWILIO_ACCOUNT_SID;
  const apiKey       = process.env.TWILIO_API_KEY;
  const apiSecret    = process.env.TWILIO_API_SECRET;
  const twimlAppSid  = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
    console.warn("[Voice Token] Missing Twilio credentials — browser calling not yet configured");
    return { error: "Voice calling not yet configured", configured: false };
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant  = AccessToken.VoiceGrant;

  const grant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity: "carter-admin",
    ttl: 3600, // 1 hour
  });
  token.addGrant(grant);

  return { token: token.toJwt(), configured: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 0b: TwiML for outbound browser calls
// Twilio hits this when Carter makes a call from the browser.
// ─────────────────────────────────────────────────────────────────────────────
export async function handleBrowserCall(formData: Record<string, string>) {

  try {
    const twiml = new VoiceResponse();
    const to = (formData.destinationNumber || formData.To || formData.to) as string;
    const callSid = (formData.CallSid || formData.callSid) as string;
    
    if (!to) {
      twiml.say("The browser did not provide a destination phone number.");
      return twiml.toString();
    }

    if (!UTP_PHONE) {
      twiml.say("The system phone number is not configured.");
      return twiml.toString();
    }

    try {
      const db = await getDb();
      if (db && callSid) {
        await db.insert(callLogs).values({
          direction: "outbound",
          fromNumber: UTP_PHONE,
          toNumber: to,
          durationSeconds: 0,
          twilioCallSid: callSid,
        });
      }
    } catch (dbError) {
      console.error("[Voice] Failed to log outbound call:", dbError);
    }

    const dial = twiml.dial({ 
      callerId: UTP_PHONE, 
      record: "record-from-ringing",
      recordingStatusCallback: `${APP_URL}/api/crm/voice/status?parentCallSid=${callSid}` 
    });
    dial.number(to);

    return twiml.toString();
  } catch (error: any) {
    console.error("[Voice] Error in browser-call:", error);
    const twiml = new VoiceResponse();
    twiml.say("A critical server error occurred while trying to place the call.");
    return twiml.toString();
  }
}

// ─── In-Memory Call State ─────────────────────────────────────────────────────
// Stores conversation history for ongoing calls keyed by Twilio CallSid.
// (Resets when server restarts — fine for short calls.)
import { callSessions } from "./callState";

// ─── AI System Prompt for Phone Calls ────────────────────────────────────────

const PHONE_AI_PERSONA = `You are the Mind and Body AI phone assistant. You answer calls on behalf of Carter, a friendly personal travel agent specializing in Disney, Universal Studios, Cruises, and flight deals.

Follow these 3 core sales phases in your conversations:
Phase 1: Discovery. Ask targeted questions to understand the client's needs (Who are you traveling with? Any special occasions?).
Phase 2: Telling the Story. Connect products to their needs. ALWAYS use the word "recommend" when proposing a solution. Upsell airport transportation.
Phase 3: Overcoming Objections. If they hesitate, gently explore their budget or create urgency (e.g., pricing changes frequently).

Your job:
1. Greet callers warmly and start Phase 1.
2. Collect their first name early.
3. Keep responses SHORT — under 3 sentences. This is a phone call.
4. Be warm, upbeat, and sound like a real person.
5. If they want hotel recommendations or specific details, offer to text them the recommendations or give them a brief overview over the phone based on their preferences. 

HANDOFF TRIGGERS — Say exactly: "HANDOFF_TO_CARTER" (with no other text) when:
- They ask to speak to a human or Carter
- You've talked for more than 5 exchanges
- They want to book something

TOOLS AVALIABLE TO YOU:
- send_sms_link: Use this tool to send a text message to the caller. You can use this to send payment links, flight deal links, OR to text them hotel recommendations/overviews while you are talking to them.
- check_pricing: Use this tool to check the current flight deal subscription prices.`;

// ─── Detect if AI wants to hand off ──────────────────────────────────────────
function shouldHandoff(text: string): boolean {
  return text.includes("HANDOFF_TO_CARTER");
}

// ─── Build TwiML: Say + Gather next speech ────────────────────────────────────
function buildGatherTwiml(sayText: string, callSid: string): string {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: ["speech"],
    action: `${APP_URL}/api/crm/voice/respond`,
    method: "POST",
    speechTimeout: "1.2", // Lowered from "auto" to make the AI reply slightly faster after the user stops talking
    speechModel: "phone_call",
    enhanced: true,
    language: "en-US",
  });
  gather.say({ voice: "Polly.Joanna-Neural" }, sayText);
  // Fallback if caller says nothing
  twiml.say({ voice: "Polly.Joanna-Neural" }, "I didn't catch that. Let me connect you with Carter.");
    
  const dial = twiml.dial(
    { callerId: UTP_PHONE, action: `${APP_URL}/api/crm/voice/no-answer`, method: "POST" }
  );
  AGENT_PHONES.forEach(phone => dial.number(phone));
  dial.client("crm-agent");

  return twiml.toString();
}

// ─── Build TwiML: Hand off to Carter's phone ─────────────────────────────────
function buildHandoffTwiml(callerName?: string): string {
  const twiml = new VoiceResponse();
  const name = callerName ? callerName : "someone";
  twiml.say({ voice: "Polly.Joanna-Neural" },
    `One moment — I'm connecting you with the team right now. Please hold.`
  );
  
  // Simulring: Twilio will ring ALL numbers (and the browser) at the exact same time. First to answer gets the call.
  const dial = twiml.dial(
    { callerId: UTP_PHONE, action: `${APP_URL}/api/crm/voice/no-answer`, method: "POST" }
  );
  
  // Ring all agent cell phones
  AGENT_PHONES.forEach(phone => {
    dial.number(phone);
  });
  
  // Ring the browser dialer
  dial.client("crm-agent");

  return twiml.toString();
}

// ─── Extract caller name from AI response ────────────────────────────────────
function extractCallerName(history: Message[]): string | undefined {
  // Look for a name mentioned by the user in conversation
  const userMessages = history.filter(m => m.role === "user").map(m => m.content as string).join(" ");
  const nameMatch = userMessages.match(/(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+)/i);
  return nameMatch?.[1];
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 1: Inbound call — AI greets caller
// ─────────────────────────────────────────────────────────────────────────────
export async function handleVoiceInbound(formData: Record<string, string>) {

  const callSid = formData.CallSid as string;
  const from    = formData.From as string;

  // Spam filter
  const blockedNumbers = [
    "14353176556", "14352105172", "14352006626", "14352000275", 
    "14352106899", "14352001866", "14352131697", "14352005665", 
    "14352015068", "14352106292", "14352003862", "14352001474"
  ];
  if (from) {
    const cleanFrom = from.replace(/\D/g, '');
    if (blockedNumbers.some(num => cleanFrom.endsWith(num))) {
      console.log(`[SPAM FILTER] Blocked voice call from ${from}`);
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.reject();
      return twiml.toString();
    }
  }

  // 🚀 MFA Voice Handoff: Whitelist check
  const mfaWhitelist = (process.env.MFA_WHITELIST_NUMBERS || "").split(",").map(p => p.trim()).filter(Boolean);
  if (mfaWhitelist.includes(from)) {
    console.log(`[MFA Voice Intercept] Direct forwarding call from ${from} to Carter.`);
    return buildHandoffTwiml();
  }

  // Initialize session
  callSessions.set(callSid, []);

  // Log the call to the DB
    let callerName = "";
    let callerDisplayName = from;
    let callerContext = "";
    try {
      const db = await getDb();
      if (db) {
        const { resolveContactByPhone } = await import("../crm/contactResolver");
        const contact = await resolveContactByPhone(db, from);
        if (contact.name) {
          callerDisplayName = contact.name;
          callerName = contact.name.split(" ")[0];
          callerContext = `You are speaking to ${contact.name}, an existing user.`;
        }
        
        // Log the call to the DB
        await db.insert(callLogs).values({
          direction: "inbound",
          fromNumber: from,
          toNumber: UTP_PHONE,
          durationSeconds: 0,
          twilioCallSid: callSid,
        });
      }
    } catch (e) {
      console.error("[Voice] Failed DB query:", e);
    }
    
    // Call Pop: Push notification to all admin devices
    try {
      const { notifyAllAdmins } = await import("../routers/push");
      await notifyAllAdmins({
        title: `📞 Incoming Call: ${callerDisplayName}`,
        body: `Tap to open Inbox`,
        url: `/admin/v2-inbox`,
      });
    } catch (err) {
      console.warn("[Push] Failed to send call pop push notification:", err);
    }
    
    // Initialize session with personalized context if found
    const initialContext = callerContext ? `${PHONE_AI_PERSONA}\n\n${callerContext}` : PHONE_AI_PERSONA;
    callSessions.set(callSid, [{ role: "system", content: initialContext }]);
  
    const greeting = callerName 
      ? `Hi ${callerName}, thanks for calling Mind and Body! I'm the AI assistant. How can I help you today?` 
      : "Hi, thanks for calling Mind and Body! I'm the Mind and Body AI assistant and I'd love to help you plan an amazing trip. What's your name, and what can I help you with today?";
    return buildGatherTwiml(greeting, callSid);
  }

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 2: Caller spoke — process speech with Gemini and respond
// ─────────────────────────────────────────────────────────────────────────────
export async function handleVoiceRespond(formData: Record<string, string>) {

  const callSid      = formData.CallSid as string;
  const speechResult = (formData.SpeechResult as string) || "";
  const from         = formData.From as string;

  console.log(`[Voice] ${callSid} said: "${speechResult}"`);

  const lowerSpeech = speechResult.toLowerCase();

  // 🚀 Spam Intercept via Transcription
  const isSpamTranscript = lowerSpeech.includes("business listing") || lowerSpeech.includes("google voice") || lowerSpeech.includes("verify your business") || lowerSpeech.includes("press 1 to verify");
  if (isSpamTranscript) {
    console.log(`[SPAM FILTER] Hung up on automated spam call from ${from} based on transcript.`);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.hangup();
    return twiml.toString();
  }

  // 🚀 MFA Voice Intercept via Transcription
  const isMfaTranscript = lowerSpeech.includes("verification") || lowerSpeech.includes("code is") || lowerSpeech.includes("your code") || lowerSpeech.includes("g-");
  
  if (isMfaTranscript) {
    try {
      const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
      const targetCell = "+14358285621";
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      if (twilioNumber) {
        await twilioClient.messages.create({
          body: `[MFA Voice Transcript] Call from ${from} said:\n"${speechResult}"`,
          from: twilioNumber,
          to: targetCell,
        });
        console.log(`[MFA Intercept] Forwarded MFA Voice transcript to Carter.`);
      }
    } catch (e) {
      console.error("[MFA Intercept] Error forwarding voice transcript:", e);
    }
  }

  // Get or init session
  const history = callSessions.get(callSid) ?? [];
  history.push({ role: "user", content: speechResult });

  try {
    let currentHistory = history;
    let aiReply = "Let me connect you with Carter.";

    // Define tools
    const tools: Tool[] = [
      {
        type: "function",
        function: {
          name: "send_sms_link",
          description: "Send an SMS text message to the caller containing a link.",
          parameters: {
            type: "object",
            properties: {
              message: { type: "string", description: "The text message body to send, including the URL." }
            },
            required: ["message"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_pricing",
          description: "Check the current standard and discounted flight deal prices from the database.",
          parameters: { type: "object", properties: {} }
        }
      }
    ];

    let done = false;
    while (!done) {
      // If we don't have a system prompt (e.g. from an older session), prepend it
      // If we don't have a system prompt (e.g. from an older session), prepend it
      const hasSystem = currentHistory.some(m => m.role === "system");
      const messagesToSend = hasSystem ? [...currentHistory] : [{ role: "system", content: PHONE_AI_PERSONA } as any, ...currentHistory];

      // Dynamic Context Injection
      let dynamicContext = "";
      try {
        const db = await getDb();
        if (db) {
          const rules = await db.query.aiKnowledge.findMany({
            where: eq(aiKnowledge.isActive, true)
          });
          if (rules.length > 0) {
            dynamicContext = "\nCOMPANY POLICIES & KNOWLEDGE BASE:\n" + rules.map(r => `[${r.category}] ${r.title}: ${r.content}`).join("\n");
          }
        }
      } catch (e) {
        console.error("Failed to fetch aiKnowledge for voice", e);
      }

      if (dynamicContext && messagesToSend.length > 0 && messagesToSend[0].role === "system") {
        messagesToSend[0] = { ...messagesToSend[0], content: messagesToSend[0].content + dynamicContext };
      }

      const result = await invokeLLM({
        messages: messagesToSend,
        tools: tools,
        maxTokens: 150,
      });

      const message = result.choices?.[0]?.message;
      if (!message) break;

      currentHistory.push(message as any);

      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          let toolResult = "";
          try {
            if (toolCall.function.name === "send_sms_link") {
              const args = JSON.parse(toolCall.function.arguments || "{}");
              const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
              await client.messages.create({
                body: args.message,
                from: UTP_PHONE,
                to: from,
              });
              toolResult = "SMS sent successfully.";
            } else if (toolCall.function.name === "check_pricing") {
              // Usually we'd query flightDeals, but for now we hardcode standard prices for the AI
              toolResult = "Standard flight deal subscription is $39. Discounted BYU subscription is $29. Link for BYU is coachmindandbody.com/byu, Link for standard is coachmindandbody.com/subscribe.";
            } else {
              toolResult = "Unknown tool.";
            }
          } catch (e: any) {
            toolResult = `Error executing tool: ${e.message}`;
          }
          currentHistory.push({ role: "tool", content: toolResult, name: toolCall.function.name, tool_call_id: toolCall.id });
        }
      } else {
        const raw = message.content;
        aiReply = typeof raw === "string" ? raw.trim() : "Let me connect you with Carter.";
        done = true;
      }
    }

    // Check for handoff
    if (shouldHandoff(aiReply)) {
      const callerName = extractCallerName(history);
      callSessions.delete(callSid);

      // Send all agents a text with the call summary so far
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
        const summary = history
          .filter(m => m.role === "user")
          .map(m => m.content as string)
          .join(". ");
          
        await Promise.all(AGENT_PHONES.map(phone => 
          client.messages.create({
            body: `📞 Incoming call handoff! Caller${callerName ? ` (${callerName})` : ""} from ${from} needs an agent. They said: "${summary.slice(0, 200)}"`,
            from: UTP_PHONE,
            to: phone,
          })
        ));
      } catch (e) {
        console.error("[Voice] Failed to send handoff text:", e);
      }

      return buildHandoffTwiml(extractCallerName(history));
    }

    // Continue conversation
    // Make sure we only store serializable history
    callSessions.set(callSid, currentHistory);

    return buildGatherTwiml(aiReply, callSid);
  } catch (err) {
    console.error("[Voice] Gemini error:", err);
    const fallback = new VoiceResponse();
    fallback.say({ voice: "Polly.Joanna-Neural" }, "I'm having a little trouble right now. Let me get Carter for you.");
    fallback.dial({ callerId: UTP_PHONE }, CARTER_PHONE);
    return fallback.toString();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 3: Carter didn't answer — AI takes a message
// ─────────────────────────────────────────────────────────────────────────────
export async function handleVoiceNoAnswer(formData: Record<string, string>) {

  const callSid   = formData.CallSid as string;
  const from      = formData.From as string;
  const dialStatus = formData.DialCallStatus as string; // "no-answer" | "busy" | "completed"

  if (dialStatus === "completed") {
    // Carter answered — clean up and done
    callSessions.delete(callSid);
    const twiml = new VoiceResponse();
    return twiml.toString();
    return;
  }

  // Carter missed it — AI takes a message
  const twiml = new VoiceResponse();
  twiml.say({ voice: "Polly.Joanna-Neural" },
    "It looks like all of our agents are with other clients right now. No worries! Please leave your name, phone number, and what you'd like help with — someone will text you back very shortly."
  );
  twiml.record({
    action: `${APP_URL}/api/crm/voice/voicemail`,
    method: "POST",
    maxLength: 120,
    playBeep: true,
    finishOnKey: "#",
  });
  return twiml.toString();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 4: Voicemail recorded — transcribe and notify Carter
// ─────────────────────────────────────────────────────────────────────────────
export async function handleVoiceVoicemail(formData: Record<string, string>) {

  const callSid      = formData.CallSid as string;
  const from         = formData.From as string;
  const recordingUrl = formData.RecordingUrl as string;
  const transcript   = (formData.TranscriptionText as string) || "";

  console.log(`[Voice] Voicemail from ${from}: ${transcript}`);

  // Notify Carter via SMS
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const msg = transcript
      ? `📬 New voicemail from ${from}: "${transcript.slice(0, 250)}"`
      : `📬 New voicemail from ${from}. Recording: ${recordingUrl}`;

    await Promise.all(AGENT_PHONES.map(phone => 
      client.messages.create({ body: msg, from: UTP_PHONE, to: phone })
    ));
  } catch (e) {
    console.error("[Voice] Failed to send voicemail notification:", e);
  }

  // Save to DB
  try {
    const db = await getDb();
    if (db) {
      await db.update(callLogs)
        .set({ recordingUrl, transcript })
        .where(eq(callLogs.twilioCallSid, callSid));
    }
  } catch (e) {
    console.error("[Voice] Failed to save voicemail:", e);
  }

  const twiml = new VoiceResponse();
  twiml.say({ voice: "Polly.Joanna-Neural" }, "Thanks so much! Carter will be in touch very soon. Have a great day!");
  twiml.hangup();
  return twiml.toString();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 5: Call status callback — runs after call ends (summary generation)
// ─────────────────────────────────────────────────────────────────────────────
export async function handleVoiceStatus(formData: Record<string, string>) {

  const twilioCallSid  = formData.CallSid as string;
  const targetCallSid = formData.parentCallSid || twilioCallSid;
  const durationStr = formData.CallDuration;
  const recordingUrl = formData.RecordingUrl as string | undefined;

  // 1. Respond immediately so Twilio doesn't timeout if transcription takes time
  /* sendStatus handled by route */

  // 2. Handle standard Call Status Callback (fires when call ends)
  if (durationStr) {
    const duration = parseInt(durationStr);
    console.log(`[Voice] Call ${targetCallSid} ended. Duration: ${duration}s`);

    // Get inbound AI history if this was an AI agent call
    const history = callSessions.get(targetCallSid);
    let transcript = "";
    let aiSummary = "";
    if (history && history.length > 0) {
      transcript = history
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Caller' : 'Agent'}: ${m.content}`)
        .join("\n");
      try {
        aiSummary = await summarizeCallTranscript(transcript);
      } catch (e) {
        console.error("Summary error", e);
      }
    }

    try {
      const db = await getDb();
      if (db) {
        const updateData: any = { durationSeconds: duration };
        if (transcript) updateData.transcript = transcript;
        if (aiSummary) updateData.aiSummary = aiSummary;
        await db.update(callLogs).set(updateData).where(eq(callLogs.twilioCallSid, targetCallSid));
      }
    } catch (e) {
      console.error("[Voice] Failed to update call log duration:", e);
    }

    callSessions.delete(targetCallSid);
  }

  // 3. Handle Recording Status Callback (fires when Twilio MP3 is ready)
  if (recordingUrl) {
    const recordingDuration = parseInt(formData.RecordingDuration || "0");
    console.log(`[Voice] Recording available for ${targetCallSid}: ${recordingUrl} (${recordingDuration}s)`);
    try {
      const db = await getDb();
      if (!db) return;
      
      const updateData: any = { recordingUrl };
      if (recordingDuration > 0) {
        updateData.durationSeconds = recordingDuration;
      }
      await db.update(callLogs).set(updateData).where(eq(callLogs.twilioCallSid, targetCallSid));

      const log = await db.query.callLogs.findFirst({ where: eq(callLogs.twilioCallSid, targetCallSid) });
      
      // If there is no transcript yet (meaning it was an outbound human call), transcribe it!
      if (log && !log.transcript) {
        console.log(`[Voice] Transcribing outbound call ${targetCallSid}...`);
        const { transcribeAudio } = await import("../_core/voiceTranscription");
        const { summarizeCallTranscript } = await import("../crm/ai");
        
        // Append .mp3 to Twilio recording URL to explicitly request the audio file format
        const audioUrl = recordingUrl.endsWith(".mp3") ? recordingUrl : `${recordingUrl}.mp3`;
        const result = await transcribeAudio({ audioUrl });
        if ("error" in result) {
          console.error(
            `[Voice] Transcription failed for ${targetCallSid}:`,
            result.error,
            result.details || ""
          );
        } else if (result.text) {
          const transcript = result.text;
          const aiSummary = await summarizeCallTranscript(transcript) || "";
          
          await db.update(callLogs).set({ 
            transcript,
            aiSummary 
          }).where(eq(callLogs.twilioCallSid, targetCallSid));
          console.log(`[Voice] Transcription and summary saved for outbound call ${targetCallSid}.`);
        } else {
          console.warn(`[Voice] Empty transcription for outbound call ${targetCallSid}.`);
        }
      }
    } catch (e) {
      console.error("[Voice] Failed to process recording:", e);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 6: PCI Compliance — Pause/Resume call recording
// Called by the browser when admin clicks ⋯Pause Recording⋯ to take card info.
// ─────────────────────────────────────────────────────────────────────────────
export async function handleVoiceRecordingPause(formData: any) {

  const { callSid, pause } = formData as { callSid: string; pause: boolean };
  if (!callSid) return { error: "callSid required" };

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return { error: "Not configured" };

  try {
    const client = twilio(accountSid, authToken);
    // Fetch active recordings for this call and toggle pause
    const recordings = await client.calls(callSid).recordings.list({ limit: 5 });
    if (recordings.length > 0) {
      const rec = recordings[0];
      await client.calls(callSid).recordings(rec.sid).update({
        status: pause ? "paused" : "in-progress",
      } as any);
      console.log(`[Voice] Recording ${rec.sid} ${pause ? "paused" : "resumed"} for call ${callSid}`);
    }
    return { success: true, paused: pause };
  } catch (err: any) {
    console.error("[Voice] Failed to toggle recording:", err.message);
    return { error: err.message };
  }
}

export function handleVoiceTwiml(formData: Record<string, string>) {
  const To = formData.To;
  const From = formData.From;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  const twiml = new twilio.twiml.VoiceResponse();

  if (To === twilioNumber) {
    const dial = twiml.dial();
    dial.client("crm-agent");
  } 
  else if (To) {
    const dial = twiml.dial({ callerId: twilioNumber });
    if (/^[\d\+\-\(\)\ ]+$/.test(To)) {
      dial.number(To);
    } else {
      dial.client(To);
    }
  } else {
    twiml.say("Welcome to Mind and Body. We could not find the number to dial.");
  }

  return twiml.toString();
}
