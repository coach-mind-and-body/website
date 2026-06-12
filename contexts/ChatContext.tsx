/**
 * ChatContext — persists chat state across page navigations.
 *
 * Features:
 * - Chat messages survive route changes (chatbot stays open)
 * - Internal site links navigate via wouter router (no page reload)
 * - After navigating to an internal page, the bot sends a contextual follow-up
 */

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Contextual follow-up messages per route
const PAGE_FOLLOW_UPS: Record<string, string> = {
  "/reclaim":
    "You're now on the R.E.C.L.A.I.M. page! 🌿 This is Lee Anne's signature 6-phase program for women 40+. Would you like to know more about what each phase covers, or are you ready to book a free discovery call to see if it's a good fit?",
  "/book":
    "You're on the booking page! 📅 Booking a free discovery call is a great first step — it's a relaxed 30-minute chat with Lee Anne to explore your goals. Is there anything you'd like to know before you book?",
  "/midlife-health-podcast":
    "Welcome to the podcast page! 🎙️ The Mind and Body Reset podcast covers real talk about hormones, insulin resistance, mindset, and what actually works in midlife. Is there a topic you're most curious about?",
  "/financial-peace":
    "You're on the Financial Peace University page! 💰 FPU is Dave Ramsey's 9-lesson course taught by Lee Anne — covering budgeting, debt elimination, and building wealth. Would you like to know how the classes are structured?",
  "/food-quiz":
    "You're about to take the free quiz! ✨ It only takes 60 seconds and helps you understand what's really keeping you stuck with food. Go ahead and take it — I'll be here if you have questions after!",
  "/about":
    "You're on Lee Anne's About page! 👋 She's a certified Life Coach and Health Coach who personally navigated hormone chaos and insulin resistance. Is there something specific you'd like to know about her approach?",
  "/health-wellness-blog":
    "You're on the blog! 📖 Lee Anne writes about hormones, mindset, nutrition, and midlife health. Is there a topic you'd like me to help you find?",
};

interface ChatContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  pendingFollowUp: string | null;
  setPendingFollowUp: (msg: string | null) => void;
  navigateWithFollowUp: (path: string) => void;
  hasUnread: boolean;
  setHasUnread: (v: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const router = useRouter();
  const followUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateWithFollowUp = useCallback(
    (path: string) => {
      // Navigate within the SPA
      router.push(path);

      // Look up contextual follow-up for this route
      const followUp = PAGE_FOLLOW_UPS[path];
      if (!followUp) return;

      // Clear any pending timer
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);

      // Small delay so the page renders first, then show the follow-up
      followUpTimerRef.current = setTimeout(() => {
        const followUpMsg: ChatMessage = {
          id: `followup-${Date.now()}`,
          role: "assistant",
          content: followUp,
        };
        setMessages((prev) => [...prev, followUpMsg]);
        // Minimize chat and show notification dot instead of forcing it open
        setIsOpen(false);
        setHasUnread(true);
        setPendingFollowUp(null);
      }, 600);
    },
    [router]
  );

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        setMessages,
        pendingFollowUp,
        setPendingFollowUp,
        navigateWithFollowUp,
        hasUnread,
        setHasUnread,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
