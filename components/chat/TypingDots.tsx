"use client";

/** iMessage-style three-dot typing indicator. */
export function TypingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`mbr-typing-dots inline-flex items-center gap-[5px] h-4 ${className}`} aria-hidden>
      <span className="mbr-typing-dot" />
      <span className="mbr-typing-dot" />
      <span className="mbr-typing-dot" />
      <style>{`
        .mbr-typing-dot {
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: currentColor;
          animation: mbr-typing-dot 1.05s ease-in-out infinite;
        }
        .mbr-typing-dot:nth-child(2) { animation-delay: 0.16s; }
        .mbr-typing-dot:nth-child(3) { animation-delay: 0.32s; }
        @keyframes mbr-typing-dot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </span>
  );
}
