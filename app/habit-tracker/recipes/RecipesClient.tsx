"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Heart, Loader2, Search, Utensils } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import FoodHubNav from "@/components/habit/FoodHubNav";
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  RECIPE_TAGS,
  type MealSlot,
} from "@shared/food";

const FOREST = "#2d3b2d";
const GOLD = "#c9a96e";
const BORDER = "#f0e8e4";
const CREAM = "#faf5f5";

function tagLabel(id: string): string {
  return RECIPE_TAGS.find((t) => t.id === id)?.label ?? id.replace(/-/g, " ");
}

function minutesLabel(prep: number, cook: number): string | null {
  const p = prep || 0;
  const c = cook || 0;
  if (p + c <= 0) return null;
  if (p && c) return `${p + c} min`;
  return `${p || c} min`;
}

export default function RecipesClient() {
  usePageTitle({
    title: "Recipes | Mind & Body Reset",
    description:
      "Lee Anne's recipe vault — protein-forward meals that quiet food noise.",
  });

  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | undefined>();
  const [mealSlot, setMealSlot] = useState<MealSlot | undefined>();
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 250);
    return () => clearTimeout(t);
  }, [qInput]);

  const { data: recipes, isLoading } = trpc.food.listRecipes.useQuery({
    q: q || undefined,
    tag,
    mealSlot,
    favoritesOnly: isAuthenticated && favoritesOnly ? true : undefined,
  });

  const toggleFav = trpc.food.toggleFavorite.useMutation({
    onSuccess: (res) => {
      toast.success(res.favorited ? "Saved to favorites" : "Removed from favorites");
      void utils.food.listRecipes.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const askSignIn = (reason: string) => {
    toast(reason, {
      action: {
        label: "Sign in",
        onClick: () =>
          router.push("/login?returnTo=/habit-tracker/recipes"),
      },
    });
  };

  const onFavorite = (recipeId: number) => {
    if (!isAuthenticated) {
      askSignIn("Sign in to save favorites");
      return;
    }
    toggleFav.mutate({ recipeId });
  };

  const onFavoritesToggle = () => {
    if (!isAuthenticated) {
      askSignIn("Sign in to see your favorites");
      return;
    }
    setFavoritesOnly((v) => !v);
  };

  const list = recipes ?? [];
  const hasFilters = Boolean(q || tag || mealSlot || favoritesOnly);

  return (
    <div className="min-h-screen text-gray-900" style={{ background: CREAM }}>
      <div className="max-w-lg mx-auto px-4 pt-5">
        <FoodHubNav />

        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">
            The vault
          </p>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
          >
            Recipes
          </h1>
          <p className="text-sm text-[#6b7a6b] mt-0.5">
            Protein-forward plates that keep the noise down.
          </p>
        </div>

        <div
          className="flex items-center gap-2 bg-white rounded-full border px-3.5 py-2.5 mb-3"
          style={{ borderColor: BORDER }}
        >
          <Search size={16} className="shrink-0 text-[#8a9a8a]" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search recipes…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            style={{ color: FOREST }}
            type="search"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-1 -mx-1 px-1">
          {MEAL_SLOTS.map((slot) => {
            const active = mealSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setMealSlot(active ? undefined : slot)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                style={{
                  borderColor: active ? FOREST : BORDER,
                  background: active ? FOREST : "white",
                  color: active ? "white" : FOREST,
                }}
              >
                {MEAL_SLOT_LABELS[slot]}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
          <button
            type="button"
            onClick={onFavoritesToggle}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
            style={{
              borderColor: favoritesOnly ? GOLD : BORDER,
              background: favoritesOnly ? "#f8f1e4" : "white",
              color: FOREST,
            }}
          >
            <Heart
              size={12}
              fill={favoritesOnly ? GOLD : "none"}
              style={{ color: GOLD }}
            />
            Favorites
          </button>
          {RECIPE_TAGS.map((t) => {
            const active = tag === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTag(active ? undefined : t.id)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                style={{
                  borderColor: active ? FOREST : BORDER,
                  background: active ? FOREST : "white",
                  color: active ? "white" : "#6b7a6b",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" size={28} style={{ color: GOLD }} />
          </div>
        ) : list.length === 0 ? (
          <div
            className="bg-white rounded-3xl border p-8 text-center"
            style={{ borderColor: BORDER }}
          >
            <Utensils size={28} className="mx-auto mb-3" style={{ color: GOLD }} />
            <p
              className="text-lg font-bold mb-1"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
            >
              {favoritesOnly
                ? "Nothing hearted yet"
                : hasFilters
                  ? "No matches in the kitchen"
                  : "The kitchen is still warming up"}
            </p>
            <p className="text-sm text-[#6b7a6b] leading-relaxed">
              {favoritesOnly
                ? "Heart a few recipes you want on repeat — they'll gather here."
                : hasFilters
                  ? "Try another tag, or a simpler search. The good food is still here."
                  : "Lee Anne is still stocking the vault. Wander back in a bit."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQInput("");
                  setQ("");
                  setTag(undefined);
                  setMealSlot(undefined);
                  setFavoritesOnly(false);
                }}
                className="mt-4 text-xs font-bold underline"
                style={{ color: GOLD }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((recipe, i) => {
              const mins = minutesLabel(recipe.prepMinutes, recipe.cookMinutes);
              return (
                <motion.article
                  key={recipe.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.24) }}
                  className="relative bg-white rounded-2xl border overflow-hidden shadow-sm"
                  style={{ borderColor: BORDER }}
                >
                  <Link href={`/habit-tracker/recipes/${recipe.slug}`} className="block">
                    <div className="relative aspect-[4/3] bg-[#f0e8e4] overflow-hidden">
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils size={26} style={{ color: GOLD }} />
                        </div>
                      )}
                      {recipe.isFeatured ? (
                        <span
                          className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: GOLD, color: FOREST }}
                        >
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <div className="p-2.5">
                      <h2
                        className="text-sm font-bold leading-snug line-clamp-2"
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          color: FOREST,
                        }}
                      >
                        {recipe.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] text-[#6b7a6b]">
                        {mins ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Clock size={11} style={{ color: GOLD }} />
                            {mins}
                          </span>
                        ) : null}
                        {recipe.protein > 0 ? (
                          <span className="font-bold" style={{ color: FOREST }}>
                            {recipe.protein}g protein
                          </span>
                        ) : null}
                      </div>
                      {recipe.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {recipe.tags.slice(0, 2).map((tid) => (
                            <span
                              key={tid}
                              className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                              style={{ background: CREAM, color: "#6b7a6b" }}
                            >
                              {tagLabel(tid)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                  <button
                    type="button"
                    aria-label={recipe.isFavorite ? "Remove favorite" : "Save favorite"}
                    onClick={() => onFavorite(recipe.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 border flex items-center justify-center shadow-sm"
                    style={{ borderColor: BORDER }}
                  >
                    <Heart
                      size={14}
                      fill={recipe.isFavorite ? "#c45c5c" : "none"}
                      color={recipe.isFavorite ? "#c45c5c" : FOREST}
                    />
                  </button>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
