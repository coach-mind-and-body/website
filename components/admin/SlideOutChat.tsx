"use client";

import React, { useEffect } from "react";
import { useInbox } from "./messaging/InboxContext";
import ActiveChatThread from "./messaging/ActiveChatThread";
import CustomerProfilePane from "./messaging/CustomerProfilePane";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function SlideOutChat() {
  const { activeChatMeta, setActiveChatMeta, isProfileOpen, setIsProfileOpen } = useInbox();

  const isOpen = activeChatMeta !== null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && setActiveChatMeta(null)}>
      <SheetContent
        side="right"
        className={cn(
          "w-full sm:max-w-2xl p-0 border-l border-slate-200 overflow-hidden flex",
          isProfileOpen && "sm:max-w-4xl"
        )}
      >
        {activeChatMeta && (
          <>
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
              <ActiveChatThread chatId={activeChatMeta.conversationId} />
            </div>
            {isProfileOpen && (
              <div className="hidden sm:block w-[350px] shrink-0 border-l border-slate-200">
                <CustomerProfilePane chatId={activeChatMeta.conversationId} />
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
