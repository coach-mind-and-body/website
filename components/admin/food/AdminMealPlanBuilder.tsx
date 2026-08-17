"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  MEAL_SLOT_LABELS,
  MEAL_SLOTS,
  WEEKDAY_SHORT,
  type MealSlot,
} from "@shared/food";

type GridCell = {
  recipeId: number;
  servings: number;
  title: string;
  imageUrl: string | null;
};

type Grid = Record<string, GridCell>;

function cellKey(day: number, slot: MealSlot) {
  return `${day}:${slot}`;
}

function parseKey(key: string): { day: number; slot: MealSlot } | null {
  const [dayRaw, slot] = key.split(":");
  const day = Number(dayRaw);
  if (!Number.isInteger(day) || day < 0 || day > 6) return null;
  if (!(MEAL_SLOTS as readonly string[]).includes(slot)) return null;
  return { day, slot: slot as MealSlot };
}

export function AdminMealPlanBuilder({
  mealPlanId,
  onBack,
}: {
  mealPlanId: number;
  onBack: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: plan, isLoading } = trpc.food.getMealPlan.useQuery({ id: mealPlanId });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [servingsDefault, setServingsDefault] = useState(1);
  const [showNutrition, setShowNutrition] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [grid, setGrid] = useState<Grid>({});
  const [picker, setPicker] = useState<{ day: number; slot: MealSlot } | null>(null);

  useEffect(() => {
    if (!plan) return;
    setTitle(plan.title);
    setDescription(plan.description ?? "");
    setNotes(plan.notes ?? "");
    setServingsDefault(plan.servingsDefault ?? 1);
    setShowNutrition(plan.showNutrition);
    setIsPublished(plan.isPublished);
    setIsFeatured(plan.isFeatured);
    const next: Grid = {};
    for (const s of plan.slots) {
      next[cellKey(s.dayOfWeek, s.slot)] = {
        recipeId: s.recipeId,
        servings: s.servings,
        title: s.recipe?.title ?? `Recipe #${s.recipeId}`,
        imageUrl: s.recipe?.imageUrl ?? null,
      };
    }
    setGrid(next);
  }, [plan]);

  const updatePlan = trpc.food.adminUpdateMealPlan.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const setSlots = trpc.food.adminSetSlots.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const saving = updatePlan.isPending || setSlots.isPending;

  const saveAll = async () => {
    if (!plan) return;
    if (!title.trim()) return toast.error("Title is required");
    const slots = Object.entries(grid).flatMap(([key, cell]) => {
      const parsed = parseKey(key);
      if (!parsed) return [];
      return [
        {
          dayOfWeek: parsed.day,
          slot: parsed.slot,
          recipeId: cell.recipeId,
          servings: Math.max(1, cell.servings),
        },
      ];
    });
    try {
      await updatePlan.mutateAsync({
        id: mealPlanId,
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        tags: plan.tags,
        servingsDefault,
        showNutrition,
        isPublished,
        isFeatured,
      });
      await setSlots.mutateAsync({ mealPlanId, slots });
      toast.success("Meal plan saved");
      utils.food.getMealPlan.invalidate({ id: mealPlanId });
      utils.food.listMealPlans.invalidate();
    } catch {
      // mutation onError already toasted
    }
  };

  const placeRecipe = (cell: GridCell) => {
    if (!picker) return;
    setGrid((prev) => ({ ...prev, [cellKey(picker.day, picker.slot)]: cell }));
    setPicker(null);
  };

  const removeCell = (day: number, slot: MealSlot) => {
    setGrid((prev) => {
      const next = { ...prev };
      delete next[cellKey(day, slot)];
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center" style={{ color: "oklch(0.72 0.12 75)" }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          Meal plan not found.
        </p>
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold flex items-center gap-1 mb-2"
            style={{ color: "oklch(0.72 0.12 75)" }}
          >
            <ArrowLeft size={14} /> All meal plans
          </button>
          <h3
            className="font-bold text-2xl"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            Meal plan builder
          </h3>
        </div>
        <Button
          type="button"
          onClick={saveAll}
          disabled={saving}
          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : null}
          Save plan
        </Button>
      </div>

      <section
        className="p-5 rounded-2xl border bg-white space-y-3"
        style={{ borderColor: "oklch(0.90 0.015 80)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
              Title
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
              Default servings
            </label>
            <Input
              type="number"
              min={1}
              value={servingsDefault}
              onChange={(e) => setServingsDefault(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
        </div>
        <div>
          <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
            Description
          </label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div>
          <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
            Coach notes
          </label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showNutrition} onChange={(e) => setShowNutrition(e.target.checked)} />
            Show nutrition
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl border bg-white" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
        <div className="min-w-[920px] p-3">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "88px repeat(7, minmax(110px, 1fr))" }}
          >
            <div />
            {WEEKDAY_SHORT.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold uppercase tracking-wide py-2"
                style={{ color: "oklch(0.20 0.015 50)", fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}
              >
                {day}
              </div>
            ))}
            {MEAL_SLOTS.map((slot) => (
              <SlotRow
                key={slot}
                slot={slot}
                grid={grid}
                onAdd={(day) => setPicker({ day, slot })}
                onRemove={removeCell}
                onServings={(day, servings) =>
                  setGrid((prev) => {
                    const key = cellKey(day, slot);
                    const existing = prev[key];
                    if (!existing) return prev;
                    return { ...prev, [key]: { ...existing, servings } };
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>

      {picker && (
        <RecipePickerModal
          defaultServings={grid[cellKey(picker.day, picker.slot)]?.servings ?? servingsDefault}
          selectedRecipeId={grid[cellKey(picker.day, picker.slot)]?.recipeId}
          heading={`${WEEKDAY_SHORT[picker.day]} · ${MEAL_SLOT_LABELS[picker.slot]}`}
          onClose={() => setPicker(null)}
          onPick={placeRecipe}
        />
      )}
    </div>
  );
}

function SlotRow({
  slot,
  grid,
  onAdd,
  onRemove,
  onServings,
}: {
  slot: MealSlot;
  grid: Grid;
  onAdd: (day: number) => void;
  onRemove: (day: number, slot: MealSlot) => void;
  onServings: (day: number, servings: number) => void;
}) {
  return (
    <>
      <div
        className="text-[11px] font-bold uppercase tracking-wide flex items-center"
        style={{ color: "oklch(0.42 0.015 50)" }}
      >
        {MEAL_SLOT_LABELS[slot]}
      </div>
      {WEEKDAY_SHORT.map((_, day) => {
        const cell = grid[cellKey(day, slot)];
        return (
          <div
            key={`${day}-${slot}`}
            className="min-h-[108px] rounded-xl border p-1.5 flex flex-col"
            style={{
              borderColor: cell ? "oklch(0.86 0.04 75)" : "oklch(0.90 0.015 80)",
              background: cell ? "oklch(0.99 0.012 80)" : "oklch(0.985 0.008 80)",
            }}
          >
            {cell ? (
              <>
                <div className="flex gap-1.5 min-h-0 flex-1">
                  <button type="button" className="flex gap-1.5 min-w-0 flex-1 text-left" onClick={() => onAdd(day)}>
                    <div
                      className="w-9 h-9 rounded-lg overflow-hidden shrink-0"
                      style={{ background: "oklch(0.96 0.025 50)" }}
                    >
                      {cell.imageUrl ? (
                        <img src={cell.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <p className="text-[11px] font-bold leading-snug line-clamp-3" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {cell.title}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(day, slot)}
                    className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.96 0.025 50)" }}
                    aria-label="Remove recipe"
                  >
                    <X size={12} />
                  </button>
                </div>
                <label className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: "oklch(0.52 0.015 50)" }}>
                  Sv
                  <input
                    type="number"
                    min={1}
                    value={cell.servings}
                    onChange={(e) => onServings(day, Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-10 h-6 rounded border px-1 text-[11px]"
                    style={{ borderColor: "oklch(0.90 0.015 80)", background: "white" }}
                  />
                </label>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(day)}
                className="flex-1 rounded-lg border border-dashed text-[11px] font-bold flex flex-col items-center justify-center gap-1"
                style={{ borderColor: "oklch(0.86 0.04 75)", color: "oklch(0.72 0.12 75)" }}
              >
                <Plus size={14} /> Add
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

function RecipePickerModal({
  heading,
  defaultServings,
  selectedRecipeId,
  onClose,
  onPick,
}: {
  heading: string;
  defaultServings: number;
  selectedRecipeId?: number;
  onClose: () => void;
  onPick: (cell: GridCell) => void;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [servings, setServings] = useState(defaultServings);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const { data: recipes, isLoading } = trpc.food.listRecipes.useQuery({
    includeDrafts: true,
    q: debouncedQ || undefined,
  });

  const list = useMemo(() => recipes ?? [], [recipes]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(40, 30, 16, 0.45)" }}>
      <div
        className="w-full max-w-lg max-h-[85vh] rounded-2xl border bg-white shadow-xl flex flex-col"
        style={{ borderColor: "oklch(0.90 0.015 80)" }}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
              Add recipe
            </p>
            <h4 className="font-bold" style={{ color: "oklch(0.20 0.015 50)" }}>
              {heading}
            </h4>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3 border-b" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "oklch(0.52 0.015 50)" }}
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search published and draft recipes…"
              className="pl-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.42 0.015 50)" }}>
            Servings
            <Input
              type="number"
              min={1}
              className="w-20"
              value={servings}
              onChange={(e) => setServings(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </label>
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="py-8 flex justify-center" style={{ color: "oklch(0.72 0.12 75)" }}>
              <Loader2 className="animate-spin" />
            </div>
          ) : !list.length ? (
            <p className="text-sm p-3" style={{ color: "oklch(0.52 0.015 50)" }}>
              No recipes found.
            </p>
          ) : (
            list.map((recipe) => {
              const selected = recipe.id === selectedRecipeId;
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() =>
                    onPick({
                      recipeId: recipe.id,
                      servings,
                      title: recipe.title,
                      imageUrl: recipe.imageUrl,
                    })
                  }
                  className="w-full flex items-center gap-3 p-2 rounded-xl border text-left"
                  style={{
                    borderColor: selected ? "oklch(0.72 0.12 75)" : "oklch(0.90 0.015 80)",
                    background: selected ? "oklch(0.98 0.02 75)" : "white",
                  }}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "oklch(0.96 0.025 50)" }}>
                    {recipe.imageUrl ? <img src={recipe.imageUrl} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {recipe.title}
                    </p>
                    <p className="text-[11px]" style={{ color: "oklch(0.52 0.015 50)" }}>
                      {recipe.isPublished ? "Published" : "Draft"}
                      {recipe.calories ? ` · ${recipe.calories} cal` : ""}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
