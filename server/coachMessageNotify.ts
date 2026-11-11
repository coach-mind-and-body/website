import { and, eq, isNull, lte } from "drizzle-orm";
import { SITE_URL } from "@shared/brand";
import { coachReplyEmailNotices, conversations, messages, users } from "../drizzle/schema";
import { apnsConfigFromEnv, sendApnsAlerts, type ApnsConfig, type ApnsData, type ApnsSendResult } from "./apns";
import { NOTIFICATION_CATEGORY } from "./notificationCategories";
import { deleteDeviceTokens, tokensForAdmins, tokensForUser } from "./apnsDevices";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { sendOwnerEmail, sendTransactionalEmail } from "./notifications";

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
  conversationId?: number;
};

export type ThreadEmailBatch = {
  conversationId: number;
  noticeIds: number[];
  preview: string;
  clientName: string;
  count: number;
};

type SendFn = (input: {
  config: ApnsConfig | null;
  tokens: string[];
  alert: { title: string; body: string };
  data: ApnsData;
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

const ADMIN_MESSAGES_URL = `${SITE_URL}/admin?tab=overview#admin-messages`;

/** One branded note for a thread. Several unread bubbles in that thread share this email. */
export function buildCoachUnreadAlertEmail(input: { clientName: string; preview: string; count: number }) {
  const name = input.clientName.replace(/\s+/g, " ").trim() || "A client";
  const plain = input.preview.replace(/\s+/g, " ").trim().slice(0, 500) || "Sent a message.";
  const count = Math.max(1, input.count);
  const subject = count > 1 ? `${count} unread messages from ${name}` : `New message from ${name}`;
  const lead =
    count > 1
      ? `${escapeHtml(name)} sent ${count} messages that are still unread.`
      : `${escapeHtml(name)} sent a message that is still unread.`;
  const htmlBody = `
    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#c9a96e;padding:28px 36px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Mind and Body Reset Coaching</h1>
      </div>
      <div style="padding:32px 36px;color:#4a4a4a;font-size:16px;line-height:1.6;">
        <p style="margin:0 0 16px;">Hi Lee Anne,</p>
        <p style="margin:0 0 16px;">${lead}</p>
        <div style="background:#f9f5f0;border-left:4px solid #c9a96e;padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#5a3e28;white-space:pre-wrap;">${escapeHtml(plain)}</p>
        </div>
        <a href="${ADMIN_MESSAGES_URL}" style="display:inline-block;background:#c9a96e;color:#ffffff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:700;">Open messages</a>
      </div>
      <div style="background:#f9f5f0;padding:16px 36px;text-align:center;border-top:1px solid #e8e0d8;">
        <p style="margin:0;color:#8a9a8a;font-size:12px;">Mind and Body Reset Coaching</p>
      </div>
    </div>
  `;
  const textBody = `Hi Lee Anne,\n\n${count > 1 ? `${name} sent ${count} messages that are still unread.` : `${name} sent a message that is still unread.`}\n\n${plain}\n\nOpen messages: ${ADMIN_MESSAGES_URL}`;
  return { subject, htmlBody, textBody };
}

/**
 * Collapse due client messages into one email per thread.
 * Messages she already opened are skipped. Messages that are not due yet wait.
 */
export function planUnreadThreadEmails(
  rows: UnreadNotice[],
  now: Date
): { batches: ThreadEmailBatch[]; skipIds: number[]; waitIds: number[] } {
  const skipIds: number[] = [];
  const waitIds: number[] = [];
  const sendRows: UnreadNotice[] = [];
  for (const row of rows) {
    const decision = decideUnreadCoachEmail(row, now);
    if (decision === "wait") {
      waitIds.push(row.id);
      continue;
    }
    if (decision === "already-sent") continue;
    if (decision !== "send") {
      skipIds.push(row.id);
      continue;
    }
    sendRows.push(row);
  }

  const byThread = new Map<number, UnreadNotice[]>();
  for (const row of sendRows) {
    const conversationId = row.conversationId ?? row.id;
    const list = byThread.get(conversationId) ?? [];
    list.push(row);
    byThread.set(conversationId, list);
  }

  const batches: ThreadEmailBatch[] = [...byThread.entries()].map(([conversationId, list]) => {
    const newest = [...list].sort(
      (a, b) => new Date(b.messageCreatedAt).getTime() - new Date(a.messageCreatedAt).getTime()
    )[0];
    return {
      conversationId,
      noticeIds: list.map((row) => row.id),
      preview: newest.preview,
      clientName: newest.name?.trim() || "A client",
      count: list.length,
    };
  });

  return { batches, skipIds, waitIds };
}

export async function processUnreadThreadEmails(args: {
  rows: UnreadNotice[];
  now: Date;
  claim: (id: number) => Promise<boolean>;
  release: (id: number) => Promise<void>;
  sendEmail: (batch: ThreadEmailBatch) => Promise<boolean>;
}): Promise<{ sent: number; skipped: number }> {
  const plan = planUnreadThreadEmails(args.rows, args.now);
  let skipped = 0;
  for (const id of plan.skipIds) {
    const claimed = await args.claim(id);
    if (claimed) skipped += 1;
  }

  let sent = 0;
  for (const batch of plan.batches) {
    const lockId = Math.min(...batch.noticeIds);
    const locked = await args.claim(lockId);
    if (!locked) {
      skipped += 1;
      continue;
    }
    const claimed = [lockId];
    for (const id of batch.noticeIds) {
      if (id === lockId) continue;
      if (await args.claim(id)) claimed.push(id);
    }
    const ok = await args.sendEmail({ ...batch, noticeIds: claimed, count: claimed.length });
    if (!ok) {
      for (const id of claimed) await args.release(id);
      continue;
    }
    sent += 1;
  }
  return { sent, skipped };
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
      kind: "client",
      dueAt: new Date(now.getTime() + COACH_REPLY_EMAIL_DELAY_MS),
    })
    .onDuplicateKeyUpdate({ set: { messageId: input.messageId } });
}

export async function queueCoachUnreadEmail(input: {
  messageId: number;
  conversationId: number;
  userId: number;
  preview: string;
  now?: Date;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Coach email] database unavailable — unread client email was not queued");
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
      kind: "coach",
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
    .where(
      and(
        eq(coachReplyEmailNotices.kind, "client"),
        isNull(coachReplyEmailNotices.sentAt),
        lte(coachReplyEmailNotices.dueAt, now)
      )
    )
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

export async function deliverDueCoachUnreadEmails(now = new Date()): Promise<{ sent: number; skipped: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, skipped: 0 };
  const due = await db
    .select({
      id: coachReplyEmailNotices.id,
      conversationId: coachReplyEmailNotices.conversationId,
      name: users.name,
      senderName: messages.senderName,
      preview: coachReplyEmailNotices.preview,
      messageCreatedAt: messages.createdAt,
      coachLastReadAt: conversations.coachLastReadAt,
      dueAt: coachReplyEmailNotices.dueAt,
      sentAt: coachReplyEmailNotices.sentAt,
    })
    .from(coachReplyEmailNotices)
    .innerJoin(messages, eq(messages.id, coachReplyEmailNotices.messageId))
    .innerJoin(conversations, eq(conversations.id, coachReplyEmailNotices.conversationId))
    .leftJoin(users, eq(users.id, coachReplyEmailNotices.userId))
    .where(
      and(
        eq(coachReplyEmailNotices.kind, "coach"),
        isNull(coachReplyEmailNotices.sentAt),
        lte(coachReplyEmailNotices.dueAt, now)
      )
    )
    .limit(40);

  const result = await processUnreadThreadEmails({
    now,
    rows: due.map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      email: ENV.ownerEmail,
      name: row.name || row.senderName,
      preview: row.preview,
      messageCreatedAt: asDate(row.messageCreatedAt) ?? now,
      clientLastReadAt: asDate(row.coachLastReadAt),
      dueAt: asDate(row.dueAt) ?? now,
      sentAt: asDate(row.sentAt),
    })),
    claim: claimNotice,
    release: releaseNotice,
    sendEmail: async (batch) => {
      const content = buildCoachUnreadAlertEmail(batch);
      return sendOwnerEmail({
        subject: content.subject,
        htmlBody: content.htmlBody,
        textBody: content.textBody,
      });
    },
  });
  if (result.sent > 0) {
    console.log(`[Coach email] sent ${result.sent} unread client notice(s)`);
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
    deliverDueCoachUnreadEmails().catch((err) => {
      console.error("[Coach email] client-unread poll failed:", err instanceof Error ? err.message : "error");
    });
  };
  tick();
  setInterval(tick, 60_000);
}

export function coachMessagePushData(input: {
  conversationId: number;
  messageId?: number;
}): ApnsData {
  return {
    tab: "coach",
    url: "/habit-tracker/coach",
    category: NOTIFICATION_CATEGORY.coachMessage,
    conversationId: input.conversationId,
    threadId: input.conversationId,
    ...(input.messageId != null ? { messageId: input.messageId } : {}),
    mutableContent: true,
  };
}

export function clientMessagePushData(input: {
  conversationId: number;
  messageId?: number;
}): ApnsData {
  return {
    tab: "coach",
    url: "/admin",
    category: NOTIFICATION_CATEGORY.coachClientMessage,
    conversationId: input.conversationId,
    threadId: input.conversationId,
    ...(input.messageId != null ? { messageId: input.messageId } : {}),
    mutableContent: true,
  };
}

async function pushAndForget(
  send: SendFn,
  config: ApnsConfig | null,
  tokens: string[],
  alert: { title: string; body: string },
  data: ApnsData,
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
      coachMessagePushData(input),
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
  input: { conversationId: number; preview: string; clientName: string; messageId?: number; userId?: number },
  io?: {
    tokens?: () => Promise<string[]>;
    send?: SendFn;
    forgetTokens?: (tokens: string[]) => Promise<void>;
    queueEmail?: typeof queueCoachUnreadEmail;
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
      clientMessagePushData(input),
      io?.forgetTokens ?? deleteDeviceTokens
    );
  } catch (err) {
    console.error("[APNs] coach notify failed:", err instanceof Error ? err.message : "error");
  }
  if (!input.messageId) return;
  try {
    await (io?.queueEmail ?? queueCoachUnreadEmail)({
      messageId: input.messageId,
      conversationId: input.conversationId,
      userId: input.userId ?? 0,
      preview: input.preview,
    });
  } catch (err) {
    console.error("[Coach email] queue failed:", err instanceof Error ? err.message : "error");
  }
}
