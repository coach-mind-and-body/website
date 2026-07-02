"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type ActiveChatMeta = {
  conversationId: number;
  userId: number | null;
  contactPhone: string | null;
  userName: string | null;
};

interface InboxContextType {
  dialerOpen: boolean;
  setDialerOpen: (open: boolean) => void;
  dialerPrefill: string;
  setDialerPrefill: (prefill: string) => void;
  videoModalOpen: boolean;
  setVideoModalOpen: (open: boolean) => void;
  activeVideoRoom: string;
  setActiveVideoRoom: (room: string) => void;
  paymentModalOpen: boolean;
  setPaymentModalOpen: (open: boolean) => void;
  templatesModalOpen: boolean;
  setTemplatesModalOpen: (open: boolean) => void;
  fullscreenImage: string | null;
  setFullscreenImage: (url: string | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isNewChatOpen: boolean;
  setIsNewChatOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  activeChatMeta: ActiveChatMeta | null;
  setActiveChatMeta: (meta: ActiveChatMeta | null) => void;
  newChatPrefill: { name?: string, phone?: string, userId?: number } | null;
  setNewChatPrefill: (prefill: { name?: string, phone?: string, userId?: number } | null) => void;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

export function InboxProvider({ children }: { children: ReactNode }) {
  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialerPrefill, setDialerPrefill] = useState("");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoRoom, setActiveVideoRoom] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeChatMeta, setActiveChatMeta] = useState<ActiveChatMeta | null>(null);
  const [newChatPrefill, setNewChatPrefill] = useState<{ name?: string, phone?: string, userId?: number } | null>(null);

  return (
    <InboxContext.Provider value={{
      dialerOpen, setDialerOpen,
      dialerPrefill, setDialerPrefill,
      videoModalOpen, setVideoModalOpen,
      activeVideoRoom, setActiveVideoRoom,
      paymentModalOpen, setPaymentModalOpen,
      templatesModalOpen, setTemplatesModalOpen,
      fullscreenImage, setFullscreenImage,
      isMobileMenuOpen, setIsMobileMenuOpen,
      isNewChatOpen, setIsNewChatOpen,
      isProfileOpen, setIsProfileOpen,
      activeChatMeta, setActiveChatMeta,
      newChatPrefill, setNewChatPrefill,
    }}>
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox() {
  const context = useContext(InboxContext);
  if (context === undefined) {
    throw new Error("useInbox must be used within an InboxProvider");
  }
  return context;
}
