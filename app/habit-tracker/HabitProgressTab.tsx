"use client";

import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";
import { todayMountainDateStr } from "@/lib/mountainTime";
import {
  calculateCurrentStreak,
  calculateMaxStreak,
  calendarDateStr,
  parseCalendarDate,
} from "@/lib/habitStreak";
import { Trophy, Calendar as CalendarIcon, Star, Award, Medal, ChevronLeft, ChevronRight } from "lucide-react";

type HabitLike = { id: number };
type LogLike = { userHabitId: number; dateStr: string; completed: boolean };

export function HabitProgressTab({
  logs,
  activeHabits,
  currentStreak: currentStreakProp,
}: {
  logs: LogLike[];
  activeHabits: HabitLike[];
  currentStreak?: number;
  isAuthenticated?: boolean;
}) {
  const completedDateStrs = useMemo(() => {
    const set = new Set<string>();
    const activeHabitIds = new Set(activeHabits.map((h) => h.id));
    for (const log of logs) {
      if (log.completed && activeHabitIds.has(log.userHabitId)) {
        set.add(log.dateStr);
      }
    }
    return set;
  }, [logs, activeHabits]);

  const currentStreak =
    typeof currentStreakProp === "number"
      ? currentStreakProp
      : calculateCurrentStreak(completedDateStrs);
  const bestStreak = Math.max(currentStreak, calculateMaxStreak(completedDateStrs));

  const todayStr = todayMountainDateStr();
  const [viewMonth, setViewMonth] = useState(() => parseCalendarDate(todayStr));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const paddingDays = Array.from({ length: monthStart.getDay() }).map((_, i) => `pad-${i}`);

  const milestones = [
    {
      days: 7,
      label: "1 Week Streak",
      icon: <Star className="text-yellow-500 w-8 h-8" />,
      unlocked: bestStreak >= 7,
    },
    {
      days: 14,
      label: "2 Week Streak",
      icon: <Medal className="text-gray-400 w-8 h-8" />,
      unlocked: bestStreak >= 14,
    },
    {
      days: 30,
      label: "1 Month Streak",
      icon: <Award className="text-orange-500 w-8 h-8" />,
      unlocked: bestStreak >= 30,
    },
    {
      days: 100,
      label: "100 Day Streak",
      icon: <Trophy className="text-[#c9a96e] w-8 h-8" />,
      unlocked: bestStreak >= 100,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Current Progress Summary */}
      <div
        className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6"
        style={{ borderColor: "#f0e8e4" }}
      >
        <div
          className="w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center shadow-inner"
          style={{
            borderColor: currentStreak > 0 ? "#c9a96e" : "#f0e8e4",
            background: "#fcfaf9",
          }}
        >
          <span className="text-4xl font-bold" style={{ color: "#2d3b2d" }}>
            {currentStreak}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">
            Days
          </span>
        </div>
        <div className="text-center md:text-left flex-1">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
          >
            {currentStreak > 0 ? "You're on fire!" : "Time to start a new streak!"}
          </h2>
          <p className="text-gray-600">
            Every day you complete at least one habit, your streak grows. Consistency is the key to
            lasting change.
          </p>
          {bestStreak > currentStreak && (
            <p className="text-sm text-gray-500 mt-2">
              Best streak ever: <span className="font-bold text-[#2d3b2d]">{bestStreak} days</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monthly calendar */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm" style={{ borderColor: "#f0e8e4" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarIcon size={20} className="text-[#c9a96e]" />
              <h3 className="font-bold text-lg" style={{ color: "#2d3b2d" }}>
                {format(viewMonth, "MMMM yyyy")}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
                className="p-1.5 rounded-full hover:bg-slate-100 text-gray-500"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewMonth(parseCalendarDate(todayStr))}
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-slate-100 rounded-full"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="p-1.5 rounded-full hover:bg-slate-100 text-gray-500"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center text-[10px] font-bold uppercase text-gray-400">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {paddingDays.map((pad) => (
              <div key={pad} className="aspect-square rounded-xl" />
            ))}
            {daysInMonth.map((day) => {
              const dStr = calendarDateStr(day);
              const isCompleted = completedDateStrs.has(dStr);
              const isDayToday = dStr === todayStr;

              return (
                <div
                  key={dStr}
                  title={dStr}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-[#c9a96e] text-white shadow-sm"
                      : isDayToday
                        ? "bg-slate-100 text-[#2d3b2d] border border-slate-300"
                        : "bg-slate-50 text-gray-400"
                  }`}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-4 text-center">
            Highlighted days = at least one habit completed
          </p>
        </div>

        {/* Trophy Case */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm" style={{ borderColor: "#f0e8e4" }}>
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={20} className="text-[#c9a96e]" />
            <h3 className="font-bold text-lg" style={{ color: "#2d3b2d" }}>
              Trophy Case
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {milestones.map((m) => (
              <div
                key={m.days}
                className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all ${
                  m.unlocked
                    ? "bg-gradient-to-br from-white to-[#fcfaf9] shadow-sm border-[#c9a96e]/30"
                    : "bg-slate-50 border-slate-100 opacity-60 grayscale"
                }`}
              >
                <div
                  className={`p-3 rounded-full ${
                    m.unlocked ? "bg-[#c9a96e]/10 shadow-inner" : "bg-slate-200"
                  }`}
                >
                  {m.icon}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
                    {m.label}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mt-1">
                    {m.unlocked
                      ? "Unlocked!"
                      : `${Math.max(0, m.days - currentStreak)} days left`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-4 text-center">
            Badges stay unlocked based on your best streak ever
          </p>
        </div>
      </div>
    </div>
  );
}
