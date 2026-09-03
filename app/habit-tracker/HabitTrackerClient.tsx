"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Check, Info, Calendar as CalendarIcon, Sparkles, Flame, Target, Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, addDays } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDeviceId } from "@/lib/deviceId";
import { todayMountainDateStr, dateToMountainDateStr } from "@/lib/mountainTime";
import { calendarDateStr, parseCalendarDate, calculateCurrentStreak } from "@/lib/habitStreak";
import { HabitProgressTab } from "./HabitProgressTab";
import { VictoryListCard } from "@/components/habit/VictoryListCard";
import ChallengeTodayCard from "@/components/habit/ChallengeTodayCard";
import { OnboardingPackModal } from "@/components/habit/OnboardingPackModal";
import { PatternInsightCard } from "@/components/habit/PatternInsightCard";
import HabitTrackerInstallPrompt from "@/components/HabitTrackerInstallPrompt";
import { useWebPush } from "@/hooks/useWebPush";
import { isVictoryHabitTitle } from "@/lib/victoryHabit";

type LocalHabit = { id: number; title: string; description?: string | null; type: "boolean" | "numeric"; targetValue: number | null; unit: string | null; isActive: boolean; };

type LocalLog = {
  userHabitId: number;
  dateStr: string;
  completed: boolean;
  numericValue?: number | null;
};

type LocalNote = {
  dateStr: string;
  note: string;
};

export default function HabitTrackerClient() {
  usePageTitle({
    title: "Habit Tracker | Mind & Body Reset Coaches",
    description: "Track your daily habits and reclaim your wellness journey. Access anywhere with an account, or track locally on your device.",
    keywords: "habit tracker, daily habits, wellness tracker, mind body reset"
  });

  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const focusVictories = searchParams?.get("focus") === "victories";
  const { isSupported, isSubscribed, isSubscribing, subscribeToPush } = useWebPush();
  
  // Data State
  const [localHabits, setLocalHabits] = useState<LocalHabit[]>([]);
  const [localLogs, setLocalLogs] = useState<LocalLog[]>([]);
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([]);
  
  const [isMounted, setIsMounted] = useState(false);
  const [mainTab, setMainTab] = useState<"daily" | "progress">("daily");

  // Week / selection anchored to America/Denver calendar days
  const [currentDate, setCurrentDate] = useState(() => parseCalendarDate(todayMountainDateStr()));
  const [selectedDate, setSelectedDate] = useState(() => parseCalendarDate(todayMountainDateStr()));
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [showPastDays, setShowPastDays] = useState(false);
  const [showDay1Modal, setShowDay1Modal] = useState(false);
  const [optimisticLogs, setOptimisticLogs] = useState<LocalLog[]>([]);
  const numericDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [showImportPrompt, setShowImportPrompt] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // TRPC — short window for daily; long history only on Progress
  const { data: templates } = trpc.habit.getTemplates.useQuery(undefined, { enabled: !isAuthenticated });
  const habitLogsFromDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - (mainTab === "progress" ? 400 : 21));
    return dateToMountainDateStr(d);
  })();
  const { data: userSyncData, refetch: refetchUserSync } = trpc.habit.getUserHabits.useQuery(
    { fromDate: habitLogsFromDate },
    { enabled: isAuthenticated }
  );

  const { data: weeklyInsight } = trpc.habit.getWeeklyInsight.useQuery(undefined, {
    enabled: isAuthenticated && (mainTab === "progress" || mainTab === "daily"),
  });
  
  const { data: activeChallengesData } = trpc.challenges.getActiveChallenges.useQuery();
  const { data: userChallengesData, refetch: refetchUserChallenges } = trpc.challenges.getUserChallenges.useQuery({ deviceId: getDeviceId() });
  const { data: updatesData } = trpc.appUpdates.getUpdates.useQuery(undefined, {
    enabled: showUpdates || mainTab === "daily",
  });

  const trackFunnel = trpc.habit.trackFunnelEvent.useMutation();
  const mergeVictories = trpc.habit.mergeGuestVictories.useMutation();
  
  const [dismissedUpdates, setDismissedUpdates] = useState<number[]>([]);

  const handleDismissUpdate = (id: number) => {
    const next = [...dismissedUpdates, id];
    setDismissedUpdates(next);
    localStorage.setItem('dismissedUpdates', JSON.stringify(next));
  };

  const [showDismissed, setShowDismissed] = useState(false);
  const [challengeTab, setChallengeTab] = useState<"active" | "completed">("active");
  const joinChallengeMutation = trpc.challenges.joinChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge joined!");
      refetchUserChallenges();
    }
  });

  const mergeGuestDataMutation = trpc.challenges.mergeGuestData.useMutation({
    onSuccess: () => refetchUserChallenges(),
  });

  const toggleChallengeLogMutation = trpc.challenges.toggleChallengeLog.useMutation({
    onSuccess: () => refetchUserChallenges(),
    onError: (e) => toast.error(e.message)
  });

  const toggleLogMutation = trpc.habit.toggleLog.useMutation({
    onSuccess: () => refetchUserSync(),
    onError: (e) => toast.error(e.message),
    onSettled: () => setOptimisticLogs([]),
  });

  const syncHabitMutation = trpc.habit.syncHabit.useMutation();

  const saveNoteMutation = trpc.habit.saveDailyNote.useMutation({
    onSuccess: () => {
      toast.success("Note saved!");
      refetchUserSync();
    },
    onError: (e) => toast.error(e.message)
  });

  // Initialize Local Storage and Mount
  useEffect(() => {
    setIsMounted(true);
    
    // Load dismissed updates
    try {
      const saved = localStorage.getItem('dismissedUpdates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setDismissedUpdates(parsed);
      }
    } catch {}

    // Funnel: first open
    try {
      if (!localStorage.getItem("mbr_funnel_first_open")) {
        localStorage.setItem("mbr_funnel_first_open", new Date().toISOString());
        trackFunnel.mutate({ eventType: "first_open", deviceId: getDeviceId() });
      }
    } catch {}

    if (focusVictories) {
      setMainTab("daily");
    }

    if (!isAuthenticated) {
      const storedHabits = localStorage.getItem("mbr_habits");
      const storedLogs = localStorage.getItem("mbr_habit_logs");
      const storedNotes = localStorage.getItem("mbr_daily_notes");
      
      if (storedHabits) {
        setLocalHabits(JSON.parse(storedHabits));
      } else if (templates) {
        const initialHabits: LocalHabit[] = templates.map(t => ({ id: t.id, title: t.title, description: t.description, type: t.type as "boolean" | "numeric", targetValue: t.targetValue, unit: t.unit, isActive: true }));
        setLocalHabits(initialHabits);
        localStorage.setItem("mbr_habits", JSON.stringify(initialHabits));
      }

      if (storedLogs) {
        setLocalLogs(JSON.parse(storedLogs));
      }

      if (storedNotes) {
        setLocalNotes(JSON.parse(storedNotes));
      }
    }
  }, [isAuthenticated, templates]);

  // Merge guest challenge progress when user signs in
  useEffect(() => {
    if (!isAuthenticated) return;
    mergeGuestDataMutation.mutate({ deviceId: getDeviceId() });
    mergeVictories.mutate({ deviceId: getDeviceId() });
  }, [isAuthenticated]);

  const importFitness = trpc.fitness.importGuestLogs.useMutation();
  const importCalories = trpc.calories.importGuestLogs.useMutation();

  // Offer to import local data after login (habits + fitness + meals)
  useEffect(() => {
    if (!isAuthenticated || !userSyncData) return;
    const hasLocalHabits = !!localStorage.getItem("mbr_habits");
    const hasLocalLogs = !!localStorage.getItem("mbr_habit_logs");
    let hasFitness = false;
    let hasMeals = false;
    try {
      const f = JSON.parse(localStorage.getItem("mbr_fitness_logs") || "[]");
      const m = JSON.parse(localStorage.getItem("mbr_calorie_logs") || "[]");
      hasFitness = Array.isArray(f) && f.length > 0;
      hasMeals = Array.isArray(m) && m.length > 0;
    } catch {
      /* ignore */
    }
    const dismissed = localStorage.getItem("mbr_import_dismissed");
    if ((hasLocalHabits || hasLocalLogs || hasFitness || hasMeals) && !dismissed) {
      setShowImportPrompt(true);
    }
  }, [isAuthenticated, userSyncData]);

  const handleImportLocalData = async () => {
    if (!userSyncData) return;
    setIsImporting(true);
    try {
      const storedHabits: LocalHabit[] = JSON.parse(localStorage.getItem("mbr_habits") || "[]");
      const storedLogs: LocalLog[] = JSON.parse(localStorage.getItem("mbr_habit_logs") || "[]");

      const titleToServerId = new Map<string, number>();
      for (const habit of userSyncData.habits) {
        titleToServerId.set(habit.title.trim().toLowerCase(), habit.id);
      }

      for (const localHabit of storedHabits) {
        const key = localHabit.title.trim().toLowerCase();
        if (!titleToServerId.has(key)) {
          const result = await syncHabitMutation.mutateAsync({
            title: localHabit.title,
            description: localHabit.description ?? undefined,
            type: localHabit.type,
            targetValue: localHabit.targetValue,
            unit: localHabit.unit,
            order: storedHabits.indexOf(localHabit) + 1,
            isActive: localHabit.isActive !== false,
          });
          titleToServerId.set(key, result.id);
        }
      }

      const refreshed = await refetchUserSync();
      const serverHabits = refreshed.data?.habits || userSyncData.habits;
      const localIdToServerId = new Map<number, number>();
      for (const localHabit of storedHabits) {
        const match = serverHabits.find(h => h.title.trim().toLowerCase() === localHabit.title.trim().toLowerCase());
        if (match) localIdToServerId.set(localHabit.id, match.id);
      }

      for (const log of storedLogs) {
        const serverHabitId = localIdToServerId.get(log.userHabitId);
        if (!serverHabitId) continue;
        await toggleLogMutation.mutateAsync({
          userHabitId: serverHabitId,
          dateStr: log.dateStr,
          completed: log.completed,
          numericValue: log.numericValue ?? undefined,
        });
      }

      // Fitness guest logs
      let fitnessCount = 0;
      try {
        const fitnessLogs = JSON.parse(localStorage.getItem("mbr_fitness_logs") || "[]");
        if (Array.isArray(fitnessLogs) && fitnessLogs.length > 0) {
          const payload = fitnessLogs.map((l: any) => ({
            dateStr: l.dateStr,
            exerciseName: l.exerciseName,
            sets: l.sets ?? 1,
            reps: l.reps ?? 0,
            weight: l.weight ?? 0,
            durationMinutes: l.durationMinutes ?? 0,
          }));
          const res = await importFitness.mutateAsync({ logs: payload });
          fitnessCount = res.imported;
          localStorage.removeItem("mbr_fitness_logs");
        }
      } catch {
        /* ignore fitness import errors after habits */
      }

      // Meal guest logs
      let mealCount = 0;
      try {
        const mealLogs = JSON.parse(localStorage.getItem("mbr_calorie_logs") || "[]");
        if (Array.isArray(mealLogs) && mealLogs.length > 0) {
          const payload = mealLogs.map((l: any) => ({
            dateStr: l.dateStr,
            mealType: l.mealType || "snack",
            foodName: l.foodName,
            calories: l.calories || 0,
            protein: l.protein || 0,
            carbs: l.carbs || 0,
            fat: l.fat || 0,
            fiber: l.fiber || 0,
          }));
          const res = await importCalories.mutateAsync({ logs: payload });
          mealCount = res.imported;
          localStorage.removeItem("mbr_calorie_logs");
        }
      } catch {
        /* ignore */
      }

      localStorage.removeItem("mbr_habits");
      localStorage.removeItem("mbr_habit_logs");
      localStorage.setItem("mbr_import_dismissed", "1");
      setShowImportPrompt(false);
      const bits = ["habits"];
      if (fitnessCount) bits.push(`${fitnessCount} workouts`);
      if (mealCount) bits.push(`${mealCount} meals`);
      toast.success(`Imported ${bits.join(" · ")} to your account`);
      refetchUserSync();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Import failed";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  const activeHabits = (isAuthenticated ? (userSyncData?.habits || []) : localHabits)
    .filter(h => h.isActive !== false)
    .filter(h => !isVictoryHabitTitle(h.title));
  const logs = isAuthenticated ? (userSyncData?.logs || []) : localLogs;
  const notes = isAuthenticated ? (userSyncData?.notes || []) : localNotes;

  const currentNoteDateStr = calendarDateStr(selectedDate);
  const currentNote = notes.find(n => n.dateStr === currentNoteDateStr)?.note || "";

  const [noteText, setNoteText] = useState("");

  // Sync noteText state when selectedDate changes
  useEffect(() => {
    setNoteText(currentNote);
  }, [currentNote, selectedDate]);

  const handleSaveNote = () => {
    if (isAuthenticated) {
      saveNoteMutation.mutate({ dateStr: currentNoteDateStr, note: noteText });
    } else {
      let newNotes = [...localNotes];
      const existingIdx = newNotes.findIndex(n => n.dateStr === currentNoteDateStr);
      if (existingIdx >= 0) {
        newNotes[existingIdx].note = noteText;
      } else {
        newNotes.push({ dateStr: currentNoteDateStr, note: noteText });
      }
      setLocalNotes(newNotes);
      localStorage.setItem("mbr_daily_notes", JSON.stringify(newNotes));
      toast.success("Note saved locally!");
    }
  };

  const applyNumericLog = useCallback((habitId: number, dateStr: string, value: number, target: number) => {
    const isCompleted = value >= target;

    setOptimisticLogs(prev => {
      const existing = prev.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
      if (existing) {
        return prev.map(l => l === existing ? { ...l, completed: isCompleted, numericValue: value } : l);
      }
      return [...prev, { userHabitId: habitId, dateStr, completed: isCompleted, numericValue: value }];
    });

    if (isAuthenticated) {
      toggleLogMutation.mutate({ userHabitId: habitId, dateStr, completed: isCompleted, numericValue: value });
    } else {
      setLocalLogs(prev => {
        const newLogs = [...prev];
        const existingIdx = newLogs.findIndex(l => l.userHabitId === habitId && l.dateStr === dateStr);
        if (existingIdx >= 0) {
          newLogs[existingIdx].completed = isCompleted;
          newLogs[existingIdx].numericValue = value;
        } else {
          newLogs.push({ userHabitId: habitId, dateStr, completed: isCompleted, numericValue: value });
        }
        localStorage.setItem("mbr_habit_logs", JSON.stringify(newLogs));
        return newLogs;
      });
    }
  }, [isAuthenticated, toggleLogMutation]);

  const logNumericHabit = (habitId: number, dateStr: string, value: number, target: number) => {
    const isCompleted = value >= target;
    setOptimisticLogs(prev => {
      const existing = prev.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
      if (existing) {
        return prev.map(l => l === existing ? { ...l, completed: isCompleted, numericValue: value } : l);
      }
      return [...prev, { userHabitId: habitId, dateStr, completed: isCompleted, numericValue: value }];
    });

    const key = `${habitId}-${dateStr}`;
    if (numericDebounceRef.current[key]) {
      clearTimeout(numericDebounceRef.current[key]);
    }
    numericDebounceRef.current[key] = setTimeout(() => {
      applyNumericLog(habitId, dateStr, value, target);
      delete numericDebounceRef.current[key];
    }, 300);
  };

  const maybeDay1Celebrate = (completed: boolean) => {
    if (!completed) return;
    try {
      if (!localStorage.getItem("mbr_day1_complete")) {
        localStorage.setItem("mbr_day1_complete", "1");
        trackFunnel.mutate({ eventType: "day1_complete", deviceId: getDeviceId() });
        if (!localStorage.getItem("mbr_day1_modal_seen")) {
          setShowDay1Modal(true);
        }
      }
    } catch {
      /* ignore */
    }
  };

  const toggleLog = (habitId: number, dateStr: string) => {
    const isCompleted = isLogCompleted(habitId, dateStr);
    const newCompleted = !isCompleted;

    // Optimistic Update
    setOptimisticLogs(prev => {
      const existing = prev.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
      if (existing) {
        return prev.map(l => l === existing ? { ...l, completed: newCompleted } : l);
      }
      return [...prev, { userHabitId: habitId, dateStr, completed: newCompleted }];
    });

    if (isAuthenticated) {
      toggleLogMutation.mutate({ userHabitId: habitId, dateStr, completed: newCompleted });
    } else {
      let newLogs = [...localLogs];
      const existingIdx = newLogs.findIndex(l => l.userHabitId === habitId && l.dateStr === dateStr);
      if (existingIdx >= 0) {
        newLogs[existingIdx].completed = newCompleted;
      } else {
        newLogs.push({ userHabitId: habitId, dateStr, completed: newCompleted });
      }
      setLocalLogs(newLogs);
      localStorage.setItem("mbr_habit_logs", JSON.stringify(newLogs));
    }
    maybeDay1Celebrate(newCompleted);
  };

  const isLogCompleted = (habitId: number, dateStr: string) => {
    const opt = optimisticLogs.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
    if (opt) return opt.completed;
    return logs.some(l => l.userHabitId === habitId && l.dateStr === dateStr && l.completed);
  };

  const getNumericValue = (habitId: number, dateStr: string) => {
    const opt = optimisticLogs.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
    if (opt && opt.numericValue !== undefined) return opt.numericValue;
    const existingLog = logs.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
    return existingLog?.numericValue || 0;
  };

  const currentStreak = (() => {
    // Build completed-day set using isLogCompleted (includes optimistic toggles)
    const completed = new Set<string>();
    const todayStr = todayMountainDateStr();
    let probe = parseCalendarDate(todayStr);
    for (let i = 0; i < 400; i++) {
      const dStr = calendarDateStr(probe);
      if (activeHabits.some((h) => isLogCompleted(h.id, dStr))) completed.add(dStr);
      probe = subDays(probe, 1);
    }
    return calculateCurrentStreak(completed);
  })();

  // Generate 7 days around currentDate (Denver-anchored)
  const days = Array.from({ length: 7 }).map((_, i) => subDays(currentDate, 3 - i));
  const isSelectedDate = (day: Date) => calendarDateStr(day) === calendarDateStr(selectedDate);

  const getChallengeProgress = (challengeId: number) => {
    const uc = userChallengesData?.challenges?.find(u => u.challengeId === challengeId);
    if (!uc) return 0;
    const logs = userChallengesData?.logs?.filter(l => l.userChallengeId === uc.id) || [];
    return logs.length;
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen text-gray-900" style={{ background: "#faf5f5" }}>
      {/* Import local data prompt */}
      {showImportPrompt && isAuthenticated && (
        <div className="py-3 px-4 text-center text-sm flex flex-col sm:flex-row items-center justify-center gap-3" style={{ background: "#2d3b2d", color: "white" }}>
          <span>We found tracker data on this device (habits, workouts, and/or meals). Import to your account?</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isImporting}
              onClick={handleImportLocalData}
              className="rounded-full"
              style={{ background: "#c9a96e", color: "white" }}
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                localStorage.setItem("mbr_import_dismissed", "1");
                setShowImportPrompt(false);
              }}
              className="rounded-full border-white/40 text-white hover:bg-white/10"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Banner */}
      {!isAuthenticated && (
        <div className="py-2 px-4 text-center text-sm flex items-center justify-center gap-2 relative" style={{ background: "#c9a96e", color: "white" }}>
          <Info size={16} />
          <span>You are tracking on this device only. <Link href="/login?returnTo=/habit-tracker" className="underline font-bold">Sign in</Link> to sync across all devices!</span>
        </div>
      )}

      {/* Compact ritual header */}
      <div className="pt-5 pb-3 px-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">
              Today · {format(parseCalendarDate(todayMountainDateStr()), "MMM d")}
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
              My Daily Reset
            </h1>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shrink-0"
            style={{
              background: currentStreak >= 3 ? "linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)" : "#fcfaf9",
              color: currentStreak >= 3 ? "#d97706" : "#8a9a8a",
              border: currentStreak >= 3 ? "1px solid #ffda6a" : "1px solid #f0e8e4",
            }}
          >
            <Flame size={16} className={currentStreak >= 3 ? "animate-pulse" : ""} style={{ fill: currentStreak >= 3 ? "#d97706" : "transparent" }} />
            {currentStreak}
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <div className="bg-white p-1 rounded-full flex gap-1 shadow-sm border border-slate-100">
            <button onClick={() => setMainTab("daily")} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${mainTab === "daily" ? "bg-[#2d3b2d] text-white shadow-md" : "text-gray-500 hover:bg-slate-50"}`}>
              Today
            </button>
            <button onClick={() => setMainTab("progress")} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${mainTab === "progress" ? "bg-[#2d3b2d] text-white shadow-md" : "text-gray-500 hover:bg-slate-50"}`}>
              Progress
            </button>
          </div>
        </div>
      </div>

      <OnboardingPackModal isAuthenticated={isAuthenticated} onApplied={() => refetchUserSync()} />

      {/* Day-1 install / push modal */}
      {showDay1Modal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" style={{ border: "1px solid #f0e8e4" }}>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
              First win logged 🎉
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Want this to stick? Add the app icon and enable gentle reminders — so future you shows up tomorrow.
            </p>
            <div className="space-y-3 mb-4">
              <HabitTrackerInstallPrompt variant="button" />
              {isSupported && !isSubscribed && (
                <Button
                  className="w-full rounded-full"
                  style={{ background: "#c9a96e", color: "white" }}
                  disabled={isSubscribing}
                  onClick={() => {
                    subscribeToPush();
                    trackFunnel.mutate({ eventType: "push_enabled", deviceId: getDeviceId() });
                  }}
                >
                  {isSubscribing ? "Enabling…" : "Enable reminders"}
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full text-gray-500"
              onClick={() => {
                localStorage.setItem("mbr_day1_modal_seen", "1");
                setShowDay1Modal(false);
              }}
            >
              Not now
            </Button>
          </div>
        </div>
      )}

      {mainTab === "daily" && (
        <div className="max-w-lg mx-auto px-4 space-y-4">
          {isAuthenticated && weeklyInsight && (
            <PatternInsightCard insight={weeklyInsight} compact />
          )}

          {/* Collapsed coach updates */}
        {updatesData && updatesData.length > 0 && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowUpdates(!showUpdates)}
              className="w-full flex justify-between items-center p-3 rounded-2xl bg-white border"
              style={{ borderColor: "#f0e8e4" }}
            >
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: "#2d3b2d" }}>
                <Megaphone size={16} style={{ color: "#c9a96e" }} />
                From Lee Anne
                <span className="text-xs font-normal text-gray-400">
                  ({updatesData.filter(u => !dismissedUpdates.includes(u.id)).length})
                </span>
              </h3>
              <span className="text-[#8a9a8a] text-sm font-bold">{showUpdates ? "−" : "+"}</span>
            </button>
          {showUpdates && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                <Megaphone size={24} style={{ color: "#c9a96e" }} />
                Coach Updates
              </h3>
              {dismissedUpdates.length > 0 && (
                <button 
                  onClick={() => setShowDismissed(!showDismissed)}
                  className="text-sm font-medium transition-colors"
                  style={{ color: "#8a9a8a" }}
                >
                  {showDismissed ? "Hide Dismissed" : `View Dismissed (${dismissedUpdates.length})`}
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {updatesData.filter(u => showDismissed ? true : !dismissedUpdates.includes(u.id)).length === 0 && (
                <p className="text-gray-500 text-sm italic">You are all caught up on updates!</p>
              )}
              {updatesData.filter(u => showDismissed ? true : !dismissedUpdates.includes(u.id)).map(update => {
                let isYouTube = false;
                let videoId = null;
                let embedUrl = null;

                if (update.videoUrl) {
                  const ytMatch = update.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                  if (ytMatch && ytMatch[1]) {
                    isYouTube = true;
                    videoId = ytMatch[1];
                  } else {
                    const vimeoMatch = update.videoUrl.match(/vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/i);
                    if (vimeoMatch && vimeoMatch[1]) {
                      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
                    }
                  }
                }

                return (
                  <motion.div key={update.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-md overflow-hidden p-6 md:p-8 border relative" style={{ borderColor: "#f0e8e4", opacity: dismissedUpdates.includes(update.id) ? 0.6 : 1 }}>
                    {!dismissedUpdates.includes(update.id) && (
                      <button 
                        onClick={() => handleDismissUpdate(update.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="Dismiss Update"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    )}
                    {dismissedUpdates.includes(update.id) && (
                      <div className="absolute top-4 right-4 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        Dismissed
                      </div>
                    )}
                    <div className="text-xs font-bold px-2 py-1 rounded-full mb-3 inline-block" style={{ background: "#f0e8e4", color: "#8a9a8a" }}>
                      {format(new Date(update.createdAt), "MMMM d, yyyy")}
                    </div>
                    <h4 className="font-bold text-2xl mb-3" style={{ color: "#2d3b2d" }}>{update.title}</h4>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed mb-6">{update.message}</p>
                    
                    {isYouTube && videoId && (
                      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-black" style={{ paddingTop: '56.25%' }}>
                        <iframe 
                          src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=0`} 
                          className="absolute top-0 left-0 w-full h-full"
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}

                    {!isYouTube && embedUrl && (
                      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm" style={{ paddingTop: '56.25%' }}>
                        <iframe 
                          src={embedUrl} 
                          className="absolute top-0 left-0 w-full h-full"
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
          )}
          </div>
        )}

        {mainTab === "daily" && <ChallengeTodayCard />}

        {/* Featured / joined challenge chips (always visible) */}
        {activeChallengesData && activeChallengesData.length > 0 && (() => {
          const featured = activeChallengesData.filter(
            (c: any) => c.isFeatured || userChallengesData?.challenges?.some((u) => u.challengeId === c.id)
          );
          const chips = featured.length > 0 ? featured.slice(0, 3) : activeChallengesData.slice(0, 2);
          return (
            <div className="flex flex-wrap gap-2">
              {chips.map((challenge: any) => {
                const uc = userChallengesData?.challenges?.find((u) => u.challengeId === challenge.id);
                const joined = !!uc;
                const todayStr = todayMountainDateStr();
                const doneToday =
                  joined &&
                  (userChallengesData?.logs || []).some(
                    (l) => l.userChallengeId === uc.id && l.dateStr === todayStr
                  );
                return (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() => {
                      if (!joined) {
                        joinChallengeMutation.mutate({
                          challengeId: challenge.id,
                          deviceId: getDeviceId(),
                        });
                      } else if (!doneToday) {
                        toggleChallengeLogMutation.mutate({
                          userChallengeId: uc.id,
                          dateStr: todayStr,
                          completed: true,
                          deviceId: getDeviceId(),
                        });
                      } else {
                        setShowChallenges(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all"
                    style={{
                      borderColor: doneToday ? "#a7f3d0" : joined ? "#c9a96e" : "#f0e8e4",
                      background: doneToday ? "#ecfdf5" : joined ? "#faf5f5" : "white",
                      color: "#2d3b2d",
                    }}
                  >
                    <Target size={12} style={{ color: "#c9a96e" }} />
                    {doneToday ? "✓ " : joined ? "" : "+ "}
                    {challenge.title}
                    {challenge.linkedPodcastSlug ? " · 🎧" : ""}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Challenges — full list collapsed by default */}
        {activeChallengesData && activeChallengesData.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowChallenges(!showChallenges)}
              className="w-full flex justify-between items-center p-3 rounded-2xl bg-white border"
              style={{ borderColor: "#f0e8e4" }}
            >
              <span className="font-bold text-sm flex items-center gap-2" style={{ color: "#2d3b2d" }}>
                <Target size={16} style={{ color: "#c9a96e" }} />
                All challenges
              </span>
              <span className="text-[#8a9a8a] text-sm font-bold">{showChallenges ? "−" : "+"}</span>
            </button>
          {showChallenges && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl shadow-xl overflow-hidden p-6 md:p-8" style={{ border: "1px solid #f0e8e4" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="font-bold text-xl flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                <Target size={24} style={{ color: "#c9a96e" }} />
                Challenges
              </h3>
              <div className="flex bg-gray-100 p-1 rounded-full w-fit">
                <button 
                  onClick={() => setChallengeTab("active")}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${challengeTab === "active" ? "bg-white shadow-sm text-[#2d3b2d]" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setChallengeTab("completed")}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${challengeTab === "completed" ? "bg-white shadow-sm text-[#2d3b2d]" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Completed
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallengesData.filter(challenge => {
                const uc = userChallengesData?.challenges?.find(u => u.challengeId === challenge.id);
                const progress = uc ? getChallengeProgress(challenge.id) : 0;
                const isJoined = !!uc;
                const percent = isJoined && progress !== null ? Math.min(100, Math.round((progress / challenge.durationDays) * 100)) : 0;
                const isCompleted = percent === 100;
                return challengeTab === "active" ? !isCompleted : isCompleted;
              }).map(challenge => {
                const uc = userChallengesData?.challenges?.find(u => u.challengeId === challenge.id);
                const progress = uc ? getChallengeProgress(challenge.id) : 0;
                const isJoined = !!uc;
                const percent = isJoined && progress !== null ? Math.min(100, Math.round((progress / challenge.durationDays) * 100)) : 0;
                
                const todayStr = todayMountainDateStr();
                const logs = userChallengesData?.logs?.filter(l => l.userChallengeId === uc?.id) || [];
                const isCompletedToday = logs.some(l => l.dateStr === todayStr);

                return (
                  <div key={challenge.id} className="p-5 rounded-2xl border transition-all flex flex-col h-full" style={{ background: isJoined ? "#faf5f5" : "white", borderColor: "#f0e8e4" }}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg" style={{ color: "#2d3b2d" }}>{challenge.title}</h4>
                      {!isJoined ? (
                        <Button 
                          size="sm" 
                          onClick={() => joinChallengeMutation.mutate({ challengeId: challenge.id, deviceId: getDeviceId() })}
                          disabled={joinChallengeMutation.isPending}
                          className="rounded-full h-8 shrink-0 ml-2" style={{ background: "#c9a96e", color: "white" }}>
                          <Plus size={16} className="mr-1" /> Join
                        </Button>
                      ) : (
                        <div className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0 ml-2" style={{ background: isCompletedToday ? "#d4ecd4" : "#f0e8e4", color: isCompletedToday ? "#2d5a2d" : "#8a9a8a" }}>
                          {isCompletedToday ? <><Check size={12} /> Done Today</> : "Joined"}
                        </div>
                      )}
                    </div>
                    {challenge.description && <p className="text-sm text-gray-500 mb-4">{challenge.description}</p>}
                    
                    {isJoined && (
                      <div className="mt-auto pt-4 space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1" style={{ color: "#8a9a8a" }}>
                            <span>{progress} of {challenge.durationDays} Days Completed</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#f0e8e4" }}>
                            <div className="h-full transition-all duration-1000" style={{ width: `${percent}%`, background: "#c9a96e" }} />
                          </div>
                        </div>
                        
                        {percent < 100 && (
                          <Button
                            className="w-full rounded-xl font-bold border-2 mt-2"
                            variant={isCompletedToday ? "outline" : "default"}
                            disabled={toggleChallengeLogMutation.isPending}
                            style={{
                              background: isCompletedToday ? "transparent" : "#c9a96e",
                              color: isCompletedToday ? "#c9a96e" : "white",
                              borderColor: "#c9a96e"
                            }}
                            onClick={() => toggleChallengeLogMutation.mutate({
                              userChallengeId: uc.id,
                              dateStr: todayStr,
                              completed: !isCompletedToday,
                              deviceId: getDeviceId(),
                            })}
                          >
                            {isCompletedToday ? "Completed for Today!" : "Complete for Today"}
                          </Button>
                        )}
                        {percent === 100 && (
                          <div className="w-full py-2 text-center rounded-xl font-bold text-sm" style={{ background: "#d4ecd4", color: "#2d5a2d" }}>
                            🎉 Challenge Completed!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {challengeTab === "completed" && activeChallengesData.filter(c => {
                const uc = userChallengesData?.challenges?.find(u => u.challengeId === c.id);
                const progress = uc ? getChallengeProgress(c.id) : 0;
                return uc && Math.min(100, Math.round((progress / c.durationDays) * 100)) === 100;
            }).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6">No completed challenges yet. Keep going!</p>
            )}

            {challengeTab === "active" && activeChallengesData.filter(c => {
                const uc = userChallengesData?.challenges?.find(u => u.challengeId === c.id);
                const progress = uc ? getChallengeProgress(c.id) : 0;
                return !uc || Math.min(100, Math.round((progress / c.durationDays) * 100)) < 100;
            }).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6">You've completed all active challenges! 🎉</p>
            )}
          </motion.div>
          )}
          </>
        )}

        {/* Main Tracker Card — today first */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-5 md:p-6" style={{ border: "1px solid #f0e8e4" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" style={{ color: "#2d3b2d" }}>
              Today&apos;s habits
            </h3>
            <button
              type="button"
              onClick={() => setShowPastDays(!showPastDays)}
              className="text-xs font-bold text-[#8a9a8a] hover:text-[#2d3b2d]"
            >
              {showPastDays ? "Hide calendar" : "Edit past days"}
            </button>
          </div>
          
          {/* Date Navigator — collapsed unless past-days mode */}
          {showPastDays && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: "#f0e8e4" }}>
            <Button variant="ghost" onClick={() => setCurrentDate(subDays(currentDate, 7))} className="rounded-full hover:opacity-80 transition-opacity" style={{ color: "#c9a96e" }}>
              &larr; <span className="hidden md:inline ml-1">Prev Week</span>
            </Button>
            <div className="font-bold text-lg md:text-xl flex items-center gap-2" style={{ color: "#2d3b2d" }}>
              <CalendarIcon size={20} style={{ color: "#c9a96e" }} />
              {format(days[0], "MMM d")} - {format(days[6], "MMM d, yyyy")}
            </div>
            <Button variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="rounded-full hover:opacity-80 transition-opacity" style={{ color: "#c9a96e" }}>
              <span className="hidden md:inline mr-1">Next Week</span> &rarr;
            </Button>
          </div>
          )}

          {/* Desktop Weekly Grid View — only in past-days mode */}
          {showPastDays && (
          <div className="hidden md:block overflow-x-auto mb-4">
            <div className="min-w-[600px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="col-span-1"></div>
                {days.map(day => {
                  const isToday = calendarDateStr(day) === todayMountainDateStr();
                  const isSelected = isSelectedDate(day);
                  return (
                    <button 
                      key={day.toISOString()} 
                      onClick={() => setSelectedDate(day)}
                      className={`text-center py-2 px-1 rounded-xl transition-colors active:scale-95 ${isSelected ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                      style={{ background: isSelected ? "#fcfaf9" : "transparent", border: isSelected ? "1px solid #f0e8e4" : "1px solid transparent" }}
                    >
                      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8a9a8a" }}>{format(day, "EEE")}</div>
                      <div className={`text-sm font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full`} style={{ background: isToday ? "#c9a96e" : "transparent", color: isToday ? "white" : "#2d3b2d" }}>
                        {format(day, "d")}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Habits Rows */}
              <div className="space-y-4">
                {activeHabits.map((habit, index) => (
                  <motion.div 
                    key={habit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="grid grid-cols-8 gap-2 items-center p-2 rounded-2xl transition-colors"
                    style={{ background: "#faf5f5" }}
                  >
                    <div className="col-span-1 pr-2">
                      <div className="font-semibold text-sm leading-tight" style={{ color: "#2d3b2d" }}>
                        {habit.title}
                      </div>
                      {habit.description && (
                        <p className="text-xs font-normal text-gray-500 mt-1 leading-snug">{habit.description}</p>
                      )}
                    </div>
                    {days.map(day => {
                      const dateStr = calendarDateStr(day);
                      const completed = isLogCompleted(habit.id, dateStr);
                      const isSelected = isSelectedDate(day);

                      if (habit.type === "numeric") {
                        const val = getNumericValue(habit.id, dateStr) || 0;
                        const target = habit.targetValue || 100;
                        return (
                          <div key={dateStr} className={`flex flex-col items-center justify-center rounded-xl py-1 gap-1 ${isSelected ? 'bg-white/50 shadow-sm' : ''}`}>
                            <input
                              type="number"
                              min={0}
                              value={val || ""}
                              onChange={(e) => logNumericHabit(habit.id, dateStr, parseInt(e.target.value) || 0, target)}
                              className="w-12 h-8 text-center text-xs rounded-lg border focus:outline-none focus:ring-1 bg-white text-black"
                              style={{ borderColor: "#e8e8e8" }}
                            />
                            <span className={`text-[9px] font-bold ${completed ? 'text-[#c9a96e]' : 'text-gray-400'}`}>
                              {habit.unit || ""}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={dateStr} className={`flex justify-center rounded-xl py-1 ${isSelected ? 'bg-white/50 shadow-sm' : ''}`}>
                          <button
                            onClick={() => toggleLog(habit.id, dateStr)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              completed 
                                ? 'text-white shadow-md scale-110' 
                                : 'bg-white text-transparent hover:scale-105'
                            }`}
                            style={{ 
                              background: completed ? "linear-gradient(135deg, #c9a96e 0%, #e8c99a 100%)" : "white",
                              border: completed ? "none" : "2px solid #f0e8e4"
                            }}
                          >
                            <Check size={20} strokeWidth={completed ? 3 : 2} className={completed ? 'opacity-100' : 'opacity-0'} />
                          </button>
                        </div>
                      );
                    })}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Day strip when editing past days */}
          {showPastDays && (
            <div className="flex overflow-x-auto gap-2 mb-4 pb-2 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {days.map(day => {
                const isSelected = isSelectedDate(day);
                const isToday = calendarDateStr(day) === todayMountainDateStr();
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-w-[64px] snap-center p-3 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 ${isSelected ? 'shadow-md scale-105' : 'opacity-70 hover:opacity-100'}`}
                    style={{ background: isSelected ? "#faf5f5" : "transparent", border: isSelected ? "1px solid #f0e8e4" : "1px solid transparent" }}
                  >
                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isSelected ? 'text-[#c9a96e]' : 'text-[#8a9a8a]'}`}>
                      {format(day, "EEE")}
                    </div>
                    <div className={`text-sm font-bold w-10 h-10 flex items-center justify-center rounded-full shadow-sm`} style={{ background: isToday ? "#c9a96e" : (isSelected ? "white" : "transparent"), color: isToday ? "white" : "#2d3b2d" }}>
                      {format(day, "d")}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Vertical habits list for selected date (today by default) */}
          <div className="space-y-3">
              {showPastDays && (
              <h3 className="font-bold text-sm mb-2 text-center text-gray-500">
                Habits for {format(selectedDate, "MMM d")}
              </h3>
              )}
              {activeHabits.map((habit, index) => {
                const completed = isLogCompleted(habit.id, currentNoteDateStr);
                
                if (habit.type === "numeric") {
                  const val = getNumericValue(habit.id, currentNoteDateStr) || 0;
                  const target = habit.targetValue || 100;
                  const pct = Math.min(100, Math.round((val / target) * 100));
                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-full flex flex-col p-5 rounded-2xl shadow-sm transition-all"
                      style={{ background: completed ? "linear-gradient(135deg, #c9a96e 0%, #e8c99a 100%)" : "#faf5f5", border: completed ? "none" : "1px solid #f0e8e4" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 text-left pr-4">
                          <div className={`font-semibold ${completed ? 'text-white' : 'text-[#2d3b2d]'}`}>{habit.title}</div>
                          {habit.description && (
                            <div className={`text-xs mt-1 ${completed ? 'text-white/80' : 'text-gray-500'}`}>{habit.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            min={0}
                            value={val || ""}
                            onChange={(e) => logNumericHabit(habit.id, currentNoteDateStr, parseInt(e.target.value) || 0, target)}
                            className="w-16 h-8 text-center rounded-lg border focus:outline-none focus:ring-1 bg-white text-black"
                            style={{ borderColor: "#e8e8e8", outline: "none" }}
                          />
                          <span className={`text-sm font-bold ${completed ? 'text-white' : 'text-[#2d3b2d]'}`}>{habit.unit || ""}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden mt-1" style={{ background: completed ? "rgba(255,255,255,0.3)" : "#e8e8e8" }}>
                        <div className="h-full transition-all" style={{ width: `${pct}%`, background: completed ? "white" : "#c9a96e" }} />
                      </div>
                      <div className={`text-xs text-right mt-1 font-bold ${completed ? 'text-white' : 'text-gray-500'}`}>
                        {val} / {target} {habit.unit || ""}
                      </div>
                    </motion.div>
                  )
                }

                return (
                  <motion.button
                    key={habit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleLog(habit.id, currentNoteDateStr)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl shadow-sm transition-all active:scale-95"
                    style={{ background: completed ? "linear-gradient(135deg, #c9a96e 0%, #e8c99a 100%)" : "#faf5f5", border: completed ? "none" : "1px solid #f0e8e4" }}
                  >
                    <div className="flex-1 text-left pr-4">
                      <div className={`font-semibold ${completed ? 'text-white' : 'text-[#2d3b2d]'}`}>{habit.title}</div>
                      {habit.description && (
                        <div className={`text-xs mt-1 ${completed ? 'text-white/80' : 'text-gray-500'}`}>{habit.description}</div>
                      )}
                    </div>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-inner ${completed ? 'bg-white/20' : 'bg-white border border-[#e8e8e8]'}`}>
                      <Check size={18} strokeWidth={completed ? 3 : 0} className={completed ? 'text-white' : 'text-transparent'} />
                    </div>
                  </motion.button>
                )
              })}
            </div>

          {/* Daily Notes Section (Both Mobile & Desktop) */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "#f0e8e4" }}>
            <button 
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="w-full flex items-center justify-between hover:bg-[#faf5f5] p-3 rounded-2xl transition-colors"
            >
              <div className="text-left">
                <h3 className="font-bold text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                  Daily Notes
                </h3>
                <p className="text-sm text-gray-500 mt-1">Reflect on your day for {format(selectedDate, "MMM d")}.</p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isNotesExpanded ? 'rotate-180' : ''}`} style={{ background: "#f0e8e4", color: "#2d3b2d" }}>
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            
            <AnimatePresence>
              {isNotesExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 px-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="How are you feeling today?"
                      className="w-full h-32 md:h-40 p-5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 transition-all resize-none shadow-inner text-base"
                      style={{ borderColor: "#f0e8e4", background: "#fcfaf9", color: "#2d3b2d" }}
                    />
                    <div className="mt-4 flex justify-end">
                      <Button 
                        onClick={handleSaveNote} 
                        disabled={saveNoteMutation.isPending} 
                        className="rounded-full px-8 py-6 shadow-md hover:shadow-lg transition-all" 
                        style={{ background: "#c9a96e", color: "white" }}
                      >
                        {saveNoteMutation.isPending ? "Saving..." : "Save Note"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

          <VictoryListCard
            dateStr={currentNoteDateStr}
            isAuthenticated={isAuthenticated}
            autoFocus={focusVictories}
          />
        </div>
      )}

      {mainTab === "progress" && (
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {isAuthenticated && weeklyInsight && (
            <PatternInsightCard insight={weeklyInsight} />
          )}
          <HabitProgressTab
            logs={logs}
            activeHabits={activeHabits}
            notes={notes}
            currentStreak={currentStreak}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}

      {/* Compact CTA */}
      <div className="mt-10 mb-4 max-w-lg mx-auto text-center px-4">
        <p className="text-xs text-gray-400">
          Want coaching support?{" "}
          <Link href="/book" className="font-bold underline" style={{ color: "#c9a96e" }}>
            Book a free call
          </Link>
        </p>
      </div>
    </div>
  );
}
