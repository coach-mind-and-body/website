import { z } from "zod";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { conversations, messages } from "../../drizzle/schema";
import { notifyAdmins } from "./push";

const COACH_NAME = "Lee Anne";

async function getOrCreateThread(userId: number, email: string | null, name: string | null) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const [existing] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.platform, "webchat")))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(1);

  if (existing) return existing;

  const [inserted] = await db
    .insert(conversations)
    .values({
      userId,
      contactEmail: email,
      platform: "webchat",
      status: "open",
      botActive: false,
      unreadCount: 0,
    })
    .$returningId();

  const [row] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, inserted.id))
    .limit(1);
  if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not open coach thread" });

  await db.insert(messages).values({
    conversationId: row.id,
    direction: "system",
    senderName: COACH_NAME,
    content:
      `Hi${name ? ` ${name.split(" ")[0]}` : ""} — this is your private thread with ${COACH_NAME}. Ask about your week, a recipe, or what's feeling loud. She'll see it in her inbox.`,
    status: "received",
    isAutomated: true,
  });

  return row;
}

export const coachRouter = router({
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const [thread] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userId, ctx.user.id), eq(conversations.platform, "webchat")))
      .limit(1);
    if (!thread) return { count: 0 };

    const since = thread.clientLastReadAt;
    const unreadWhere = since
      ? and(
          eq(messages.conversationId, thread.id),
          eq(messages.direction, "outbound"),
          eq(messages.isInternal, false),
          gt(messages.createdAt, since)
        )
      : and(
          eq(messages.conversationId, thread.id),
          eq(messages.direction, "outbound"),
          eq(messages.isInternal, false)
        );
    const unread = await db.select({ id: messages.id }).from(messages).where(unreadWhere);
    return { count: unread.length };
  }),

  getThread: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const thread = await getOrCreateThread(ctx.user.id, ctx.user.email ?? null, ctx.user.name ?? null);
    const history = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, thread.id),
          or(eq(messages.isInternal, false), isNull(messages.isInternal))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(80);

    return {
      conversationId: thread.id,
      coachName: COACH_NAME,
      messages: history.reverse().map((m) => ({
        id: m.id,
        direction: m.direction,
        senderName: m.senderName,
        content: m.content,
        mediaUrl: m.mediaUrl,
        createdAt: m.createdAt,
        isAutomated: m.isAutomated,
      })),
    };
  }),

  send: protectedProcedure
    .input(
      z.object({
        content: z.string().max(4000).optional(),
        mediaUrl: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const thread = await getOrCreateThread(ctx.user.id, ctx.user.email ?? null, ctx.user.name ?? null);
      const text = (input.content ?? "").trim();
      if (!text && !input.mediaUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Message is empty" });
      }

      await db.insert(messages).values({
        conversationId: thread.id,
        direction: "inbound",
        senderName: ctx.user.name || ctx.user.email || "Client",
        content: text || null,
        mediaUrl: input.mediaUrl ?? null,
        status: "received",
        isAutomated: false,
      });

      await db
        .update(conversations)
        .set({
          lastMessageAt: new Date(),
          unreadCount: (thread.unreadCount || 0) + 1,
          status: "open",
        })
        .where(eq(conversations.id, thread.id));

      notifyAdmins({
        title: "New coach message",
        body: `${ctx.user.name || "A client"}: ${(text || "Sent a file").slice(0, 80)}`,
        url: "/admin",
      }).catch((e) => console.error("[Coach] notifyAdmins failed", e));

      return { success: true };
    }),

  markRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { success: true };
    await db
      .update(conversations)
      .set({ clientLastReadAt: new Date() })
      .where(and(eq(conversations.userId, ctx.user.id), eq(conversations.platform, "webchat")));
    return { success: true };
  }),
});
