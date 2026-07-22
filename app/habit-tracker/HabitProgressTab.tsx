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
import { trpc } from "@/lib/trpc";
import {
  Trophy,
  Calendar as CalendarIcon,
  Star,
  Award,
  Medal,
  ChevronLeft,
  ChevronRight,
  Check,
  Utensils,
  X,
  Loader2,
} from "lucide-react";

type HabitLike = {
  id: number;
  title: string;
  type?: "boolean" | "numeric";
  targetValue?: number | null;
  unit?: string | null;
};

type LogLike = {
  userHabitId: number;
  dateStr: string;
  completed: boolean;
  numericValue?: number | null;
};

type NoteLike = {
  dateStr: string;
  note: string;
};

export function HabitProgressTab({
  logs,
  activeHabits,
  notes = [],
  currentStreak: currentStreakProp,
  isAuthenticated = false,
}: {
  logs: LogLike[];
  activeHabits: HabitLike[];
  notes?: NoteLike[];
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
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(todayStr);

  const { data: foodLogs, isLoading: foodLoading } = trpc.calories.getLogs.useQuery(
    { dateStr: selectedDateStr || todayStr },
    { enabled: isAuthenticated && !!selectedDateStr }
  );

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const paddingDays = Array.from({ length: monthStart.getDay() }).map((_, i) => `pad-${i}`);

  const selectedHabitDetails = useMemo(() => {
    if (!selectedDateStr) return [];
    return activeHabits.map((habit) => {
      const log = logs.find(
        (l) => l.userHabitId === habit.id && l.dateStr === selectedDateStr
      );
      return {
        habit,
        completed: !!log?.completed,
        numericValue: log?.numericValue ?? null,
      };
    });
  }, [activeHabits, logs, selectedDateStr]);

  const selectedNote = selectedDateStr
    ? notes.find((n) => n.dateStr === selectedDateStr)?.note
    : undefined;

  const completedCount = selectedHabitDetails.filter((h) => h.completed).length;
  const foodTotalCals =
    foodLogs?.reduce((sum, f) => sum + (f.calories || 0), 0) ?? 0;

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

  const mealLabel = (mealType: string) =>
    mealType.charAt(0).toUpperCase() + mealType.slice(1);

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
                onClick={() => {
                  setViewMonth(parseCalendarDate(todayStr));
                  setSelectedDateStr(todayStr);
                }}
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
              const isSelected = dStr === selectedDateStr;

              return (
                <button
                  type="button"
                  key={dStr}
                  title={`View ${dStr}`}
                  onClick={() => setSelectedDateStr(dStr)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 ${
                    isSelected
                      ? "ring-2 ring-[#2d3b2d] ring-offset-1"
                      : ""
                  } ${
                    isCompleted
                      ? "bg-[#c9a96e] text-white shadow-sm hover:bg-[#b8955a]"
                      : isDayToday
                        ? "bg-slate-100 text-[#2d3b2d] border border-slate-300 hover:bg-slate-200"
                        : "bg-slate-50 text-gray-400 hover:bg-slate-100 hover:text-gray-600"
                  }`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-4 text-center">
            Tap a day to see habits &amp; meals
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

      {/* Day detail panel */}
      {selectedDateStr && (
        <div
          className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ borderColor: "#f0e8e4" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                Day details
              </p>
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
              >
                {format(parseCalendarDate(selectedDateStr), "EEEE, MMMM d, yyyy")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {completedCount} of {activeHabits.length} habits completed
                {isAuthenticated && foodLogs && foodLogs.length > 0
                  ? ` · ${foodLogs.length} meal${foodLogs.length === 1 ? "" : "s"} · ${foodTotalCals} kcal`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDateStr(null)}
              className="p-2 rounded-full hover:bg-slate-100 text-gray-400"
              aria-label="Close day details"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Habits that day */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <Check size={14} className="text-[#c9a96e]" />
                Habits
              </p>
              {activeHabits.length === 0 ? (
                <p className="text-sm text-gray-400">No active habits.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedHabitDetails.map(({ habit, completed, numericValue }) => (
                    <li
                      key={habit.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                        completed
                          ? "bg-[#fcfaf9] border-[#c9a96e]/30"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            completed ? "bg-[#c9a96e] text-white" : "bg-slate-200 text-transparent"
                          }`}
                        >
                          <Check size={14} />
                        </span>
                        <span
                          className={`text-sm font-medium truncate ${
                            completed ? "text-[#2d3b2d]" : "text-gray-400"
                          }`}
                        >
                          {habit.title}
                        </span>
                      </div>
                      {habit.type === "numeric" && (
                        <span className="text-xs font-bold text-gray-500 shrink-0">
                          {numericValue ?? 0}
                          {habit.unit ? ` ${habit.unit}` : ""}
                          {habit.targetValue != null ? ` / ${habit.targetValue}` : ""}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Food that day */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <Utensils size={14} className="text-[#c9a96e]" />
                Food logged
              </p>
              {!isAuthenticated ? (
                <p className="text-sm text-gray-400">
                  Sign in to see meals logged for this day.
                </p>
              ) : foodLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                  <Loader2 size={16} className="animate-spin" />
                  Loading meals…
                </div>
              ) : !foodLogs || foodLogs.length === 0 ? (
                <p className="text-sm text-gray-400">No food logged this day.</p>
              ) : (
                <ul className="space-y-2">
                  {foodLogs.map((food) => (
                    <li
                      key={food.id}
                      className="p-3 rounded-xl border bg-white border-slate-100 shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {food.foodName}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">
                            {mealLabel(food.mealType)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-800 shrink-0">
                          {food.calories} kcal
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5">
                        <span className="text-blue-500">{food.protein}p</span>
                        {" · "}
                        <span className="text-orange-500">{food.carbs}c</span>
                        {" · "}
                        <span className="text-yellow-600">{food.fat}f</span>
                        {food.fiber != null && food.fiber > 0 && (
                          <>
                            {" · "}
                            <span className="text-green-600">{food.fiber}fb</span>
                          </>
                        )}
                      </p>
                    </li>
                  ))}
                  <li className="pt-2 text-right text-xs font-bold text-gray-500">
                    Day total: {foodTotalCals} kcal
                  </li>
                </ul>
              )}
            </div>
          </div>

          {selectedNote && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Note
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
