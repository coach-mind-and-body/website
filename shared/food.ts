/** Shared food-vault types, tags, and helpers. */

export const RECIPE_SOURCES = ["coach", "fatsecret", "imported"] as const;
export type RecipeSource = (typeof RECIPE_SOURCES)[number];

export const MEAL_SLOTS = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "snack2",
] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  snack2: "Snack 2",
};

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const RECIPE_TAGS = [
  { id: "high-protein", label: "High protein" },
  { id: "insulin-friendly", label: "Insulin-friendly" },
  { id: "quiet-food-noise", label: "Quiet food noise" },
  { id: "quick", label: "Quick (≤20 min)" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "dairy-free", label: "Dairy-free" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "one-pan", label: "One-pan" },
  { id: "meal-prep", label: "Meal prep" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
] as const;

export type RecipeTagId = (typeof RECIPE_TAGS)[number]["id"];

export const SHOP_AISLES = [
  "produce",
  "protein",
  "dairy",
  "pantry",
  "frozen",
  "bakery",
  "other",
] as const;
export type ShopAisle = (typeof SHOP_AISLES)[number];

export const SHOP_AISLE_LABELS: Record<ShopAisle, string> = {
  produce: "Produce",
  protein: "Meat & seafood",
  dairy: "Dairy & eggs",
  pantry: "Pantry",
  frozen: "Frozen",
  bakery: "Bakery",
  other: "Other",
};

export type RecipeIngredient = {
  name: string;
  amount: string;
  unit: string;
  notes?: string;
  fatsecretFoodId?: string;
};

export type RecipeStep = {
  text: string;
};

export function slugifyTitle(title: string): string {
  const s = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return s || "recipe";
}

export function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

export function parseStringArray(raw: string | null | undefined): string[] {
  return parseJsonArray<string>(raw).filter((x) => typeof x === "string");
}

export function guessAisle(name: string): ShopAisle {
  const n = name.toLowerCase();
  if (
    /chicken|turkey|beef|pork|salmon|fish|shrimp|tuna|steak|ground turkey|sausage|bacon/.test(
      n
    )
  )
    return "protein";
  if (
    /yogurt|milk|cheese|cottage|butter|cream|egg|kefir|feta|mozzarella|parmesan/.test(
      n
    )
  )
    return "dairy";
  if (
    /spinach|kale|lettuce|tomato|onion|garlic|avocado|berry|berries|apple|banana|lemon|lime|broccoli|pepper|cucumber|carrot|herb|cilantro|parsley|basil|zucchini|mushroom|potato|sweet potato|greens|cabbage|celery/.test(
      n
    )
  )
    return "produce";
  if (/bread|tortilla|wrap|bagel|bun|pita/.test(n)) return "bakery";
  if (/frozen/.test(n)) return "frozen";
  if (
    /oil|salt|pepper|spice|rice|quinoa|oat|bean|lentil|chickpea|pasta|vinegar|sauce|honey|almond|walnut|seed|flour|broth|stock|can |canned|olive/.test(
      n
    )
  )
    return "pantry";
  return "other";
}

export function normalizeIngredientName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export const FATSECRET_ATTRIBUTION_URL = "https://www.fatsecret.com";
export const FATSECRET_ATTRIBUTION_TEXT = "Powered by fatsecret Platform API";

/** Short copy so calorie logging explains AI vs the packaged-food database. */
export const FOOD_LOG_HINTS = {
  empty:
    "Tap a meal to log. Homemade or leftovers → ✨ AI or a photo. A bar, yogurt cup, or restaurant item → search packaged foods.",
  emptyAiOnly:
    "Tap a meal. Type what you ate and tap ✨ AI, snap a photo, or enter protein yourself.",
  chooser:
    "Homemade or leftovers → type it and tap ✨ AI, or snap a photo. Packaged or restaurant food → search the database.",
  aiLabel: "Homemade or leftovers",
  aiHint: "Type what you ate, then tap ✨ AI. You can tweak the numbers.",
  aiPlaceholder: "e.g. leftover chicken + broccoli",
  photoHint: "Snap the plate if you don’t want to type. Same AI estimate.",
  packagedLabel: "Packaged or restaurant food",
  packagedHint: "Search the food database for bars, yogurt cups, and labeled items.",
  packagedPlaceholder: "Search packaged foods…",
} as const;
