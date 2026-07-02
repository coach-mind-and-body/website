// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
const playInboxNotificationSound = () => {};
import { useInboxPollInterval } from "@/lib/useInboxPollInterval";

export function useInboxNewMessageAlerts() {
  const params = useParams();
  const activeChatId = params?.chatId ? parseInt(params.chatId as string, 10) : null;
  const pollInterval = useInboxPollInterval(5000, 15000);
  const { data: conversations = [] } = trpc.messaging.listConversations.useQuery(undefined, {
    refetchInterval: pollInterval,
  });

  const previousCounts = useRef<Record<number, number>>({});
  const isInitialized = useRef(false);

  useEffect(() => {
    let newMessagesCount = 0;

    conversations.forEach(c => {
      const prev = previousCounts.current[c.id];
      if (isInitialized.current && prev !== undefined && c.unreadCount > prev) {
        newMessagesCount++;
        if (c.id !== activeChatId) {
          toast(`New message from ${c.userName || c.contactPhone || "customer"}`);
        }
      }
      previousCounts.current[c.id] = c.unreadCount;
    });

    if (newMessagesCount > 0) {
      playInboxDing();
    }

    if (conversations.length > 0) {
      isInitialized.current = true;
    }
  }, [conversations, activeChatId]);
}