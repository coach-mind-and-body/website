"use client";

import { Lightbulb } from "lucide-react";

export type InsightShape = {
  headline: string;
  body: string;
  tip: string;
  weekCompletedDays?: number;
  currentStreak?: number;
  bestStreak?: number;
};

export function PatternInsightCard({
  insight,
  compact,
}: {
  insight: InsightShape | null | undefined;
  compact?: boolean;
}) {
  if (!insight) return null;

  return (
    <div
      className={`rounded-3xl border shadow-sm ${compact ? "p-4" : "p-5 md:p-6"}`}
      style={{
        borderColor: "#f0e8e4",
        background: "linear-gradient(135deg, #fffdf9 0%, #faf5f5 100%)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#f0e8e4" }}
        >
          <Lightbulb size={18} style={{ color: "#c9a96e" }} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-1">
            Weekly pattern
          </p>
          <h3
            className={`font-bold mb-2 ${compact ? "text-base" : "text-lg"}`}
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
          >
            {insight.headline}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">{insight.body}</p>
          <p className="text-sm font-semibold" style={{ color: "#2d3b2d" }}>
            {insight.tip}
          </p>
          {!compact && typeof insight.currentStreak === "number" && (
            <p className="text-xs text-gray-400 mt-3">
              Streak {insight.currentStreak} · Best {insight.bestStreak ?? insight.currentStreak} ·{" "}
              {insight.weekCompletedDays ?? 0} active days this week
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
