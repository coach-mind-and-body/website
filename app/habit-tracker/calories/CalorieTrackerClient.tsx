"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Camera,
  Loader2,
  Info,
  Pencil,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";
import { todayMountainDateStr } from "@/lib/mountainTime";
import { calendarDateStr, parseCalendarDate } from "@/lib/habitStreak";
import { getDeviceId } from "@/lib/deviceId";

const LOCAL_KEY = "mbr_calorie_logs";
const PROTEIN_GOAL_DEFAULT = 100;

type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "drink";

type LocalCalLog = {
  id: number;
  dateStr: string;
  mealType: MealType;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

const MEAL_CHIPS: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "lunch", label: "Lunch" },
  { type: "dinner", label: "Dinner" },
  { type: "snack", label: "Snack" },
  { type: "drink", label: "Drink" },
];

function loadLocal(): LocalCalLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function saveLocal(logs: LocalCalLog[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(logs));
}

function addDaysToDateStr(dateStr: string, delta: number): string {
  return calendarDateStr(addDays(parseCalendarDate(dateStr), delta));
}

export default function CalorieTrackerClient() {
  usePageTitle({
    title: "Nutrition Tracker | Mind & Body Reset Coaches",
    description: "Track your meals and macros easily.",
  });

  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [dateStr, setDateStr] = useState(todayMountainDateStr);
  const [localLogs, setLocalLogs] = useState<LocalCalLog[]>([]);
  const [mounted, setMounted] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [mealType, setMealType] = useState<MealType>("snack");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [userHint, setUserHint] = useState("");
  const [showFullMacros, setShowFullMacros] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setLocalLogs(loadLocal());
  }, []);

  const { data: serverLogs, refetch } = trpc.calories.getLogs.useQuery(
    { dateStr },
    { enabled: isAuthenticated }
  );

  // Protein goal from active habits when signed in
  const { data: userHabitsData } = trpc.habit.getUserHabits.useQuery(
    { fromDate: dateStr },
    { enabled: isAuthenticated }
  );
  const proteinGoal = useMemo(() => {
    const h = userHabitsData?.habits?.find(
      (x) =>
        x.isActive !== false &&
        x.type === "numeric" &&
        x.title.toLowerCase().includes("protein")
    );
    return h?.targetValue || PROTEIN_GOAL_DEFAULT;
  }, [userHabitsData]);

  const addLogMutation = trpc.calories.addLog.useMutation({
    onSuccess: () => {
      toast.success("Logged!");
      refetch();
      utils.habit.getUserHabits.invalidate();
      setIsAdding(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateLogMutation = trpc.calories.updateLog.useMutation({
    onSuccess: () => {
      toast.success("Updated!");
      refetch();
      utils.habit.getUserHabits.invalidate();
      setIsAdding(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLogMutation = trpc.calories.deleteLog.useMutation({
    onSuccess: () => {
      toast.success("Removed");
      refetch();
      utils.habit.getUserHabits.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const analyzeImageMutation = trpc.calories.analyzeFoodImage.useMutation({
    onSuccess: (data) => {
      setFoodName(data.foodName);
      setCalories(data.calories.toString());
      setProtein(data.protein.toString());
      setCarbs(data.carbs.toString());
      setFat(data.fat.toString());
      setFiber(data.fiber.toString());
      setShowFullMacros(true);
      toast.success("AI estimated macros — tweak if needed");
    },
    onError: (e) => toast.error(e.message),
  });

  const analyzeTextMutation = trpc.calories.analyzeFoodText.useMutation({
    onSuccess: (data) => {
      setFoodName(data.foodName);
      setCalories(data.calories.toString());
      setProtein(data.protein.toString());
      setCarbs(data.carbs.toString());
      setFat(data.fat.toString());
      setFiber(data.fiber.toString());
      setShowFullMacros(true);
      toast.success("AI estimated macros — tweak if needed");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setFoodName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setUserHint("");
    setEditingLogId(null);
    setShowFullMacros(false);
  };

  const dayLogs = useMemo(() => {
    if (isAuthenticated) return serverLogs || [];
    return localLogs.filter((l) => l.dateStr === dateStr);
  }, [isAuthenticated, serverLogs, localLogs, dateStr]);

  const totals = useMemo(() => {
    return dayLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fat: acc.fat + (log.fat || 0),
        fiber: acc.fiber + (log.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [dayLogs]);

  const proteinPct = Math.min(
    100,
    Math.round((totals.protein / (proteinGoal || 1)) * 100)
  );
  const isToday = dateStr === todayMountainDateStr();

  const persistGuest = useCallback((entry: Omit<LocalCalLog, "id"> & { id?: number }) => {
    const all = loadLocal();
    if (entry.id) {
      const next = all.map((l) =>
        l.id === entry.id ? { ...l, ...entry, id: entry.id } : l
      );
      saveLocal(next);
      setLocalLogs(next);
    } else {
      const next = [{ ...entry, id: Date.now() } as LocalCalLog, ...all];
      saveLocal(next);
      setLocalLogs(next);
    }
  }, []);

  const handleSave = () => {
    if (!foodName.trim()) return toast.error("What did you eat?");
    const payload = {
      dateStr,
      mealType,
      foodName: foodName.trim(),
      calories: parseInt(calories, 10) || 0,
      protein: parseInt(protein, 10) || 0,
      carbs: parseInt(carbs, 10) || 0,
      fat: parseInt(fat, 10) || 0,
      fiber: parseInt(fiber, 10) || 0,
    };

    if (isAuthenticated) {
      if (editingLogId) {
        updateLogMutation.mutate({ id: editingLogId, ...payload });
      } else {
        addLogMutation.mutate(payload);
      }
      return;
    }

    persistGuest({
      id: editingLogId || undefined,
      ...payload,
    });
    toast.success(editingLogId ? "Updated on this device" : "Logged on this device");
    setIsAdding(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (isAuthenticated) {
      deleteLogMutation.mutate({ id, dateStr });
      return;
    }
    const next = loadLocal().filter((l) => l.id !== id);
    saveLocal(next);
    setLocalLogs(next);
    toast.success("Removed");
  };

  const openAdd = (type?: MealType) => {
    resetForm();
    if (type) setMealType(type);
    setIsAdding(true);
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      toast.info("Analyzing…");
      analyzeImageMutation.mutate({
        imageBase64: base64,
        userHint,
        deviceId: getDeviceId(),
      });
    };
    reader.readAsDataURL(file);
  };

  const quickEstimateAndFocus = () => {
    if (!foodName.trim()) return toast.error("Type a food name first");
    analyzeTextMutation.mutate({
      foodName: foodName.trim(),
      deviceId: getDeviceId(),
    });
  };

  if (!mounted) return <div className="min-h-screen bg-[#faf5f5]" />;

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
            <Link href="/login?returnTo=/habit-tracker/calories" className="underline font-bold">
              Sign in
            </Link>{" "}
            to sync protein to your habits.
          </span>
        </div>
      )}

      {/* Ritual header */}
      <div className="pt-5 pb-3 px-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">
              {isToday ? "Today" : format(parseCalendarDate(dateStr), "MMM d")} · Nutrition
            </p>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
            >
              What did you eat?
            </h1>
          </div>
          <div
            className="text-right shrink-0 px-3 py-1.5 rounded-full border"
            style={{
              background: proteinPct >= 100 ? "#ecfdf5" : "#fcfaf9",
              borderColor: proteinPct >= 100 ? "#a7f3d0" : "#f0e8e4",
            }}
          >
            <p className="text-[10px] font-bold uppercase text-gray-400">Protein</p>
            <p className="text-sm font-bold" style={{ color: "#2d3b2d" }}>
              {totals.protein}
              <span className="text-gray-400 font-semibold">/{proteinGoal}g</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4">
        {/* Date */}
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

        {/* Protein-first summary */}
        <div
          className="bg-white rounded-3xl shadow-sm p-4 border"
          style={{ borderColor: "#f0e8e4" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-500">Protein goal</p>
            <p className="text-xs font-bold" style={{ color: proteinPct >= 100 ? "#059669" : "#2d3b2d" }}>
              {proteinPct}%
            </p>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden bg-gray-100 mb-3">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${proteinPct}%`,
                background: proteinPct >= 100 ? "#10b981" : "#c9a96e",
              }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#faf5f5] p-2 rounded-xl">
              <div className="text-sm font-bold" style={{ color: "#2d3b2d" }}>
                {totals.calories}
              </div>
              <div className="text-[9px] font-bold text-gray-400 uppercase">Kcal</div>
            </div>
            <div className="bg-blue-50 p-2 rounded-xl">
              <div className="text-sm font-bold text-blue-700">{totals.protein}g</div>
              <div className="text-[9px] font-bold text-blue-400 uppercase">Pro</div>
            </div>
            <div className="bg-orange-50 p-2 rounded-xl">
              <div className="text-sm font-bold text-orange-700">{totals.carbs}g</div>
              <div className="text-[9px] font-bold text-orange-400 uppercase">Carb</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded-xl">
              <div className="text-sm font-bold text-yellow-700">{totals.fat}g</div>
              <div className="text-[9px] font-bold text-yellow-500 uppercase">Fat</div>
            </div>
          </div>
        </div>

        {/* Meal chips */}
        <div
          className="bg-white rounded-3xl p-4 border shadow-sm"
          style={{ borderColor: "#f0e8e4" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-3">
            Quick add
          </p>
          <div className="flex flex-wrap gap-2">
            {MEAL_CHIPS.map((c) => (
              <button
                key={c.type}
                type="button"
                onClick={() => openAdd(c.type)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-bold border transition-all active:scale-95"
                style={{ borderColor: "#f0e8e4", background: "#faf5f5", color: "#2d3b2d" }}
              >
                <Utensils size={14} style={{ color: "#c9a96e" }} />
                {c.label}
              </button>
            ))}
          </div>
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
                  {editingLogId ? "Edit" : "Log"} {mealType}
                </h3>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    resetForm();
                  }}
                  className="text-xs font-bold text-gray-400"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {MEAL_CHIPS.map((c) => (
                  <button
                    key={c.type}
                    type="button"
                    onClick={() => setMealType(c.type)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                      mealType === c.type ? "text-white" : "bg-gray-100 text-gray-500"
                    }`}
                    style={{ background: mealType === c.type ? "#c9a96e" : undefined }}
                  >
                    {c.type}
                  </button>
                ))}
              </div>

              {/* Name + AI */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Food name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      className="flex-1 p-3 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a96e]"
                      placeholder="e.g. Greek yogurt + berries"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={quickEstimateAndFocus}
                      disabled={analyzeTextMutation.isPending || !foodName}
                      className="px-3 rounded-xl font-bold text-xs shrink-0 disabled:opacity-50"
                      style={{ background: "#fbeee9", color: "#c9a96e" }}
                    >
                      {analyzeTextMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "✨ AI"
                      )}
                    </button>
                  </div>
                </div>

                {/* Protein first — midlife priority */}
                <div>
                  <label className="text-xs font-bold text-blue-500 uppercase mb-1 block">
                    Protein (g) — most important
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full p-3 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    placeholder="e.g. 25"
                  />
                </div>

                {!showFullMacros && (
                  <button
                    type="button"
                    onClick={() => setShowFullMacros(true)}
                    className="text-xs font-bold text-[#8a9a8a]"
                  >
                    + Calories & other macros
                  </button>
                )}

                {showFullMacros && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                        Calories
                      </label>
                      <input
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        className="w-full p-2.5 rounded-xl border text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-orange-400 uppercase mb-1 block">
                        Carbs
                      </label>
                      <input
                        type="number"
                        value={carbs}
                        onChange={(e) => setCarbs(e.target.value)}
                        className="w-full p-2.5 rounded-xl border text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-yellow-500 uppercase mb-1 block">
                        Fat
                      </label>
                      <input
                        type="number"
                        value={fat}
                        onChange={(e) => setFat(e.target.value)}
                        className="w-full p-2.5 rounded-xl border text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-green-500 uppercase mb-1 block">
                        Fiber
                      </label>
                      <input
                        type="number"
                        value={fiber}
                        onChange={(e) => setFiber(e.target.value)}
                        className="w-full p-2.5 rounded-xl border text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Photo AI — guests get a soft daily limit server-side */}
                <div
                  className="p-3 rounded-2xl border border-dashed flex flex-col items-center gap-2"
                  style={{ borderColor: "#e8c99a", background: "#fcfaf9" }}
                >
                  <input
                    type="text"
                    placeholder="Optional hint: '1 cup rice'"
                    value={userHint}
                    onChange={(e) => setUserHint(e.target.value)}
                    className="w-full p-2 rounded-xl border text-xs text-center"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageCapture}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzeImageMutation.isPending}
                    className="rounded-full"
                    style={{ background: "#2d3b2d", color: "white" }}
                  >
                    {analyzeImageMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Camera size={16} className="mr-2" />
                    )}
                    Snap photo
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-[10px] text-gray-400 text-center">
                      Guests: up to 8 AI estimates/day. Sign in for unlimited.
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSave}
                  disabled={addLogMutation.isPending || updateLogMutation.isPending}
                  className="w-full rounded-2xl py-5 font-bold"
                  style={{ background: "#2d3b2d", color: "white" }}
                >
                  {addLogMutation.isPending || updateLogMutation.isPending
                    ? "Saving…"
                    : editingLogId
                      ? "Update"
                      : "Save"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meal list */}
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
                className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between gap-2"
                style={{ borderColor: "#f0e8e4" }}
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase" style={{ color: "#c9a96e" }}>
                    {log.mealType}
                  </div>
                  <h4 className="font-bold text-sm text-[#2d3b2d] truncate">{log.foodName}</h4>
                  <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-2">
                    <span className="text-blue-600 font-semibold">{log.protein}p</span>
                    {log.calories > 0 && <span>{log.calories} kcal</span>}
                    {log.carbs > 0 && <span className="text-orange-500">{log.carbs}c</span>}
                    {log.fat > 0 && <span className="text-yellow-600">{log.fat}f</span>}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLogId(log.id);
                      setMealType(log.mealType as MealType);
                      setFoodName(log.foodName);
                      setCalories(String(log.calories));
                      setProtein(String(log.protein));
                      setCarbs(String(log.carbs));
                      setFat(String(log.fat));
                      setFiber(String(log.fiber));
                      setShowFullMacros(true);
                      setIsAdding(true);
                    }}
                    className="p-2 text-gray-300 hover:text-[#c9a96e]"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(log.id)}
                    className="p-2 text-gray-300 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {dayLogs.length === 0 && !isAdding && (
          <div
            className="rounded-3xl border bg-white p-6 text-center"
            style={{ borderColor: "#f0e8e4" }}
          >
            <Utensils size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="font-bold text-sm mb-1" style={{ color: "#2d3b2d" }}>
              No food logged yet
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Tap a meal chip above. Protein first — you can skip the rest.
            </p>
            <Button
              onClick={() => openAdd("snack")}
              className="rounded-full"
              style={{ background: "#c9a96e", color: "white" }}
            >
              <Plus size={16} className="mr-1" /> Log something
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
