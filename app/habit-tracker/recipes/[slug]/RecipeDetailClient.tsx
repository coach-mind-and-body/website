"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Heart,
  Loader2,
  Minus,
  Plus,
  Users,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { todayMountainDateStr } from "@/lib/mountainTime";
import FoodHubNav from "@/components/habit/FoodHubNav";
import FatSecretAttribution from "@/components/habit/FatSecretAttribution";
import { RECIPE_TAGS, type RecipeIngredient } from "@shared/food";

const FOREST = "#2d3b2d";
const GOLD = "#c9a96e";
const BORDER = "#f0e8e4";
const CREAM = "#faf5f5";

type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "drink";

const MEAL_CHIPS: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "lunch", label: "Lunch" },
  { type: "dinner", label: "Dinner" },
  { type: "snack", label: "Snack" },
  { type: "drink", label: "Drink" },
];

function tagLabel(id: string): string {
  return RECIPE_TAGS.find((t) => t.id === id)?.label ?? id.replace(/-/g, " ");
}

function defaultMealType(slots: string[]): MealType {
  for (const s of slots) {
    const mapped = s === "snack2" ? "snack" : s;
    if (
      mapped === "breakfast" ||
      mapped === "lunch" ||
      mapped === "dinner" ||
      mapped === "snack" ||
      mapped === "drink"
    ) {
      return mapped;
    }
  }
  return "lunch";
}

function formatIngredient(ing: RecipeIngredient): string {
  const qty = [ing.amount, ing.unit].filter(Boolean).join(" ").trim();
  const base = qty ? `${qty} ${ing.name}` : ing.name;
  return ing.notes ? `${base} (${ing.notes})` : base;
}

function timeParts(prep: number, cook: number): string {
  const bits: string[] = [];
  if (prep > 0) bits.push(`${prep} min prep`);
  if (cook > 0) bits.push(`${cook} min cook`);
  if (bits.length === 0) return "";
  return bits.join(" · ");
}

export default function RecipeDetailClient({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: recipe, isLoading, isError } = trpc.food.getRecipe.useQuery({
    slug,
  });

  usePageTitle({
    title: recipe
      ? `${recipe.title} | Mind & Body Reset`
      : "Recipe | Mind & Body Reset",
    description:
      recipe?.description ||
      "A protein-forward recipe from Lee Anne's vault.",
  });

  const [mealType, setMealType] = useState<MealType | null>(null);
  const [logServings, setLogServings] = useState(1);

  const resolvedMeal = mealType ?? defaultMealType(recipe?.mealSlots ?? []);

  const scale = useMemo(() => {
    const base = recipe?.servings && recipe.servings > 0 ? recipe.servings : 1;
    return logServings / base;
  }, [recipe?.servings, logServings]);

  const toggleFav = trpc.food.toggleFavorite.useMutation({
    onSuccess: (res) => {
      toast.success(res.favorited ? "Saved to favorites" : "Removed from favorites");
      void utils.food.getRecipe.invalidate({ slug });
      void utils.food.listRecipes.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const addLog = trpc.calories.addLog.useMutation({
    onSuccess: () => {
      toast.success("Logged to today's nutrition");
      void utils.calories.getLogs.invalidate();
      void utils.habit.getUserHabits.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const askSignIn = (reason: string) => {
    toast(reason, {
      action: {
        label: "Sign in",
        onClick: () =>
          router.push(`/login?returnTo=/habit-tracker/recipes/${slug}`),
      },
    });
  };

  const onFavorite = () => {
    if (!recipe) return;
    if (!isAuthenticated) {
      askSignIn("Sign in to save favorites");
      return;
    }
    toggleFav.mutate({ recipeId: recipe.id });
  };

  const onLog = () => {
    if (!recipe) return;
    if (!isAuthenticated) {
      askSignIn("Sign in to log this meal");
      return;
    }
    addLog.mutate({
      dateStr: todayMountainDateStr(),
      mealType: resolvedMeal,
      foodName: recipe.title,
      calories: Math.round((recipe.calories || 0) * scale),
      protein: Math.round((recipe.protein || 0) * scale),
      carbs: Math.round((recipe.carbs || 0) * scale),
      fat: Math.round((recipe.fat || 0) * scale),
      fiber: Math.round((recipe.fiber || 0) * scale),
      recipeId: recipe.id,
      servings: logServings,
    });
  };

  return (
    <div className="min-h-screen text-gray-900" style={{ background: CREAM }}>
      <div className="max-w-lg mx-auto px-4 pt-5">
        <FoodHubNav />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" size={28} style={{ color: GOLD }} />
          </div>
        ) : isError || !recipe ? (
          <div
            className="bg-white rounded-3xl border p-8 text-center"
            style={{ borderColor: BORDER }}
          >
            <Utensils size={28} className="mx-auto mb-3" style={{ color: GOLD }} />
            <p
              className="text-lg font-bold mb-1"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
            >
              That recipe isn't in the vault
            </p>
            <p className="text-sm text-[#6b7a6b] mb-4">
              It may have been tucked away. Let's go find another plate.
            </p>
            <Link
              href="/habit-tracker/recipes"
              className="text-xs font-bold underline"
              style={{ color: GOLD }}
            >
              Back to recipes
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <Link
                href="/habit-tracker/recipes"
                className="inline-flex items-center gap-1 text-xs font-bold"
                style={{ color: "#6b7a6b" }}
              >
                <ArrowLeft size={14} />
                Back to recipes
              </Link>
              <button
                type="button"
                aria-label={recipe.isFavorite ? "Remove favorite" : "Save favorite"}
                onClick={onFavorite}
                className="w-10 h-10 rounded-full bg-white border flex items-center justify-center shadow-sm"
                style={{ borderColor: BORDER }}
              >
                <Heart
                  size={18}
                  fill={recipe.isFavorite ? "#c45c5c" : "none"}
                  color={recipe.isFavorite ? "#c45c5c" : FOREST}
                />
              </button>
            </div>

            <div
              className="rounded-3xl overflow-hidden border bg-white shadow-sm mb-4"
              style={{ borderColor: BORDER }}
            >
              <div className="aspect-[4/3] bg-[#f0e8e4]">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils size={40} style={{ color: GOLD }} />
                  </div>
                )}
              </div>

              <div className="p-4">
                <h1
                  className="text-2xl font-bold leading-tight"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
                >
                  {recipe.title}
                </h1>
                {recipe.description ? (
                  <p className="text-sm text-[#6b7a6b] mt-2 leading-relaxed">
                    {recipe.description}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-[#6b7a6b]">
                  {timeParts(recipe.prepMinutes, recipe.cookMinutes) ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} style={{ color: GOLD }} />
                      {timeParts(recipe.prepMinutes, recipe.cookMinutes)}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} style={{ color: GOLD }} />
                    {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
                  </span>
                </div>

                {recipe.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {recipe.tags.map((tid) => (
                      <span
                        key={tid}
                        className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{ background: CREAM, color: "#6b7a6b" }}
                      >
                        {tagLabel(tid)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {recipe.showNutrition ? (
              <div
                className="bg-white rounded-3xl border shadow-sm p-4 mb-4"
                style={{ borderColor: BORDER }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-3">
                  Nutrition
                  {logServings !== recipe.servings
                    ? ` · ${logServings} ${logServings === 1 ? "serving" : "servings"}`
                    : null}
                </p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="bg-[#faf5f5] p-2 rounded-xl">
                    <div className="text-sm font-bold" style={{ color: FOREST }}>
                      {Math.round((recipe.calories || 0) * scale)}
                    </div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">
                      Kcal
                    </div>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: "#eef3ee" }}>
                    <div className="text-sm font-bold" style={{ color: FOREST }}>
                      {Math.round((recipe.protein || 0) * scale)}g
                    </div>
                    <div className="text-[9px] font-bold uppercase" style={{ color: GOLD }}>
                      Pro
                    </div>
                  </div>
                  <div className="bg-[#faf5f5] p-2 rounded-xl">
                    <div className="text-sm font-bold" style={{ color: FOREST }}>
                      {Math.round((recipe.carbs || 0) * scale)}g
                    </div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">
                      Carb
                    </div>
                  </div>
                  <div className="bg-[#faf5f5] p-2 rounded-xl">
                    <div className="text-sm font-bold" style={{ color: FOREST }}>
                      {Math.round((recipe.fat || 0) * scale)}g
                    </div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">
                      Fat
                    </div>
                  </div>
                  <div className="bg-[#faf5f5] p-2 rounded-xl">
                    <div className="text-sm font-bold" style={{ color: FOREST }}>
                      {Math.round((recipe.fiber || 0) * scale)}g
                    </div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">
                      Fiber
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className="bg-white rounded-3xl border shadow-sm p-4 mb-4"
              style={{ borderColor: BORDER }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-3">
                Ingredients
              </p>
              {recipe.ingredients.length === 0 ? (
                <p className="text-sm text-[#6b7a6b]">Ingredients coming soon.</p>
              ) : (
                <ul className="space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={`${ing.name}-${i}`} className="flex gap-2 text-sm">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: GOLD }}
                      />
                      <span style={{ color: FOREST }}>{formatIngredient(ing)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className="bg-white rounded-3xl border shadow-sm p-4 mb-4"
              style={{ borderColor: BORDER }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-3">
                Steps
              </p>
              {recipe.steps.length === 0 ? (
                <p className="text-sm text-[#6b7a6b]">Steps coming soon.</p>
              ) : (
                <ol className="space-y-3">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                        style={{ background: FOREST }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-0.5" style={{ color: FOREST }}>
                        {step.text}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {recipe.notes ? (
              <div
                className="rounded-3xl border p-4 mb-4"
                style={{ borderColor: GOLD, background: "#fbf6ee" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: GOLD }}>
                  Coach notes
                </p>
                <p className="text-sm leading-relaxed" style={{ color: FOREST }}>
                  {recipe.notes}
                </p>
              </div>
            ) : null}

            <div
              className="bg-white rounded-3xl border shadow-sm p-4 mb-2"
              style={{ borderColor: BORDER }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-3">
                Log this meal
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {MEAL_CHIPS.map((c) => {
                  const active = resolvedMeal === c.type;
                  return (
                    <button
                      key={c.type}
                      type="button"
                      onClick={() => setMealType(c.type)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                      style={{
                        borderColor: active ? FOREST : BORDER,
                        background: active ? FOREST : CREAM,
                        color: active ? "white" : FOREST,
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold" style={{ color: "#6b7a6b" }}>
                  Servings
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Fewer servings"
                    onClick={() => setLogServings((n) => Math.max(1, n - 1))}
                    className="w-8 h-8 rounded-full border flex items-center justify-center"
                    style={{ borderColor: BORDER, color: FOREST }}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold" style={{ color: FOREST }}>
                    {logServings}
                  </span>
                  <button
                    type="button"
                    aria-label="More servings"
                    onClick={() => setLogServings((n) => Math.min(12, n + 1))}
                    className="w-8 h-8 rounded-full border flex items-center justify-center"
                    style={{ borderColor: BORDER, color: FOREST }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onLog}
                disabled={addLog.isPending}
                className="w-full rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-70"
                style={{ background: FOREST }}
              >
                {addLog.isPending ? "Logging…" : "Log this meal"}
              </button>
              {!isAuthenticated ? (
                <p className="text-center text-xs text-[#6b7a6b] mt-2">
                  <Link
                    href={`/login?returnTo=/habit-tracker/recipes/${slug}`}
                    className="underline font-bold"
                    style={{ color: FOREST }}
                  >
                    Sign in
                  </Link>{" "}
                  to save it to today's nutrition.
                </p>
              ) : null}
            </div>

            <FatSecretAttribution show={recipe.source === "fatsecret"} />
          </>
        )}
      </div>
    </div>
  );
}
