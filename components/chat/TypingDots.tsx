"use client";

/** iMessage-style three-dot typing indicator. */
export function TypingDots({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-end gap-[5px] h-4 px-0.5 ${className}`}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-[7px] w-[7px] rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 0.16}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}
