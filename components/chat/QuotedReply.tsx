"use client";

import { quoteSnippet } from "@/lib/chatTime";

export function QuotedReply({
  name,
  text,
  mine = false,
}: {
  name?: string | null;
  text?: string | null;
  mine?: boolean;
}) {
  return (
    <div
      className="mb-1.5 pl-2 border-l-2 text-[11px] leading-snug"
      style={{
        borderColor: mine ? "rgba(255,255,255,0.55)" : "#c9a96e",
        color: mine ? "rgba(255,255,255,0.85)" : "#6b7a6b",
      }}
    >
      <p className="font-bold truncate">{name || "Message"}</p>
      <p className="line-clamp-2">{quoteSnippet(text)}</p>
    </div>
  );
}

export function DateChip({ label }: { label: string }) {
  if (!label) return null;
  return (
    <div className="flex justify-center my-3">
      <span className="text-[11px] font-semibold tracking-wide text-slate-500 bg-black/[0.04] px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  );
}
