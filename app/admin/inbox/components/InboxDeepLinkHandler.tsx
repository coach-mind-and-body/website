"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInbox } from "../InboxContext";

export default function InboxDeepLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPaymentModalOpen, setIsMobileMenuOpen } = useInbox();

  useEffect(() => {
    if (!searchParams) return;

    if (searchParams.get("pay") === "1") {
      setPaymentModalOpen(true);
    }
    if (searchParams.get("menu") === "1") {
      setIsMobileMenuOpen(true);
    }

    const chat = searchParams.get("chat");
    if (chat) {
      const chatId = parseInt(chat, 10);
      if (!isNaN(chatId)) {
        router.replace(`/admin/v2-inbox/chat/${chatId}`);
      }
    }
  }, [searchParams, router, setPaymentModalOpen, setIsMobileMenuOpen]);

  return null;
}