"use client";

import React, { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import ActiveChatThread from "../../../components/ActiveChatThread";
import CustomerProfilePane from "../../../components/CustomerProfilePane";
import { useInbox } from "../../../InboxContext";

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { setIsNewChatOpen } = useInbox();
  const isNew = resolvedParams.chatId === "new";
  const chatId = isNew ? NaN : parseInt(resolvedParams.chatId, 10);

  useEffect(() => {
    if (isNew) {
      setIsNewChatOpen(true);
      router.replace("/admin/v2-inbox");
    }
  }, [isNew, router, setIsNewChatOpen]);

  if (isNew) return null;

  if (isNaN(chatId)) {
    return <div>Invalid Chat ID</div>;
  }

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">
      <ActiveChatThread chatId={chatId} />
      <CustomerProfilePane chatId={chatId} />
    </div>
  );
}
