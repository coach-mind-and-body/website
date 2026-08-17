"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Pencil, Plus, Search, Sprout, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  MEAL_SLOT_LABELS,
  MEAL_SLOTS,
  RECIPE_TAGS,
  type MealSlot,
} from "@shared/food";
import { AdminRecipeEditor } from "./AdminRecipeEditor";

export function AdminRecipesPanel({
  initialEditSlug,
  onInitialEditConsumed,
}: {
  initialEditSlug?: string | null;
  onInitialEditConsumed?: () => void;
}) {
  const utils = trpc.useUtils();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [tag, setTag] = useState("");
  const [mealSlot, setMealSlot] = useState<MealSlot | "">("");
  const [editorSlug, setEditorSlug] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (initialEditSlug) {
      setEditorSlug(initialEditSlug);
      onInitialEditConsumed?.();
    }
  }, [initialEditSlug, onInitialEditConsumed]);

  const { data: recipes, isLoading } = trpc.food.listRecipes.useQuery({
    includeDrafts: true,
    q: debouncedQ || undefined,
    tag: tag || undefined,
    mealSlot: mealSlot || undefined,
  });

  const deleteRecipe = trpc.food.adminDeleteRecipe.useMutation({
    onSuccess: () => {
      toast.success("Recipe deleted");
      utils.food.listRecipes.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const duplicateRecipe = trpc.food.adminDuplicateRecipe.useMutation({
    onSuccess: (res) => {
      toast.success("Recipe duplicated as a draft");
      utils.food.listRecipes.invalidate();
      setEditorSlug(res.slug);
    },
    onError: (e) => toast.error(e.message),
  });

  const seedStarters = trpc.food.adminSeedStarters.useMutation({
    onSuccess: (res) => {
      toast.success(res.created ? `Added ${res.created} starter recipe${res.created === 1 ? "" : "s"}` : "Starter recipes already in the vault");
      utils.food.listRecipes.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (editorSlug !== undefined) {
    return (
      <AdminRecipeEditor
        slug={editorSlug}
        onCancel={() => setEditorSlug(undefined)}
        onSaved={() => {
          utils.food.listRecipes.invalidate();
          setEditorSlug(undefined);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3
            className="font-bold text-2xl mb-1"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            Recipes
          </h3>
          <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
            Drafts stay private. Published recipes can be placed on meal plans and shown to clients.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => seedStarters.mutate()}
            disabled={seedStarters.isPending}
          >
            {seedStarters.isPending ? <Loader2 className="animate-spin" size={16} /> : <Sprout size={16} />}
            Seed starter recipes
          </Button>
          <Button
            type="button"
            onClick={() => setEditorSlug(null)}
            style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
          >
            <Plus size={16} /> New recipe
          </Button>
        </div>
      </div>

      <div
        className="p-4 rounded-2xl border mb-6 space-y-3"
        style={{ background: "oklch(0.96 0.025 50)", borderColor: "oklch(0.90 0.015 80)" }}
      >
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "oklch(0.52 0.015 50)" }}
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recipes…"
            className="pl-9"
            style={{ background: "oklch(0.985 0.008 80)", color: "oklch(0.20 0.015 50)", borderColor: "oklch(0.90 0.015 80)" }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!mealSlot} onClick={() => setMealSlot("")} label="All slots" />
          {MEAL_SLOTS.map((slot) => (
            <FilterChip
              key={slot}
              active={mealSlot === slot}
              onClick={() => setMealSlot(mealSlot === slot ? "" : slot)}
              label={MEAL_SLOT_LABELS[slot]}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!tag} onClick={() => setTag("")} label="All tags" />
          {RECIPE_TAGS.map((t) => (
            <FilterChip
              key={t.id}
              active={tag === t.id}
              onClick={() => setTag(tag === t.id ? "" : t.id)}
              label={t.label}
            />
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center" style={{ color: "oklch(0.72 0.12 75)" }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : !recipes?.length ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          No recipes match these filters.
        </p>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex items-center gap-4 p-4 rounded-xl border bg-white"
              style={{ borderColor: "oklch(0.90 0.015 80)" }}
            >
              <div
                className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                style={{ background: "oklch(0.96 0.025 50)" }}
              >
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: "oklch(0.72 0.12 75)" }}>
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-semibold text-sm truncate" style={{ color: "oklch(0.20 0.015 50)" }}>
                    {recipe.title}
                  </p>
                  <StatusBadge published={recipe.isPublished} featured={recipe.isFeatured} />
                </div>
                <p className="text-xs truncate" style={{ color: "oklch(0.52 0.015 50)" }}>
                  {(recipe.mealSlots as string[])
                    .map((s) => (s in MEAL_SLOT_LABELS ? MEAL_SLOT_LABELS[s as MealSlot] : s))
                    .join(" · ") || "No meal slots"}
                  {recipe.calories ? ` · ${recipe.calories} cal` : ""}
                  {recipe.protein ? ` · ${recipe.protein}g protein` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button type="button" size="sm" variant="outline" onClick={() => setEditorSlug(recipe.slug)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={duplicateRecipe.isPending}
                  onClick={() => duplicateRecipe.mutate({ id: recipe.id })}
                >
                  <Copy size={14} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={deleteRecipe.isPending}
                  onClick={() => {
                    if (!confirm(`Delete “${recipe.title}”? This cannot be undone.`)) return;
                    deleteRecipe.mutate({ id: recipe.id });
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-bold transition-all"
      style={{
        background: active ? "oklch(0.72 0.12 75)" : "oklch(0.985 0.008 80)",
        color: active ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
        border: active ? "none" : "1px solid oklch(0.90 0.015 80)",
      }}
    >
      {label}
    </button>
  );
}

export function StatusBadge({ published, featured }: { published: boolean; featured: boolean }) {
  return (
    <>
      <span
        className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
        style={{
          background: published ? "oklch(0.92 0.04 148)" : "oklch(0.93 0.06 75)",
          color: published ? "oklch(0.38 0.10 148)" : "oklch(0.45 0.12 65)",
        }}
      >
        {published ? "Published" : "Draft"}
      </span>
      {featured && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
          style={{ background: "oklch(0.96 0.05 75)", color: "oklch(0.55 0.12 75)" }}
        >
          Featured
        </span>
      )}
    </>
  );
}
