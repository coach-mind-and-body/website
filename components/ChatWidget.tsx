/**
 * ChatWidget — floating AI chat button that appears on every page.
 *
 * Features:
 * - Persists across route changes via ChatContext
 * - Internal site links navigate within the SPA (no new tab, no reload)
 * - After navigating to an internal page, bot sends a contextual follow-up
 * - External links (YouTube, etc.) still open in a new tab
 * - Renders Markdown links as styled pill buttons
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";

const SITE_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
const INTERNAL_HOSTS = typeof window !== "undefined" ? ["mindandbodyresetcoach.com", "www.mindandbodyresetcoach.com", window.location.hostname] : [];

const SUGGESTED_PROMPTS = [
  "What is the R.E.C.L.A.I.M. program?",
  "Tell me about Financial Peace University",
  "How do I book a free discovery call?",
  "What's the podcast about?",
];

// ── Determine if a URL is internal to this site ───────────────────────────────
function isInternalUrl(url: string): { internal: boolean; path: string } {
  try {
    const parsed = new URL(url, SITE_ORIGIN);
    const internal = INTERNAL_HOSTS.includes(parsed.hostname);
    return { internal, path: parsed.pathname };
  } catch {
    // Relative URL
    if (url.startsWith("/")) return { internal: true, path: url };
    return { internal: false, path: url };
  }
}

// ── Markdown-to-React renderer ────────────────────────────────────────────────
// Parses: [label](url) → pill button, **bold**, *italic*, plain text
function renderMarkdown(text: string, onInternalNav: (path: string) => void): React.ReactNode[] {
  const paragraphs = text.split(/\n{2,}/);

  return paragraphs.map((para, pIdx) => {
    const nodes = parseInline(para, onInternalNav);
    return (
      <p key={pIdx} style={{ margin: pIdx > 0 ? "8px 0 0" : "0", lineHeight: "1.65" }}>
        {nodes}
      </p>
    );
  });
}

function parseInline(text: string, onInternalNav: (path: string) => void): React.ReactNode[] {
  const TOKEN = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|([^[*]+)/g;
  const nodes: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = TOKEN.exec(text)) !== null) {
    const [, linkLabel, linkUrl, boldText, italicText, plainText] = match;

    if (linkLabel && linkUrl) {
      const { internal, path } = isInternalUrl(linkUrl);

      if (internal) {
        // Internal link → navigate within SPA, keep chat open
        nodes.push(
          <button
            key={key++}
            onClick={() => onInternalNav(path)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              background: "oklch(0.38 0.10 148)",
              color: "oklch(0.97 0.005 75)",
              border: "none",
              cursor: "pointer",
              margin: "2px 2px",
              lineHeight: "1.5",
              verticalAlign: "middle",
              whiteSpace: "nowrap",
            }}
          >
            {linkLabel} →
          </button>
        );
      } else {
        // External link → new tab
        nodes.push(
          <a
            key={key++}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              background: "oklch(0.38 0.10 148)",
              color: "oklch(0.97 0.005 75)",
              textDecoration: "none",
              margin: "2px 2px",
              lineHeight: "1.5",
              verticalAlign: "middle",
              whiteSpace: "nowrap",
            }}
          >
            {linkLabel} ↗
          </a>
        );
      }
    } else if (boldText) {
      nodes.push(<strong key={key++}>{boldText}</strong>);
    } else if (italicText) {
      nodes.push(<em key={key++}>{italicText}</em>);
    } else if (plainText) {
      const lines = plainText.split("\n");
      lines.forEach((line, i) => {
        nodes.push(line);
        if (i < lines.length - 1) nodes.push(<br key={`br-${key++}`} />);
      });
    }
  }

  return nodes;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const { isOpen, setIsOpen, messages: ctxMessages, setMessages: setCtxMessages, navigateWithFollowUp, hasUnread, setHasUnread } = useChatContext();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // useChat manages streaming; we sync its messages into context after each response
  const { messages: chatMessages, sendMessage, setMessages: setChatMessages, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    id: "site-widget",
  });

  // On first mount, restore messages from context (persists across route changes)
  const restoredRef = useRef(false);
  useEffect(() => {
    if (!restoredRef.current && ctxMessages.length > 0) {
      restoredRef.current = true;
      setChatMessages(
        ctxMessages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: m.content }],
        }))
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = status === "streaming" || status === "submitted";

  // Sync chat messages back to context whenever they change
  useEffect(() => {
    const mapped = chatMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content:
        m.parts
          ?.filter((p) => p.type === "text")
          .map((p) => (p as { type: "text"; text: string }).text)
          .join("") ?? "",
    }));
    setCtxMessages(mapped);
  }, [chatMessages, setCtxMessages]);

  // When context messages are added externally (follow-ups), sync into useChat
  useEffect(() => {
    if (ctxMessages.length > chatMessages.length) {
      const newMsgs = ctxMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
      }));
      setChatMessages(newMsgs);
    }
  }, [ctxMessages, chatMessages.length, setChatMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isOpen]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue("");
    sendMessage({ parts: [{ type: "text", text }] });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage({ parts: [{ type: "text", text: prompt }] });
  };

  const handleInternalNav = useCallback(
    (path: string) => {
      navigateWithFollowUp(path);
    },
    [navigateWithFollowUp]
  );

  // Clear unread when chat is opened
  const handleToggle = () => {
    if (!isOpen) setHasUnread(false);
    setIsOpen(!isOpen);
  };

  // Derive display messages from chatMessages (which has the parts structure)
  const displayMessages = chatMessages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content:
      m.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("") ?? "",
  }));

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed top-[160px] right-5 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: "360px",
            maxWidth: "calc(100vw - 40px)",
            height: "520px",
            maxHeight: "calc(100vh - 120px)",
            background: "#ffffff",
            border: "1px solid oklch(0.88 0.02 75)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.30 0.09 148) 0%, oklch(0.38 0.10 148) 100%)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(1 0 0 / 0.20)" }}
              >
                <Sparkles size={15} style={{ color: "oklch(0.95 0.04 148)" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "oklch(0.97 0.005 75)" }}>
                  Ask Lee Anne's Team
                </p>
                <p className="text-xs" style={{ color: "oklch(0.80 0.015 75)" }}>
                  Mind &amp; Body Reset
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full transition-colors hover:bg-white/20"
              style={{ color: "oklch(0.90 0.01 75)" }}
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{ background: "oklch(0.985 0.008 75)" }}
          >
            {displayMessages.length === 0 ? (
              <div className="flex flex-col gap-3 pt-2">
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%]"
                  style={{
                    background: "#ffffff",
                    border: "1px solid oklch(0.90 0.02 75)",
                    color: "oklch(0.25 0.025 55)",
                  }}
                >
                  Hi! 👋 I'm here to help you learn about Lee Anne's programs, the podcast, and how to get started. What would you like to know?
                </div>
                <div className="flex flex-col gap-2 mt-1">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="text-left text-xs px-3 py-2 rounded-xl border transition-all hover:shadow-sm"
                      style={{
                        background: "#ffffff",
                        borderColor: "oklch(0.85 0.04 148)",
                        color: "oklch(0.35 0.09 148)",
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              displayMessages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="rounded-2xl px-4 py-2.5 text-sm max-w-[88%]"
                      style={
                        isUser
                          ? {
                              background: "oklch(0.38 0.10 148)",
                              color: "oklch(0.97 0.005 75)",
                              borderRadius: "18px 18px 4px 18px",
                              lineHeight: "1.65",
                            }
                          : {
                              background: "#ffffff",
                              border: "1px solid oklch(0.90 0.02 75)",
                              color: "oklch(0.25 0.025 55)",
                              borderRadius: "18px 18px 18px 4px",
                            }
                      }
                    >
                      {isUser ? (
                        <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                      ) : (
                        renderMarkdown(msg.content, handleInternalNav)
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
                  style={{
                    background: "#ffffff",
                    border: "1px solid oklch(0.90 0.02 75)",
                    borderRadius: "18px 18px 18px 4px",
                  }}
                >
                  <Loader2 size={13} className="animate-spin" style={{ color: "oklch(0.38 0.10 148)" }} />
                  <span className="text-xs" style={{ color: "oklch(0.55 0.03 55)" }}>
                    Thinking…
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            className="flex items-end gap-2 px-3 py-3 flex-shrink-0"
            style={{ background: "#ffffff", borderTop: "1px solid oklch(0.92 0.015 75)" }}
          >
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              rows={1}
              className="flex-1 resize-none text-sm rounded-xl border-0 focus-visible:ring-1 min-h-[38px] max-h-[100px] py-2 px-3"
              style={{
                background: "oklch(0.96 0.008 75)",
                color: "oklch(0.20 0.025 55)",
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="rounded-xl h-9 w-9 p-0 flex-shrink-0"
              style={{
                background: "oklch(0.38 0.10 148)",
                color: "white",
              }}
              aria-label="Send message"
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <div className="fixed top-24 right-5 z-50">
        <button
          onClick={handleToggle}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{
            background: isOpen
              ? "oklch(0.38 0.10 148)"
              : "linear-gradient(135deg, oklch(0.30 0.09 148) 0%, oklch(0.45 0.11 148) 100%)",
            boxShadow: "0 4px 20px oklch(0.30 0.09 148 / 0.45)",
          }}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? (
            <X size={22} style={{ color: "white" }} />
          ) : (
            <MessageCircle size={22} style={{ color: "white" }} />
          )}
        </button>
        {/* Red notification dot — shown when there's an unread follow-up message */}
        {hasUnread && !isOpen && (
          <span
            className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
            style={{
              background: "#e53e3e",
              border: "2px solid white",
              fontSize: "9px",
              fontWeight: "bold",
              color: "white",
              lineHeight: 1,
            }}
            aria-label="New message"
          >
            1
          </span>
        )}
      </div>
    </>
  );
}
