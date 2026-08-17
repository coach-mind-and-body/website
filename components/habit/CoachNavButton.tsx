"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const glassStyle = {
  background: "rgba(245, 228, 224, 0.55)",
  backdropFilter: "blur(22px) saturate(1.5)",
  WebkitBackdropFilter: "blur(22px) saturate(1.5)",
} as const;

export default function CoachNavButton({
  active,
  compact,
}: {
  active: boolean;
  compact?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.coach.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: () =>
      typeof document !== "undefined" && document.hidden ? false : 20_000,
    refetchOnWindowFocus: true,
  });
  const count = data?.count ?? 0;
  const size = compact ? "w-11 h-11" : "w-[3.25rem] h-[3.25rem]";
  const icon = compact ? 20 : 22;

  return (
    <Link
      href="/habit-tracker/coach"
      aria-label={count > 0 ? `Coach, ${count} unread` : "Coach"}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center justify-center ${size} shrink-0 rounded-full border border-white/45 shadow-[0_8px_32px_rgba(45,59,45,0.12)] transition-all duration-300 ${
        active
          ? "bg-[#2d3b2d] text-white scale-105 shadow-md"
          : "text-[#6b7a6b] hover:text-[#2d3b2d] hover:scale-105"
      }`}
      style={active ? undefined : glassStyle}
    >
      <MessageCircle size={icon} strokeWidth={active ? 2.4 : 2} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#c45c4a] text-white text-[9px] font-bold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
