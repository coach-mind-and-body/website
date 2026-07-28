"use client";

import { trpc } from "@/lib/trpc";
import { Flame, AlertTriangle, Loader2 } from "lucide-react";

export function AdminHabitCoachBoard() {
  const { data: board, isLoading } = trpc.habit.adminCoachBoard.useQuery();
  const { data: funnel } = trpc.habit.adminFunnelStats.useQuery();
  const { data: runs } = trpc.habit.adminListReminderRuns.useQuery();

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center text-gray-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2
          className="font-bold text-2xl mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          Coach board
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Clients who shared habit progress. At risk = no activity in 3+ days.
        </p>
      </div>

      {/* Funnel + reminder status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(funnel?.last7 || {}).map(([k, v]) => (
          <div
            key={k}
            className="p-4 rounded-xl border bg-white"
            style={{ borderColor: "oklch(0.90 0.015 80)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {k.replace(/_/g, " ")} (7d)
            </p>
            <p className="text-2xl font-bold" style={{ color: "oklch(0.20 0.015 50)" }}>
              {Number(v)}
            </p>
          </div>
        ))}
        {funnel?.reminder && (
          <div
            className="p-4 rounded-xl border bg-white"
            style={{ borderColor: "oklch(0.90 0.015 80)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Last evening push
            </p>
            <p className="text-sm font-bold" style={{ color: "oklch(0.20 0.015 50)" }}>
              {funnel.reminder.dateStr}
            </p>
            <p className="text-xs text-gray-500">{funnel.reminder.sentCount} sent</p>
          </div>
        )}
      </div>

      {runs && runs.length > 0 && (
        <div className="text-xs text-gray-500">
          Recent reminder runs:{" "}
          {runs
            .slice(0, 5)
            .map((r) => `${r.dateStr}(${r.sentCount})`)
            .join(" · ")}
        </div>
      )}

      <div className="space-y-2">
        {(board || []).length === 0 && (
          <p className="text-gray-500 text-sm">No clients sharing habits yet.</p>
        )}
        {(board || []).map((row) => (
          <div
            key={row.userId}
            className="flex items-center justify-between p-4 rounded-xl border bg-white gap-3"
            style={{ borderColor: "oklch(0.90 0.015 80)" }}
          >
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: "oklch(0.20 0.015 50)" }}>
                {row.name || row.email || `User #${row.userId}`}
              </p>
              <p className="text-xs text-gray-500 truncate">{row.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Last active: {row.lastActiveDateStr || "never"} · inactive {row.daysInactive === 999 ? "∞" : row.daysInactive}d
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {row.atRisk && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                  <AlertTriangle size={12} /> At risk
                </span>
              )}
              {row.onFire && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  <Flame size={12} /> On fire
                </span>
              )}
              <span className="text-sm font-bold" style={{ color: "oklch(0.20 0.015 50)" }}>
                {row.streak}d
                <span className="text-gray-400 font-normal text-xs ml-1">
                  best {row.maxStreak}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Open a contact in CRM → Habits tab for full detail (victories, insight, challenges).
      </p>
    </div>
  );
}
