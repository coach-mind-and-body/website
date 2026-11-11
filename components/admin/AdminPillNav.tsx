"use client";

import type { LucideIcon } from "lucide-react";

const gold = "oklch(0.72 0.12 75)";
const cream = "oklch(0.96 0.025 50)";
const ink = "oklch(0.42 0.015 50)";
const line = "oklch(0.90 0.015 80)";

export function AdminPillNav({
  items,
  activeId,
  onSelect,
  size = "md",
  label,
}: {
  items: { id: string; label: string; icon?: LucideIcon; badge?: number }[];
  activeId: string;
  onSelect: (id: string) => void;
  size?: "md" | "sm";
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={label}>
      {items.map((item) => {
        const active = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={item.badge ? `${item.label}, ${item.badge} unread` : item.label}
            onClick={() => onSelect(item.id)}
            className={`flex-shrink-0 flex items-center gap-2 rounded-full font-bold whitespace-nowrap transition-all shadow-sm hover:shadow ${
              size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-4 py-2 text-sm md:px-5 md:py-2.5"
            }`}
            style={{
              background: active ? gold : cream,
              color: active ? "oklch(1 0 0)" : ink,
              border: active ? "none" : `1px solid ${line}`,
            }}
          >
            {Icon ? <Icon size={size === "sm" ? 14 : 16} /> : null}
            {item.label}
            {item.badge ? (
              <span
                className="min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold leading-5"
                style={{
                  background: active ? "oklch(0.98 0.01 80)" : "oklch(0.52 0.2 25)",
                  color: active ? "oklch(0.42 0.16 25)" : "white",
                }}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
