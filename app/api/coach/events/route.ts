import { NextRequest } from "next/server";
import { sdk } from "@/server/_core/sdk";
import { getDb } from "@/server/db";
import { conversations } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { subscribeCoachEvents } from "@/server/coachEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await sdk.authenticateNextRequest(req);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const conversationId = Number(req.nextUrl.searchParams.get("conversationId"));
  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return new Response("Bad conversation", { status: 400 });
  }

  const db = await getDb();
  if (!db) return new Response("Unavailable", { status: 503 });
  const [convo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!convo) return new Response("Not found", { status: 404 });

  const isAdmin = user.role === "admin";
  const isOwner = convo.userId === user.id && convo.platform === "webchat";
  if (!isAdmin && !isOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const write = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      write(`data: ${JSON.stringify({ type: "hello", conversationId })}\n\n`);
      cleanup = subscribeCoachEvents(conversationId, write);
      ping = setInterval(() => {
        try {
          write(`: ping\n\n`);
        } catch {
          /* closed */
        }
      }, 20000);
    },
    cancel() {
      if (ping) clearInterval(ping);
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
