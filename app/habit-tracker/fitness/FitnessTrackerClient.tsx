"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import InteractiveVideoPlayer from "@/components/InteractiveVideoPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Trash2,
  Dumbbell,
  PlayCircle,
  Info,
  ArrowLeft,
  CheckCircle,
  Filter,
  Footprints,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";
import { todayMountainDateStr } from "@/lib/mountainTime";
import { calendarDateStr, parseCalendarDate } from "@/lib/habitStreak";

const LOCAL_KEY = "mbr_fitness_logs";

type LocalFitnessLog = {
  id: number;
  dateStr: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  durationMinutes: number;
};

const QUICK_CHIPS: {
  id: string;
  label: string;
  name: string;
  minutes: number;
  icon: "walk" | "strength" | "stretch" | "other";
}[] = [
  { id: "walk10", label: "Walk 10m", name: "Walk", minutes: 10, icon: "walk" },
  { id: "walk20", label: "Walk 20m", name: "Walk", minutes: 20, icon: "walk" },
  { id: "strength", label: "Strength", name: "Strength training", minutes: 20, icon: "strength" },
  { id: "stretch", label: "Stretch / yoga", name: "Stretch / yoga", minutes: 10, icon: "stretch" },
  { id: "other", label: "Other", name: "Movement", minutes: 15, icon: "other" },
];

function loadLocalLogs(): LocalFitnessLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(logs: LocalFitnessLog[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(logs));
}

function addDaysToDateStr(dateStr: string, delta: number): string {
  return calendarDateStr(addDays(parseCalendarDate(dateStr), delta));
}

export default function FitnessTrackerClient() {
  usePageTitle({
    title: "Fitness Tracker | Mind & Body Reset Coaches",
    description: "Log your workouts and explore our video library.",
  });

  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [dateStr, setDateStr] = useState(todayMountainDateStr);
  const [activeTab, setActiveTab] = useState<"log" | "videos">("log");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [localLogs, setLocalLogs] = useState<LocalFitnessLog[]>([]);
  const [mounted, setMounted] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");

  useEffect(() => {
    setMounted(true);
    setLocalLogs(loadLocalLogs());
  }, []);

  const { data: serverLogs, refetch: refetchLogs } = trpc.fitness.getLogs.useQuery(
    { dateStr },
    { enabled: isAuthenticated && activeTab === "log" }
  );

  const { data: videos } = trpc.fitness.getVideos.useQuery(undefined, {
    enabled: activeTab === "videos" || !!selectedVideo || activeTab === "log",
  });

  const addLogMutation = trpc.fitness.addLog.useMutation({
    onSuccess: () => {
      toast.success("Logged — movement counts!");
      refetchLogs();
      utils.habit.getUserHabits.invalidate();
      utils.challenges.getUserChallenges.invalidate();
      setIsAdding(false);
      setShowDetails(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLogMutation = trpc.fitness.deleteLog.useMutation({
    onSuccess: () => {
      toast.success("Removed");
      refetchLogs();
      utils.habit.getUserHabits.invalidate();
      utils.challenges.getUserChallenges.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setExerciseName("");
    setSets("");
    setReps("");
    setWeight("");
    setDurationMinutes("");
  };

  const dayLogs: Array<{
    id: number;
    exerciseName: string;
    sets: number;
    reps: number;
    weight: number;
    durationMinutes: number;
    local?: boolean;
  }> = useMemo(() => {
    if (isAuthenticated) {
      return (serverLogs || []).map((l) => ({
        id: l.id,
        exerciseName: l.exerciseName,
        sets: l.sets,
        reps: l.reps,
        weight: l.weight,
        durationMinutes: l.durationMinutes,
      }));
    }
    return localLogs
      .filter((l) => l.dateStr === dateStr)
      .map((l) => ({ ...l, local: true }));
  }, [isAuthenticated, serverLogs, localLogs, dateStr]);

  const minutesToday = dayLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0);
  const isToday = dateStr === todayMountainDateStr();

  const saveLog = useCallback(
    (payload: {
      exerciseName: string;
      sets?: number;
      reps?: number;
      weight?: number;
      durationMinutes?: number;
    }) => {
      const body = {
        dateStr,
        exerciseName: payload.exerciseName,
        sets: payload.sets ?? 1,
        reps: payload.reps ?? 0,
        weight: payload.weight ?? 0,
        durationMinutes: payload.durationMinutes ?? 0,
      };

      if (isAuthenticated) {
        addLogMutation.mutate(body);
        return;
      }

      // Guest: local device log
      const next: LocalFitnessLog = {
        id: Date.now(),
        ...body,
      };
      const updated = [next, ...loadLocalLogs()];
      saveLocalLogs(updated);
      setLocalLogs(updated);
      toast.success("Logged on this device — sign in to sync");
      setIsAdding(false);
      setShowDetails(false);
      resetForm();
    },
    [dateStr, isAuthenticated, addLogMutation]
  );

  const handleQuickChip = (chip: (typeof QUICK_CHIPS)[number]) => {
    if (chip.id === "other") {
      setIsAdding(true);
      setShowDetails(false);
      setExerciseName("");
      setDurationMinutes("15");
      return;
    }
    saveLog({
      exerciseName: chip.name,
      durationMinutes: chip.minutes,
      sets: 1,
      reps: 0,
      weight: 0,
    });
  };

  const handleSaveDetailed = () => {
    if (!exerciseName.trim()) return toast.error("What did you do?");
    saveLog({
      exerciseName: exerciseName.trim(),
      sets: parseInt(sets, 10) || 1,
      reps: parseInt(reps, 10) || 0,
      weight: parseInt(weight, 10) || 0,
      durationMinutes: parseInt(durationMinutes, 10) || 0,
    });
  };

  const handleDelete = (id: number) => {
    if (isAuthenticated) {
      deleteLogMutation.mutate({ id, dateStr });
      return;
    }
    const updated = loadLocalLogs().filter((l) => l.id !== id);
    saveLocalLogs(updated);
    setLocalLogs(updated);
    toast.success("Removed");
  };

  const handleMarkWorkoutComplete = (video: any) => {
    let estimatedDuration = 0;
    try {
      if (video.intervalsJson) {
        const intervals = JSON.parse(video.intervalsJson);
        if (intervals.length > 0) {
          const lastInterval = intervals[intervals.length - 1];
          estimatedDuration = Math.ceil(lastInterval.endTime / 60);
        }
      }
    } catch {
      /* ignore */
    }

    const today = todayMountainDateStr();
    // Temporarily log for today even if browsing a past date
    const prev = dateStr;
    if (isAuthenticated) {
      addLogMutation.mutate({
        dateStr: today,
        exerciseName: `${video.title} (${video.category})`,
        sets: 1,
        reps: 0,
        weight: 0,
        durationMinutes: estimatedDuration || 30,
      });
    } else {
      const next: LocalFitnessLog = {
        id: Date.now(),
        dateStr: today,
        exerciseName: `${video.title} (${video.category})`,
        sets: 1,
        reps: 0,
        weight: 0,
        durationMinutes: estimatedDuration || 30,
      };
      const updated = [next, ...loadLocalLogs()];
      saveLocalLogs(updated);
      setLocalLogs(updated);
      toast.success("Workout logged on this device");
    }
    setSelectedVideo(null);
    setActiveTab("log");
    setDateStr(today);
    void prev;
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    );
    return match ? match[1] : null;
  };

  const categories = Array.from(new Set(videos?.map((v) => v.category) || []));
  const filteredVideos =
    selectedCategory === "All"
      ? videos || []
      : (videos || []).filter((v) => v.category === selectedCategory);
  const featuredVideos = (videos || []).slice(0, 2);

  if (!mounted) {
    return <div className="min-h-screen bg-[#faf5f5]" />;
  }

  // --- Detailed Video Workout View ---
  if (selectedVideo) {
    return (
      <div className="min-h-screen text-gray-900 pb-28" style={{ background: "#faf5f5" }}>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <button
            onClick={() => setSelectedVideo(null)}
            className="flex items-center gap-2 text-sm font-bold hover:opacity-70 transition-opacity"
            style={{ color: "#c9a96e" }}
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div
            className="bg-white rounded-3xl overflow-hidden shadow-lg border"
            style={{ borderColor: "#f0e8e4" }}
          >
            <InteractiveVideoPlayer
              videoUrl={selectedVideo.videoUrl}
              intervalsJson={selectedVideo.intervalsJson}
            />
          </div>

          <div
            className="bg-white rounded-3xl p-5 shadow-sm border"
            style={{ borderColor: "#f0e8e4" }}
          >
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
              style={{ background: "#f0e8e4", color: "#2d3b2d" }}
            >
              {selectedVideo.category}
            </span>
            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
            >
              {selectedVideo.title}
            </h2>
            {selectedVideo.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{selectedVideo.description}</p>
            )}
          </div>

          <Button
            onClick={() => handleMarkWorkoutComplete(selectedVideo)}
            disabled={addLogMutation.isPending}
            className="w-full rounded-2xl py-6 text-base font-bold shadow-lg"
            style={{ background: "#2d3b2d", color: "white" }}
          >
            <CheckCircle size={22} className="mr-2" />
            {addLogMutation.isPending ? "Logging…" : "Mark complete"}
          </Button>
          {!isAuthenticated && (
            <p className="text-center text-xs text-gray-400">
              Saves on this device.{" "}
              <Link href="/login?returnTo=/habit-tracker/fitness" className="underline font-semibold">
                Sign in
              </Link>{" "}
              to sync.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 pb-28" style={{ background: "#faf5f5" }}>
      {!isAuthenticated && (
        <div
          className="py-2 px-4 text-center text-xs flex items-center justify-center gap-2"
          style={{ background: "#f0e8e4", color: "#2d3b2d" }}
        >
          <Info size={14} />
          <span>
            Tracking on this device.{" "}
            <Link href="/login?returnTo=/habit-tracker/fitness" className="underline font-bold">
              Sign in
            </Link>{" "}
            to sync &amp; link habits.
          </span>
        </div>
      )}

      {/* Compact ritual header */}
      <div className="pt-5 pb-3 px-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">
              {isToday ? "Today" : format(parseCalendarDate(dateStr), "MMM d")} · Fitness
            </p>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
            >
              What did you do?
            </h1>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shrink-0"
            style={{
              background: minutesToday > 0 ? "linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)" : "#fcfaf9",
              color: minutesToday > 0 ? "#d97706" : "#8a9a8a",
              border: minutesToday > 0 ? "1px solid #ffda6a" : "1px solid #f0e8e4",
            }}
          >
            <Flame
              size={16}
              style={{ fill: minutesToday > 0 ? "#d97706" : "transparent" }}
            />
            {minutesToday}m
          </div>
        </div>

        <div className="flex bg-white rounded-full p-1 shadow-sm border mt-4" style={{ borderColor: "#f0e8e4" }}>
          <button
            onClick={() => setActiveTab("log")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "log" ? "shadow-md" : "text-gray-500"
            }`}
            style={{
              background: activeTab === "log" ? "#2d3b2d" : "transparent",
              color: activeTab === "log" ? "white" : undefined,
            }}
          >
            <Dumbbell size={16} /> Log
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "videos" ? "shadow-md" : "text-gray-500"
            }`}
            style={{
              background: activeTab === "videos" ? "#2d3b2d" : "transparent",
              color: activeTab === "videos" ? "white" : undefined,
            }}
          >
            <PlayCircle size={16} /> Videos
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4">
        {/* LOG TAB */}
        {activeTab === "log" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Date strip */}
            <div
              className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border"
              style={{ borderColor: "#f0e8e4" }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateStr(addDaysToDateStr(dateStr, -1))}
                className="rounded-full"
                style={{ color: "#c9a96e" }}
              >
                ←
              </Button>
              <div className="font-bold text-sm flex items-center gap-2" style={{ color: "#2d3b2d" }}>
                <CalendarIcon size={16} style={{ color: "#c9a96e" }} />
                {isToday ? "Today" : format(parseCalendarDate(dateStr), "MMM d, yyyy")}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateStr(addDaysToDateStr(dateStr, 1))}
                className="rounded-full"
                style={{ color: "#c9a96e" }}
              >
                →
              </Button>
            </div>

            {/* Quick chips */}
            <div
              className="bg-white rounded-3xl p-4 border shadow-sm"
              style={{ borderColor: "#f0e8e4" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-3">
                One-tap log
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={addLogMutation.isPending}
                    onClick={() => handleQuickChip(chip)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-bold border transition-all active:scale-95 hover:shadow-sm"
                    style={{
                      borderColor: "#f0e8e4",
                      background: "#faf5f5",
                      color: "#2d3b2d",
                    }}
                  >
                    {chip.icon === "walk" ? (
                      <Footprints size={14} style={{ color: "#c9a96e" }} />
                    ) : (
                      <Dumbbell size={14} style={{ color: "#c9a96e" }} />
                    )}
                    {chip.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  setShowDetails(true);
                }}
                className="mt-3 text-xs font-bold text-[#8a9a8a] hover:text-[#2d3b2d]"
              >
                + More details (sets / reps / custom)
              </button>
            </div>

            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-3xl shadow-lg border p-5 overflow-hidden"
                  style={{ borderColor: "#f0e8e4" }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg" style={{ color: "#2d3b2d" }}>
                      Log movement
                    </h3>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setShowDetails(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                        What did you do?
                      </label>
                      <input
                        type="text"
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#c9a96e]"
                        placeholder="e.g. Walk, pilates, yard work"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                        Minutes (optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#c9a96e]"
                        placeholder="15"
                      />
                    </div>

                    {!showDetails && (
                      <button
                        type="button"
                        onClick={() => setShowDetails(true)}
                        className="text-xs font-bold text-[#c9a96e]"
                      >
                        Add sets / reps / weight
                      </button>
                    )}

                    {showDetails && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                            Sets
                          </label>
                          <input
                            type="number"
                            value={sets}
                            onChange={(e) => setSets(e.target.value)}
                            className="w-full p-2.5 rounded-xl border text-sm"
                            placeholder="—"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                            Reps
                          </label>
                          <input
                            type="number"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            className="w-full p-2.5 rounded-xl border text-sm"
                            placeholder="—"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                            Weight
                          </label>
                          <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full p-2.5 rounded-xl border text-sm"
                            placeholder="—"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSaveDetailed}
                      disabled={addLogMutation.isPending}
                      className="w-full rounded-2xl py-5 text-base font-bold"
                      style={{ background: "#2d3b2d", color: "white" }}
                    >
                      {addLogMutation.isPending ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Today's list */}
            {dayLogs.length > 0 && (
              <div className="space-y-3">
                <h3
                  className="font-bold text-lg"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
                >
                  {isToday ? "Today" : format(parseCalendarDate(dateStr), "MMM d")}
                </h3>
                {dayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between"
                    style={{ borderColor: "#f0e8e4" }}
                  >
                    <div>
                      <h4 className="font-bold text-[#2d3b2d] text-sm">{log.exerciseName}</h4>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
                        {log.durationMinutes > 0 && <span>{log.durationMinutes} min</span>}
                        {log.sets > 0 && log.reps > 0 && (
                          <span>
                            {log.sets}×{log.reps}
                            {log.weight > 0 ? ` @ ${log.weight}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      aria-label="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state → videos + CTA */}
            {dayLogs.length === 0 && !isAdding && (
              <div
                className="rounded-3xl border bg-white p-5 text-center"
                style={{ borderColor: "#f0e8e4" }}
              >
                <Dumbbell size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="font-bold text-sm mb-1" style={{ color: "#2d3b2d" }}>
                  Nothing logged yet
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Tap a chip above, or do a short video — then mark complete.
                </p>

                {featuredVideos.length > 0 && (
                  <div className="space-y-2 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">
                      Try a video
                    </p>
                    {featuredVideos.map((video) => {
                      const ytId = extractYouTubeId(video.videoUrl);
                      const thumb = ytId
                        ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                        : null;
                      return (
                        <button
                          key={video.id}
                          type="button"
                          onClick={() => setSelectedVideo(video)}
                          className="w-full flex gap-3 p-2 rounded-2xl border hover:shadow-sm transition-all text-left"
                          style={{ borderColor: "#f0e8e4" }}
                        >
                          <div className="w-20 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlayCircle size={20} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 py-0.5">
                            <p className="text-sm font-bold line-clamp-2" style={{ color: "#2d3b2d" }}>
                              {video.title}
                            </p>
                            <p className="text-[11px] text-gray-400">{video.category}</p>
                          </div>
                        </button>
                      );
                    })}
                    <Button
                      variant="outline"
                      className="w-full rounded-full mt-1"
                      onClick={() => setActiveTab("videos")}
                    >
                      Browse video library
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === "videos" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <Filter size={14} className="text-gray-400 shrink-0" />
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === "All" ? "shadow-md" : "bg-white border"
                  }`}
                  style={
                    selectedCategory === "All"
                      ? { background: "#2d3b2d", color: "white" }
                      : { borderColor: "#f0e8e4" }
                  }
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedCategory === cat ? "shadow-md" : "bg-white border"
                    }`}
                    style={
                      selectedCategory === cat
                        ? { background: "#2d3b2d", color: "white" }
                        : { borderColor: "#f0e8e4" }
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {filteredVideos.map((video) => {
                const ytId = extractYouTubeId(video.videoUrl);
                const thumbnail = ytId
                  ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                  : null;
                let intervalCount = 0;
                try {
                  if (video.intervalsJson)
                    intervalCount = JSON.parse(video.intervalsJson).length;
                } catch {
                  /* ignore */
                }

                return (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border text-left hover:shadow-md transition-all group"
                    style={{ borderColor: "#f0e8e4" }}
                  >
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PlayCircle size={40} className="text-gray-300" />
                        </div>
                      )}
                      <span
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90"
                        style={{ color: "#2d3b2d" }}
                      >
                        {video.category}
                      </span>
                      {intervalCount > 0 && (
                        <span
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: "#c9a96e", color: "white" }}
                        >
                          {intervalCount} moves
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-sm text-[#2d3b2d] line-clamp-1">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredVideos.length === 0 && (
              <div className="text-center py-10">
                <PlayCircle size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  {selectedCategory !== "All"
                    ? `No videos in “${selectedCategory}” yet.`
                    : "No videos yet — check back soon."}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
