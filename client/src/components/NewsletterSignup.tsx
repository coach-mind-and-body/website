import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, ArrowRight, X, CheckCircle2 } from "lucide-react";

// ── Shared hook ───────────────────────────────────────────────────────────────
function useSubscribe() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [done, setDone] = useState(false);

  const subscribe = trpc.blog.subscribe.useMutation({
    onSuccess: () => setDone(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribe.mutate({ email: email.trim(), firstName: firstName.trim() || undefined });
  };

  return { email, setEmail, firstName, setFirstName, done, handleSubmit, isPending: subscribe.isPending };
}

// ── Inline block (bottom of blog post) ───────────────────────────────────────
export function NewsletterInline() {
  const { email, setEmail, firstName, setFirstName, done, handleSubmit, isPending } = useSubscribe();

  return (
    <div
      className="rounded-2xl p-8 my-12"
      style={{
        background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.96 0.03 145) 100%)",
        border: "1px solid oklch(0.88 0.04 75)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: "oklch(0.55 0.11 72)", color: "white" }}
        >
          <Mail size={18} />
        </div>
        <div className="flex-1">
          {done ? (
            <SuccessMessage onClose={() => {}} inline />
          ) : (
            <>
              <h3
                className="font-bold text-xl mb-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
              >
                Get new posts delivered to your inbox
              </h3>
              <p className="text-sm mb-5" style={{ color: "oklch(0.42 0.02 160)" }}>
                Practical wisdom on mindset, hormonal health, and food freedom — straight to you, no noise.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full text-sm border outline-none"
                  style={{ background: "oklch(1 0 0)", border: "1.5px solid oklch(0.85 0.02 160)", color: "oklch(0.22 0.02 160)" }}
                />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2.5 rounded-full text-sm border outline-none"
                  style={{ background: "oklch(1 0 0)", border: "1.5px solid oklch(0.85 0.02 160)", color: "oklch(0.22 0.02 160)" }}
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:shadow-md disabled:opacity-60"
                  style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
                >
                  {isPending ? "Subscribing…" : <>Subscribe <ArrowRight size={14} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared success message ────────────────────────────────────────────────────
function SuccessMessage({ onClose, inline }: { onClose: () => void; inline?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center text-center gap-3 ${inline ? "py-2" : "py-6"}`}
      style={{
        animation: "successFadeIn 0.5s ease forwards",
      }}
    >
      <style>{`
        @keyframes successFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "oklch(0.92 0.04 145)", color: "oklch(0.38 0.10 148)" }}
      >
        <CheckCircle2 size={28} strokeWidth={1.8} />
      </div>
      <div>
        <h3
          className="font-bold text-xl mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
        >
          You're in! 🌿
        </h3>
        <p className="text-sm" style={{ color: "oklch(0.45 0.02 160)" }}>
          New posts will land in your inbox. No spam — just nourishing reads.
        </p>
      </div>
      {!inline && (
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:shadow-md"
          style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
        >
          Keep reading
        </button>
      )}
    </div>
  );
}

// ── Scroll-triggered popup ────────────────────────────────────────────────────
export function NewsletterPopup() {
  const { email, setEmail, firstName, setFirstName, done, handleSubmit, isPending } = useSubscribe();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (dismissed || triggered.current) return;

    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop / (el.scrollHeight - el.clientHeight);
      if (scrolled > 0.5 && !triggered.current) {
        triggered.current = true;
        setTimeout(() => {
          setVisible(true);
          // Slight delay before adding mounted class for the fade-in
          requestAnimationFrame(() => setTimeout(() => setMounted(true), 20));
        }, 800);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  const handleClose = () => {
    setMounted(false);
    setTimeout(() => { setDismissed(true); setVisible(false); }, 300);
  };

  if (!visible || dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes popupSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popupSlideOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(16px); }
        }
        .newsletter-popup-card {
          animation: popupSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .newsletter-popup-card.leaving {
          animation: popupSlideOut 0.3s ease forwards;
        }
        .newsletter-popup-overlay {
          animation: overlayFadeIn 0.3s ease forwards;
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Subtle overlay — much lighter than before */}
      <div
        className="newsletter-popup-overlay fixed inset-0 z-40"
        style={{ background: "oklch(0.10 0.01 160 / 0.25)" }}
        onClick={handleClose}
      />

      {/* Card — bottom-right corner, not full-screen modal */}
      <div
        className={`newsletter-popup-card fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl shadow-2xl ${!mounted ? "opacity-0" : ""}`}
        style={{
          background: "oklch(0.985 0.008 80)",
          border: "1px solid oklch(0.88 0.04 75)",
        }}
      >
        {/* Thin accent bar at top */}
        <div
          className="h-1 rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, oklch(0.55 0.11 72), oklch(0.38 0.10 148))" }}
        />

        <div className="p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full transition-opacity hover:opacity-60"
            style={{ color: "oklch(0.60 0.02 160)" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {done ? (
            <SuccessMessage onClose={handleClose} />
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.93 0.06 75)", color: "oklch(0.55 0.11 72)" }}
                >
                  <Mail size={15} />
                </div>
                <h3
                  className="font-bold text-lg leading-tight"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}
                >
                  Enjoying this article?
                </h3>
              </div>

              <p className="text-sm mb-4" style={{ color: "oklch(0.45 0.02 160)" }}>
                Get new posts on mindset, hormonal health, and food freedom — straight to your inbox.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full text-sm border outline-none"
                  style={{ background: "oklch(0.97 0.005 160)", border: "1.5px solid oklch(0.85 0.02 160)", color: "oklch(0.22 0.02 160)" }}
                />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-full text-sm border outline-none"
                  style={{ background: "oklch(0.97 0.005 160)", border: "1.5px solid oklch(0.85 0.02 160)", color: "oklch(0.22 0.02 160)" }}
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 rounded-full text-sm font-bold transition-all hover:shadow-md disabled:opacity-60"
                  style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
                >
                  {isPending ? "Subscribing…" : "Yes, send me new posts →"}
                </button>
              </form>

              <button
                onClick={handleClose}
                className="mt-2.5 w-full text-center text-xs transition-opacity hover:opacity-70"
                style={{ color: "oklch(0.62 0.02 160)" }}
              >
                No thanks
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
