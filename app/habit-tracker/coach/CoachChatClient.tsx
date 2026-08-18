"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Bell, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useWebPush } from "@/hooks/useWebPush";
import { BRAND } from "@shared/brand";
import { ChatShareToolbar, parseRecipeSlug } from "@/components/habit/ChatShareToolbar";
import { TypingDots } from "@/components/chat/TypingDots";
import { QuotedReply, DateChip } from "@/components/chat/QuotedReply";
import { dayKey, dayLabel, messageTime } from "@/lib/chatTime";

const FOREST = "#2d3b2d";
const GOLD = "#c9a96e";
const BORDER = "#f0e8e4";
const CREAM = "#faf5f5";

type ReplyTo = { id: number; content?: string | null; senderName?: string | null };

export default function CoachChatClient() {
  usePageTitle({
    title: "Coach | Mind & Body Reset",
    description: "Private thread with Lee Anne.",
  });

  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { isSupported, isSubscribed, isSubscribing, subscribeToPush } = useWebPush();
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);
  const [coachTyping, setCoachTyping] = useState(false);
  const [optimistic, setOptimistic] = useState<
    { id: number; content?: string; mediaUrl?: string; createdAt: Date; replyTo?: ReplyTo | null }[]
  >([]);
  const listRef = useRef<HTMLDivElement>(null);
  const didInitScroll = useRef(false);
  const typingReset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  const { data, isLoading, refetch } = trpc.coach.getThread.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: () =>
      typeof document !== "undefined" && document.hidden ? false : 30_000,
    refetchOnWindowFocus: true,
  });

  const markRead = trpc.coach.markRead.useMutation({
    onSuccess: () => void utils.coach.unreadCount.invalidate(),
  });

  const pingTyping = trpc.coach.typing.useMutation();
  const { data: typingState } = trpc.coach.typingState.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 1000,
  });

  const send = trpc.coach.send.useMutation();

  const fireSend = (payload: { content?: string; mediaUrl?: string; replyToId?: number }) => {
    const content = payload.content?.trim();
    if (!content && !payload.mediaUrl) return;
    const id = -Date.now();
    const reply = payload.replyToId
      ? (replyingTo && replyingTo.id === payload.replyToId ? replyingTo : null)
      : replyingTo;
    setOptimistic((prev) => [
      ...prev,
      { id, content, mediaUrl: payload.mediaUrl, createdAt: new Date(), replyTo: reply },
    ]);
    if (payload.content !== undefined) setDraft("");
    setReplyingTo(null);
    send.mutate(
      { content, mediaUrl: payload.mediaUrl, replyToId: reply?.id },
      {
        onSuccess: () => {
          void refetch().then(() => setOptimistic((prev) => prev.filter((o) => o.id !== id)));
          void utils.coach.unreadCount.invalidate();
        },
        onError: (e) => {
          setOptimistic((prev) => prev.filter((o) => o.id !== id));
          if (content) setDraft(content);
          toast.error(e.message);
        },
      }
    );
  };

  const share = (payload: { content?: string; mediaUrl?: string }) => {
    fireSend(payload);
  };

  useEffect(() => {
    if (isAuthenticated && data?.conversationId) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark on each new thread load
  }, [isAuthenticated, data?.conversationId, data?.messages.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !data?.messages.length) return;
    if (!didInitScroll.current) {
      didInitScroll.current = true;
      el.scrollTop = 0;
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [data?.messages.length, optimistic.length, coachTyping]);

  useEffect(() => {
    if (!isAuthenticated || !data?.conversationId) return;
    const es = new EventSource(`/api/coach/events?conversationId=${data.conversationId}`);
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data) as { type?: string; who?: string };
        if (payload.type === "message") {
          setCoachTyping(false);
          void refetch().then(() => {
            if (payload.who === "client") setOptimistic([]);
          });
          void utils.coach.unreadCount.invalidate();
          if (payload.who === "coach") markRead.mutate();
        }
        if (payload.type === "typing" && payload.who === "coach") {
          setCoachTyping(true);
          if (typingReset.current) clearTimeout(typingReset.current);
          typingReset.current = setTimeout(() => setCoachTyping(false), 2500);
        }
      } catch {
        /* ignore */
      }
    };
    return () => {
      es.close();
      if (typingReset.current) clearTimeout(typingReset.current);
    };
    // markRead / utils are stable enough; reconnect only when the thread id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, data?.conversationId]);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    fireSend({ content: text });
  };

  useEffect(() => {
    if (typingState?.coachTyping) setCoachTyping(true);
  }, [typingState?.coachTyping]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [isAuthenticated, user?.role, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex justify-center pt-24" style={{ background: CREAM }}>
        <Loader2 className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen px-4 pt-8" style={{ background: CREAM }}>
        <div className="max-w-lg mx-auto bg-white rounded-3xl border p-8 text-center" style={{ borderColor: BORDER }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-2">
            Private thread
          </p>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
          >
            Message {BRAND.coachName}
          </h1>
          <p className="text-sm text-[#6b7a6b] mb-5">
            Sign in so this stays a real conversation — not a form that disappears.
          </p>
          <Link
            href="/login?returnTo=/habit-tracker/coach"
            className="inline-block rounded-full px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: FOREST }}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const messages = data?.messages ?? [];

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <div className="max-w-lg mx-auto px-4 pt-5 pb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">
          Private · not a group chat
        </p>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
        >
          {data?.coachName ?? BRAND.coachName}
        </h1>
        <p className="text-sm text-[#6b7a6b] mb-3">
          She sees this in her inbox. Replies show up here.
        </p>

        {isSupported && !isSubscribed && (
          <button
            type="button"
            onClick={() => void subscribeToPush()}
            disabled={isSubscribing}
            className="mb-4 w-full flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-bold"
            style={{ borderColor: BORDER, background: "white", color: FOREST }}
          >
            <Bell size={14} style={{ color: GOLD }} />
            {isSubscribing ? "Enabling…" : "Notify me when Lee Anne replies"}
          </button>
        )}

        <div
          className="bg-white rounded-3xl border overflow-hidden flex flex-col"
          style={{ borderColor: BORDER, minHeight: "22rem" }}
        >
          <div ref={listRef} className="flex-1 px-4 py-4 space-y-3 max-h-[55vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin" style={{ color: GOLD }} />
              </div>
            ) : (
              <>
              {messages.map((m, index) => {
                const mine = m.direction === "inbound";
                const recipeSlug = parseRecipeSlug(m.content);
                const isImage = Boolean(m.mediaUrl && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(m.mediaUrl));
                const prev = messages[index - 1];
                const showDay = dayKey(m.createdAt) !== dayKey(prev?.createdAt);
                return (
                  <div key={m.id}>
                    {showDay && <DateChip label={dayLabel(m.createdAt)} />}
                    <div className={`flex ${mine ? "justify-end" : "justify-start"} group`}>
                      <button
                        type="button"
                        className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-left"
                        style={{
                          background: mine ? FOREST : "#faf5f5",
                          color: mine ? "white" : FOREST,
                          border: mine ? "none" : `1px solid ${BORDER}`,
                        }}
                        onClick={() =>
                          setReplyingTo({
                            id: m.id,
                            content: m.content,
                            senderName: mine ? user?.name : m.senderName || BRAND.coachName,
                          })
                        }
                      >
                        {m.replyTo && (
                          <QuotedReply
                            name={m.replyTo.senderName}
                            text={m.replyTo.content}
                            mine={mine}
                          />
                        )}
                        {!mine && (
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: GOLD }}>
                            {m.senderName || BRAND.coachName}
                          </p>
                        )}
                        {m.mediaUrl && isImage && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.mediaUrl} alt="" className="rounded-xl mb-2 max-h-48 object-cover w-full" />
                        )}
                        {m.mediaUrl && !isImage && (
                          <a
                            href={m.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs font-bold underline mb-2"
                            style={{ color: mine ? "white" : GOLD }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open file
                          </a>
                        )}
                        {recipeSlug && (
                          <Link
                            href={`/habit-tracker/recipes/${recipeSlug}`}
                            className="block text-xs font-bold rounded-xl px-3 py-2 mb-2"
                            style={{
                              background: mine ? "rgba(255,255,255,0.12)" : "white",
                              color: mine ? "white" : FOREST,
                              border: `1px solid ${mine ? "rgba(255,255,255,0.2)" : BORDER}`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open recipe →
                          </Link>
                        )}
                        {m.content && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        )}
                        <p className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-gray-400"}`}>
                          {messageTime(m.createdAt)}
                        </p>
                      </button>
                    </div>
                  </div>
                );
              })}
              {optimistic.map((m) => (
                <div key={m.id} className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 opacity-80"
                    style={{ background: FOREST, color: "white" }}
                  >
                    {m.replyTo && <QuotedReply name={m.replyTo.senderName} text={m.replyTo.content} mine />}
                    {m.mediaUrl && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(m.mediaUrl) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.mediaUrl} alt="" className="rounded-xl mb-2 max-h-48 object-cover w-full" />
                    )}
                    {m.content && (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    )}
                    <p className="text-[10px] mt-1 text-white/60">Sending…</p>
                  </div>
                </div>
              ))}
              {coachTyping && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-3.5 py-2.5 text-[#8a9a8a]"
                    style={{ background: "#faf5f5", border: `1px solid ${BORDER}` }}
                  >
                    <TypingDots />
                    <span className="sr-only">{BRAND.coachName} is typing</span>
                  </div>
                </div>
              )}
              </>
            )}
          </div>

          <div className="border-t p-3 space-y-2" style={{ borderColor: BORDER }}>
            {replyingTo && (
              <div
                className="flex items-start justify-between gap-2 rounded-xl px-3 py-2"
                style={{ background: CREAM, border: `1px solid ${BORDER}` }}
              >
                <QuotedReply name={replyingTo.senderName} text={replyingTo.content} />
                <button
                  type="button"
                  className="text-xs font-bold text-[#8a9a8a]"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </button>
              </div>
            )}
            <ChatShareToolbar onShare={share} />
            <div className="flex gap-2 items-end">
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                const now = Date.now();
                if (now - lastTypingSent.current > 1500) {
                  lastTypingSent.current = now;
                  pingTyping.mutate();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              rows={2}
              placeholder="Write to Lee Anne…"
              className="flex-1 resize-none rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-1"
              style={{ borderColor: BORDER, color: FOREST }}
            />
            <button
              type="button"
              onClick={onSend}
              disabled={!draft.trim()}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-40"
              style={{ background: FOREST }}
              aria-label="Send"
            >
              {send.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
