import { and, eq, isNull, lte } from "drizzle-orm";
import { SITE_URL } from "@shared/brand";
import { coachReplyEmailNotices, conversations, messages, users } from "../drizzle/schema";
import { apnsConfigFromEnv, sendApnsAlerts, type ApnsConfig, type ApnsSendResult } from "./apns";
import { deleteDeviceTokens, tokensForAdmins, tokensForUser } from "./apnsDevices";
import { getDb } from "./db";
import { sendTransactionalEmail } from "./notifications";

export const COACH_REPLY_EMAIL_DELAY_MS = 10 * 60 * 1000;

export type UnreadNotice = {
  id: number;
  email: string | null;
  name: string | null;
  preview: string;
  messageCreatedAt: Date;
  clientLastReadAt: Date | null;
  dueAt: Date;
  sentAt: Date | null;
};

type SendFn = (input: {
  config: ApnsConfig | null;
  tokens: string[];
  alert: { title: string; body: string };
  data: { tab: string; url: string; conversationId: number };
}) => Promise<ApnsSendResult>;

export function clipPushBody(value: string, max = 140): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "New message";
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function decideUnreadCoachEmail(
  row: UnreadNotice,
  now: Date
): "wait" | "already-sent" | "skip-read" | "skip-no-email" | "send" {
  if (row.sentAt) return "already-sent";
  if (now.getTime() < new Date(row.dueAt).getTime()) return "wait";
  const readAt = row.clientLastReadAt ? new Date(row.clientLastReadAt).getTime() : null;
  const createdAt = new Date(row.messageCreatedAt).getTime();
  if (readAt != null && !Number.isNaN(readAt) && readAt >= createdAt) return "skip-read";
  if (!row.email || !row.email.includes("@")) return "skip-no-email";
  return "send";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCoachReplyFallbackEmail(preview: string) {
  const plain = preview.replace(/\s+/g, " ").trim().slice(0, 500) || "You have a new message.";
  const link = `${SITE_URL}/habit-tracker/coach`;
  return {
    subject: "Lee Anne sent you a message",
    htmlBody: `<p>Lee Anne replied in your Mind and Body Reset conversation.</p><p>${escapeHtml(plain)}</p><p><a href="${link}">Open the conversation</a></p>`,
    textBody: `Lee Anne replied in your Mind and Body Reset conversation.\n\n${plain}\n\nOpen the conversation: ${link}`,
  };
}

export async function processUnreadCoachReplyEmails(args: {
  rows: UnreadNotice[];
  now: Date;
  claim: (id: number) => Promise<boolean>;
  release: (id: number) => Promise<void>;
  sendEmail: (row: UnreadNotice) => Promise<boolean>;
}): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;
  for (const row of args.rows) {
    const decision = decideUnreadCoachEmail(row, args.now);
    if (decision === "wait" || decision === "already-sent") continue;
    const claimed = await args.claim(row.id);
    if (!claimed) {
      skipped += 1;
      continue;
    }
    if (decision !== "send") {
      skipped += 1;
      continue;
    }
    const ok = await args.sendEmail(row);
    if (!ok) {
      await args.release(row.id);
      continue;
    }
    sent += 1;
  }
  return { sent, skipped };
}

function asDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function claimNotice(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .update(coachReplyEmailNotices)
    .set({ sentAt: new Date() })
    .where(and(eq(coachReplyEmailNotices.id, id), isNull(coachReplyEmailNotices.sentAt)));
  const header = (Array.isArray(result) ? result[0] : result) as { affectedRows?: number } | undefined;
  return (header?.affectedRows ?? 0) > 0;
}

async function releaseNotice(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(coachReplyEmailNotices)
    .set({ sentAt: null })
    .where(eq(coachReplyEmailNotices.id, id));
}

export async function queueCoachReplyEmail(input: {
  messageId: number;
  conversationId: number;
  userId: number;
  preview: string;
  now?: Date;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Coach email] database unavailable — unread reply email was not queued");
    return;
  }
  const now = input.now ?? new Date();
  await db
    .insert(coachReplyEmailNotices)
    .values({
      messageId: input.messageId,
      conversationId: input.conversationId,
      userId: input.userId,
      preview: input.preview.replace(/\s+/g, " ").trim().slice(0, 500),
      dueAt: new Date(now.getTime() + COACH_REPLY_EMAIL_DELAY_MS),
    })
    .onDuplicateKeyUpdate({ set: { messageId: input.messageId } });
}

export async function deliverDueCoachReplyEmails(now = new Date()): Promise<{ sent: number; skipped: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, skipped: 0 };
  const due = await db
    .select({
      id: coachReplyEmailNotices.id,
      email: users.email,
      name: users.name,
      preview: coachReplyEmailNotices.preview,
      messageCreatedAt: messages.createdAt,
      clientLastReadAt: conversations.clientLastReadAt,
      dueAt: coachReplyEmailNotices.dueAt,
      sentAt: coachReplyEmailNotices.sentAt,
    })
    .from(coachReplyEmailNotices)
    .innerJoin(messages, eq(messages.id, coachReplyEmailNotices.messageId))
    .innerJoin(conversations, eq(conversations.id, coachReplyEmailNotices.conversationId))
    .innerJoin(users, eq(users.id, coachReplyEmailNotices.userId))
    .where(and(isNull(coachReplyEmailNotices.sentAt), lte(coachReplyEmailNotices.dueAt, now)))
    .limit(40);

  const result = await processUnreadCoachReplyEmails({
    now,
    rows: due.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      preview: row.preview,
      messageCreatedAt: asDate(row.messageCreatedAt) ?? now,
      clientLastReadAt: asDate(row.clientLastReadAt),
      dueAt: asDate(row.dueAt) ?? now,
      sentAt: asDate(row.sentAt),
    })),
    claim: claimNotice,
    release: releaseNotice,
    sendEmail: async (row) => {
      if (!row.email) return false;
      const content = buildCoachReplyFallbackEmail(row.preview);
      return sendTransactionalEmail({
        to: row.email,
        toName: row.name || "there",
        subject: content.subject,
        htmlBody: content.htmlBody,
        textBody: content.textBody,
      });
    },
  });
  if (result.sent > 0) {
    console.log(`[Coach email] sent ${result.sent} unread reply notice(s)`);
  }
  return result;
}

const globalForCoachEmail = globalThis as typeof globalThis & {
  __coachReplyEmailPoller?: boolean;
};

export function startCoachReplyEmailPoller() {
  if (globalForCoachEmail.__coachReplyEmailPoller) return;
  globalForCoachEmail.__coachReplyEmailPoller = true;
  const tick = () => {
    deliverDueCoachReplyEmails().catch((err) => {
      console.error("[Coach email] poll failed:", err instanceof Error ? err.message : "error");
    });
  };
  tick();
  setInterval(tick, 60_000);
}

async function pushAndForget(
  send: SendFn,
  config: ApnsConfig | null,
  tokens: string[],
  alert: { title: string; body: string },
  data: { tab: string; url: string; conversationId: number },
  forget: (tokens: string[]) => Promise<void>
) {
  const result = await send({ config, tokens, alert, data });
  if (result.removed.length) await forget(result.removed);
}

export async function notifyClientOfCoachMessage(
  input: { userId: number; conversationId: number; messageId: number; preview: string },
  io?: {
    tokensForUser?: (userId: number) => Promise<string[]>;
    send?: SendFn;
    forgetTokens?: (tokens: string[]) => Promise<void>;
    queueEmail?: typeof queueCoachReplyEmail;
    config?: ApnsConfig | null;
  }
): Promise<void> {
  const config = io && "config" in io ? (io.config ?? null) : apnsConfigFromEnv();
  try {
    const tokens = await (io?.tokensForUser ?? tokensForUser)(input.userId);
    await pushAndForget(
      io?.send ?? sendApnsAlerts,
      config,
      tokens,
      { title: "Lee Anne sent a message", body: clipPushBody(input.preview) },
      { tab: "coach", url: "/habit-tracker/coach", conversationId: input.conversationId },
      io?.forgetTokens ?? deleteDeviceTokens
    );
  } catch (err) {
    console.error("[APNs] client notify failed:", err instanceof Error ? err.message : "error");
  }
  try {
    await (io?.queueEmail ?? queueCoachReplyEmail)(input);
  } catch (err) {
    console.error("[Coach email] queue failed:", err instanceof Error ? err.message : "error");
  }
}

export async function notifyAdminsOfClientMessage(
  input: { conversationId: number; preview: string; clientName: string },
  io?: {
    tokens?: () => Promise<string[]>;
    send?: SendFn;
    forgetTokens?: (tokens: string[]) => Promise<void>;
    config?: ApnsConfig | null;
  }
): Promise<void> {
  const config = io && "config" in io ? (io.config ?? null) : apnsConfigFromEnv();
  try {
    const tokens = await (io?.tokens ?? tokensForAdmins)();
    const who = input.clientName.replace(/\s+/g, " ").trim() || "A client";
    await pushAndForget(
      io?.send ?? sendApnsAlerts,
      config,
      tokens,
      { title: "New client message", body: clipPushBody(`${who}: ${input.preview}`) },
      { tab: "coach", url: "/admin", conversationId: input.conversationId },
      io?.forgetTokens ?? deleteDeviceTokens
    );
  } catch (err) {
    console.error("[APNs] coach notify failed:", err instanceof Error ? err.message : "error");
  }
}
