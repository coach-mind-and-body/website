"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Printer,
  ShoppingCart,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { todayMountainDateStr } from "@/lib/mountainTime";
import FoodHubNav from "@/components/habit/FoodHubNav";
import {
  MEAL_SLOT_LABELS,
  WEEKDAY_LABELS,
  type MealSlot,
} from "@shared/food";

const FOREST = "#2d3b2d";
const GOLD = "#c9a96e";
const BORDER = "#f0e8e4";
const CREAM = "#faf5f5";

type CalorieMeal = "breakfast" | "lunch" | "dinner" | "snack" | "drink";

function todayDow(): number {
  const [y, m, d] = todayMountainDateStr().split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function slotToMealType(slot: string): CalorieMeal {
  if (slot === "snack2" || slot === "snack") return "snack";
  if (slot === "breakfast" || slot === "lunch" || slot === "dinner") return slot;
  return "snack";
}

export default function MealPlanClient() {
  usePageTitle({
    title: "This Week | Mind & Body Reset",
    description: "Your assigned week of meals from Lee Anne.",
  });

  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [viewPlanId, setViewPlanId] = useState<number | null>(null);
  const [loggingKey, setLoggingKey] = useState<string | null>(null);

  const { data: myPlan, isLoading: myLoading } = trpc.food.getMyMealPlan.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: publishedPlans, isLoading: plansLoading } = trpc.food.listMealPlans.useQuery();

  const guestFallbackId =
    publishedPlans?.find((p) => p.isFeatured)?.id ?? publishedPlans?.[0]?.id ?? null;
  const effectiveId = viewPlanId ?? myPlan?.id ?? (!isAuthenticated ? guestFallbackId : null);
  const viewingAssigned = Boolean(isAuthenticated && myPlan && effectiveId === myPlan.id);

  const { data: previewPlan, isLoading: previewLoading } =
    trpc.food.getMealPlan.useQuery(
      { id: effectiveId ?? 0 },
      { enabled: effectiveId != null && !viewingAssigned }
    );

  const plan = viewingAssigned ? myPlan : previewPlan;
  const planLoading = viewingAssigned ? myLoading : previewLoading;

  const regenerate = trpc.food.regenerateShoppingList.useMutation({
    onSuccess: () => {
      void utils.food.getShoppingList.invalidate();
      toast.success("Shopping list is ready");
      router.push("/habit-tracker/shop");
    },
    onError: (e) => toast.error(e.message),
  });

  const addLog = trpc.calories.addLog.useMutation({
    onSuccess: () => {
      toast.success("Logged to today's nutrition");
      void utils.calories.getLogs.invalidate();
      void utils.habit.getUserHabits.invalidate();
      setLoggingKey(null);
    },
    onError: (e) => {
      toast.error(e.message);
      setLoggingKey(null);
    },
  });

  const today = todayDow();

  const days = useMemo(() => {
    const slots = plan?.slots ?? [];
    return WEEKDAY_LABELS.map((label, dayOfWeek) => ({
      dayOfWeek,
      label,
      isToday: dayOfWeek === today,
      slots: slots.filter((s) => s.dayOfWeek === dayOfWeek),
    }));
  }, [plan?.slots, today]);

  const logSlot = (
    key: string,
    slot: {
      slot: string;
      servings: number;
      recipe: {
        id: number;
        title: string;
        servings: number;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      } | null;
    }
  ) => {
    const rec = slot.recipe;
    if (!rec) return;
    if (!isAuthenticated) {
      toast("Sign in to log this meal", {
        action: {
          label: "Sign in",
          onClick: () => router.push("/login?returnTo=/habit-tracker/meal-plan"),
        },
      });
      return;
    }
    const base = rec.servings > 0 ? rec.servings : 1;
    const scale = (slot.servings || 1) / base;
    setLoggingKey(key);
    addLog.mutate({
      dateStr: todayMountainDateStr(),
      mealType: slotToMealType(slot.slot),
      foodName: rec.title,
      calories: Math.round((rec.calories || 0) * scale),
      protein: Math.round((rec.protein || 0) * scale),
      carbs: Math.round((rec.carbs || 0) * scale),
      fat: Math.round((rec.fat || 0) * scale),
      fiber: Math.round((rec.fiber || 0) * scale),
      recipeId: rec.id,
      servings: slot.servings || 1,
    });
  };

  const showSwitcher = (publishedPlans?.length ?? 0) > 1;

  return (
    <div className="min-h-screen text-gray-900" style={{ background: CREAM }}>
      <style>{`
        @media print {
          .habit-tracker-nav,
          .habit-tracker-top-nav,
          .no-print { display: none !important; }
          .habit-tracker-content { padding-bottom: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="max-w-lg mx-auto px-4 pt-5">
        <div className="no-print">
          <FoodHubNav />
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">
            Meal plan
          </p>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
          >
            This week
          </h1>
        </div>

        {!isAuthenticated ? (
          <p className="no-print text-xs text-[#6b7a6b] mb-3">
            Previewing this week.{" "}
            <Link href="/login?returnTo=/habit-tracker/meal-plan" className="font-bold underline">
              Sign in
            </Link>{" "}
            to log meals and build a shopping list.
          </p>
        ) : null}

        {authLoading || plansLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" size={28} style={{ color: GOLD }} />
          </div>
        ) : myLoading && isAuthenticated && !myPlan ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" size={28} style={{ color: GOLD }} />
          </div>
        ) : !myPlan && !viewPlanId ? (
          <div
            className="bg-white rounded-3xl border p-8 text-center"
            style={{ borderColor: BORDER }}
          >
            <Utensils size={28} className="mx-auto mb-3" style={{ color: GOLD }} />
            <p
              className="text-lg font-bold mb-1"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
            >
              Lee Anne hasn't assigned a week yet
            </p>
            <p className="text-sm text-[#6b7a6b] leading-relaxed mb-4">
              Browse the vault in the meantime — the good plates are already there.
            </p>
            <Link
              href="/habit-tracker/recipes"
              className="inline-block rounded-full px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: FOREST }}
            >
              Browse the vault
            </Link>
          </div>
        ) : (
          <>
            {showSwitcher ? (
              <label className="no-print block mb-3">
                <span className="sr-only">Choose a meal plan</span>
                <select
                  value={effectiveId ?? ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setViewPlanId(Number.isFinite(id) ? id : null);
                  }}
                  className="w-full bg-white border rounded-2xl px-3 py-2.5 text-sm font-bold"
                  style={{ borderColor: BORDER, color: FOREST }}
                >
                  {publishedPlans!.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                      {myPlan && p.id === myPlan.id ? " · yours" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {planLoading && !plan ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin" size={28} style={{ color: GOLD }} />
              </div>
            ) : plan ? (
              <>
                <div className="mb-4">
                  <h2
                    className="text-lg font-bold"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
                  >
                    {plan.title}
                  </h2>
                  {plan.description ? (
                    <p className="text-sm text-[#6b7a6b] mt-1">{plan.description}</p>
                  ) : null}
                  {plan.notes ? (
                    <p className="text-xs text-[#8a9a8a] mt-1 italic">{plan.notes}</p>
                  ) : null}
                </div>

                <div className="no-print flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push("/login?returnTo=/habit-tracker/meal-plan");
                        return;
                      }
                      regenerate.mutate({ mealPlanId: plan.id });
                    }}
                    disabled={regenerate.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold text-white disabled:opacity-70"
                    style={{ background: FOREST }}
                  >
                    {regenerate.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={14} />
                    )}
                    Build shopping list
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold border bg-white"
                    style={{ borderColor: BORDER, color: FOREST }}
                  >
                    <Printer size={14} style={{ color: GOLD }} />
                    Print week
                  </button>
                </div>

                <div className="space-y-4">
                  {days.map((day) => (
                    <section
                      key={day.dayOfWeek}
                      className="rounded-3xl border bg-white p-3.5 shadow-sm"
                      style={{
                        borderColor: day.isToday ? GOLD : BORDER,
                        background: day.isToday ? "#fbf8f3" : "white",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <h3
                          className="text-base font-bold"
                          style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            color: FOREST,
                          }}
                        >
                          {day.label}
                        </h3>
                        {day.isToday ? (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                            style={{ background: FOREST }}
                          >
                            Today
                          </span>
                        ) : null}
                      </div>

                      {day.slots.length === 0 ? (
                        <p className="text-xs text-[#8a9a8a] px-0.5">Rest kitchen.</p>
                      ) : (
                        <div className="space-y-2">
                          {day.slots.map((slot) => {
                            const rec = slot.recipe;
                            const key = `${day.dayOfWeek}-${slot.slot}-${slot.id}`;
                            if (!rec) {
                              return (
                                <div
                                  key={key}
                                  className="text-xs text-[#8a9a8a] px-1"
                                >
                                  {MEAL_SLOT_LABELS[slot.slot as MealSlot] ?? slot.slot}
                                  {" · recipe unavailable"}
                                </div>
                              );
                            }
                            return (
                              <div
                                key={key}
                                className="flex gap-2.5 items-center bg-white rounded-2xl border overflow-hidden"
                                style={{ borderColor: BORDER }}
                              >
                                <Link
                                  href={`/habit-tracker/recipes/${rec.slug}`}
                                  className="flex flex-1 min-w-0 gap-2.5 items-center"
                                >
                                  <div className="w-16 h-16 shrink-0 bg-[#f0e8e4] overflow-hidden">
                                    {rec.imageUrl ? (
                                      <img
                                        src={rec.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Utensils size={16} style={{ color: GOLD }} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 py-1.5 pr-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9a8a]">
                                      {MEAL_SLOT_LABELS[slot.slot as MealSlot] ?? slot.slot}
                                      {slot.servings > 1 ? ` · ${slot.servings} svgs` : ""}
                                    </p>
                                    <p
                                      className="text-sm font-bold leading-snug line-clamp-2"
                                      style={{
                                        fontFamily: "'Cormorant Garamond', serif",
                                        color: FOREST,
                                      }}
                                    >
                                      {rec.title}
                                    </p>
                                    {rec.protein > 0 ? (
                                      <p className="text-[11px] font-bold" style={{ color: FOREST }}>
                                        {rec.protein}g protein
                                      </p>
                                    ) : null}
                                  </div>
                                </Link>
                                {day.isToday ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      logSlot(key, {
                                        slot: slot.slot,
                                        servings: slot.servings,
                                        recipe: rec,
                                      })
                                    }
                                    disabled={addLog.isPending && loggingKey === key}
                                    className="no-print shrink-0 mr-2 rounded-full px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-70"
                                    style={{ background: FOREST }}
                                  >
                                    {addLog.isPending && loggingKey === key ? "…" : "Log"}
                                  </button>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
