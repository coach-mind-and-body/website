"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useInbox } from "@/components/admin/messaging/InboxContext";
import { useInboxPollInterval } from "@/lib/useInboxPollInterval";

let sharedAudio: AudioContext | null = null;

/** Short two-note chime. Browsers may stay silent until the admin has clicked the page once. */
export function playInboxNotificationSound() {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = sharedAudio ?? new AudioCtx();
  sharedAudio = ctx;
  void ctx.resume();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
  for (const [offset, freq] of [
    [0, 880],
    [0.16, 1320],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(now + offset);
    osc.stop(now + offset + 0.4);
  }
}

function showClientMessageNotification(conversationId: number, name: string, preview: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const note = new Notification("New client message", {
    body: `${name}: ${preview}`,
    tag: `client-msg-${conversationId}`,
  });
  note.onclick = () => {
    window.focus();
    window.location.assign("/admin?tab=overview");
  };
}

export function useInboxNewMessageAlerts(enabled: boolean) {
  const params = useParams();
  const activeChatId = params?.chatId ? parseInt(params.chatId as string, 10) : null;
  const { activeChatMeta } = useInbox();
  const pollInterval = useInboxPollInterval(5000, 15000);
  const { data: conversations = [] } = trpc.messaging.listConversations.useQuery(undefined, {
    enabled,
    refetchInterval: enabled ? pollInterval : false,
    refetchOnWindowFocus: true,
  });

  const previousCounts = useRef<Record<number, number>>({});
  const isInitialized = useRef(false);
  const [alertsOn, setAlertsOn] = useState(false);

  const unread = conversations.reduce((sum, conversation) => sum + (conversation.unreadCount ?? 0), 0);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setAlertsOn(Notification.permission === "granted");
  }, [conversations, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const base = "Admin Dashboard";
    document.title = unread > 0 ? `(${unread}) ${base}` : base;
  }, [enabled, unread]);

  useEffect(() => {
    if (!enabled) return;
    let shouldAlert = false;
    for (const conversation of conversations) {
      const prev = previousCounts.current[conversation.id];
      const unreadCount = conversation.unreadCount ?? 0;
      const openHere =
        conversation.id === activeChatId || conversation.id === activeChatMeta?.conversationId;
      const increased = prev === undefined ? unreadCount > 0 : unreadCount > prev;
      if (isInitialized.current && increased && !openHere) {
        shouldAlert = true;
        const name =
          conversation.userName || conversation.contactEmail || conversation.contactPhone || "A client";
        const preview = conversation.lastMessagePreview || "New message";
        toast(`New message from ${name}`);
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
          void Notification.requestPermission().then((permission) => {
            setAlertsOn(permission === "granted");
            if (permission === "granted") showClientMessageNotification(conversation.id, name, preview);
          });
        } else {
          showClientMessageNotification(conversation.id, name, preview);
        }
      }
      previousCounts.current[conversation.id] = unreadCount;
    }
    if (shouldAlert) playInboxNotificationSound();
    if (conversations.length > 0) isInitialized.current = true;
  }, [activeChatId, activeChatMeta?.conversationId, conversations, enabled]);

  const enableAlerts = () => {
    if (typeof Notification === "undefined") return;
    void Notification.requestPermission().then((permission) => setAlertsOn(permission === "granted"));
  };

  return { unread, alertsOn, enableAlerts };
}
