// @ts-nocheck
import { Message } from "../_core/llm";

// ─── In-Memory Call State ─────────────────────────────────────────────────────
// Stores conversation history for ongoing Twilio calls keyed by Twilio CallSid.
// (Resets when server restarts — fine for short calls.)
// We hoist this into a singleton module to ensure it persists across Next.js 
// App Router module hot-reloads and between inbound/respond/status webhooks.
export const callSessions = new Map<string, Message[]>();
