"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { useInbox } from "../InboxContext";

export default function NewMessageFab() {
  const pathname = usePathname();
  const { isNewChatOpen, setIsNewChatOpen } = useInbox();

  // Only on the inbox list — not in a chat thread or other v2 pages
  if (pathname !== "/admin/v2-inbox" || isNewChatOpen) return null;

  return (
    <button
      type="button"
      onClick={() => setIsNewChatOpen(true)}
      className="fixed z-40 bottom-[5.5rem] right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full bg-brand-blue hover:bg-brand-blue/90 text-white shadow-lg shadow-brand-blue/25 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      aria-label="New message"
    >
      <MessageSquarePlus className="h-6 w-6" />
    </button>
  );
}