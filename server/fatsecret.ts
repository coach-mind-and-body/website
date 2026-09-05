import { createHmac, randomBytes } from "crypto";
import { ENV } from "./_core/env";

const API_URL = "https://platform.fatsecret.com/rest/server.api";

export function fatsecretConfigured(): boolean {
  return Boolean(ENV.fatsecretClientId && fatsecretSigningSecret());
}

function fatsecretSigningSecret(): string {
  // Basic tier IP-locks OAuth 2.0. OAuth 1.0 (Consumer Secret) does not.
  return ENV.fatsecretConsumerSecret || ENV.fatsecretClientSecret;
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** RFC 3986 percent-encoding used in OAuth 1.0 signature base strings. */
function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

async function fatsecretCall(params: Record<string, string>): Promise<unknown> {
  if (!fatsecretConfigured()) {
    throw new Error(
      "FatSecret is not configured. Add FATSECRET_CLIENT_ID and FATSECRET_CONSUMER_SECRET."
    );
  }

  const oauth: Record<string, string> = {
    ...params,
    format: "json",
    oauth_consumer_key: ENV.fatsecretClientId,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: "1.0",
  };

  const normalized = Object.keys(oauth)
    .sort()
    .map((key) => `${rfc3986(key)}=${rfc3986(oauth[key]!)}`)
    .join("&");
  const base = `POST&${rfc3986(API_URL)}&${rfc3986(normalized)}`;
  const signature = createHmac("sha1", `${fatsecretSigningSecret()}&`)
    .update(base)
    .digest("base64");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...oauth, oauth_signature: signature }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FatSecret API failed (${res.status}): ${text.slice(0, 240)}`);
  }
  return res.json();
}

export type FatSecretRecipeHit = {
  recipeId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  types: string[];
};

export type FatSecretRecipeDetail = FatSecretRecipeHit & {
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  fiber: number;
  ingredientsDetailed: {
    name: string;
    amount: string;
    unit: string;
    foodId?: string;
  }[];
  steps: { text: string }[];
};

export type FatSecretFoodHit = {
  foodId: string;
  name: string;
  brand: string | null;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

export async function searchRecipes(
  query: string,
  page = 0
): Promise<{ recipes: FatSecretRecipeHit[]; total: number; page: number }> {
  const data = (await fatsecretCall({
    method: "recipes.search.v3",
    search_expression: query,
    page_number: String(page),
    max_results: "20",
    must_have_images: "true",
  })) as {
    recipes?: {
      total_results?: string;
      page_number?: string;
      recipe?: unknown;
    };
    error?: { message?: string };
  };

  if (data.error?.message) throw new Error(data.error.message);

  const raw = asArray(data.recipes?.recipe) as Record<string, unknown>[];
  const recipes: FatSecretRecipeHit[] = raw.map((r) => {
    const nutrition = (r.recipe_nutrition ?? {}) as Record<string, unknown>;
    const ingredients = asArray(
      (r.recipe_ingredients as { ingredient?: unknown } | undefined)?.ingredient
    ).map(String);
    const types = asArray(
      (r.recipe_types as { recipe_type?: unknown } | undefined)?.recipe_type
    ).map(String);
    return {
      recipeId: String(r.recipe_id ?? ""),
      name: String(r.recipe_name ?? "Untitled"),
      description: String(r.recipe_description ?? ""),
      imageUrl: r.recipe_image ? String(r.recipe_image) : null,
      calories: Math.round(num(nutrition.calories)),
      protein: Math.round(num(nutrition.protein)),
      carbs: Math.round(num(nutrition.carbohydrate)),
      fat: Math.round(num(nutrition.fat)),
      ingredients,
      types,
    };
  });

  return {
    recipes,
    total: parseInt(String(data.recipes?.total_results ?? recipes.length), 10) || 0,
    page: parseInt(String(data.recipes?.page_number ?? page), 10) || 0,
  };
}

export async function getRecipe(recipeId: string): Promise<FatSecretRecipeDetail> {
  const data = (await fatsecretCall({
    method: "recipe.get.v2",
    recipe_id: recipeId,
  })) as { recipe?: Record<string, unknown>; error?: { message?: string } };

  if (data.error?.message) throw new Error(data.error.message);
  const r = data.recipe;
  if (!r) throw new Error("Recipe not found");

  const serving = asArray(
    (r.serving_sizes as { serving?: unknown } | undefined)?.serving
  )[0] as Record<string, unknown> | undefined;

  const ingredientsRaw = asArray(
    (r.ingredients as { ingredient?: unknown } | undefined)?.ingredient
  ) as Record<string, unknown>[];

  const directionsRaw = asArray(
    (r.directions as { direction?: unknown } | undefined)?.direction
  ) as Record<string, unknown>[];

  const types = asArray(
    (r.recipe_types as { recipe_type?: unknown } | undefined)?.recipe_type
  ).map(String);

  const ingredientsDetailed = ingredientsRaw.map((ing) => {
    const desc = String(ing.ingredient_description ?? ing.food_name ?? "Ingredient");
    return {
      name: desc,
      amount: String(ing.number_of_units ?? ""),
      unit: String(ing.measurement_description ?? ""),
      foodId: ing.food_id ? String(ing.food_id) : undefined,
    };
  });

  return {
    recipeId: String(r.recipe_id ?? recipeId),
    name: String(r.recipe_name ?? "Untitled"),
    description: String(r.recipe_description ?? ""),
    imageUrl: r.recipe_image ? String(r.recipe_image) : null,
    calories: Math.round(num(serving?.calories)),
    protein: Math.round(num(serving?.protein)),
    carbs: Math.round(num(serving?.carbohydrate)),
    fat: Math.round(num(serving?.fat)),
    fiber: Math.round(num(serving?.fiber)),
    ingredients: ingredientsDetailed.map((i) => i.name),
    types,
    servings: Math.max(1, Math.round(num(r.number_of_servings) || 1)),
    prepMinutes: Math.round(num(r.preparation_time_min)),
    cookMinutes: Math.round(num(r.cooking_time_min)),
    ingredientsDetailed,
    steps: directionsRaw
      .sort((a, b) => num(a.direction_number) - num(b.direction_number))
      .map((d) => ({ text: String(d.direction_description ?? "").trim() }))
      .filter((s) => s.text),
  };
}

export async function searchFoods(
  query: string,
  page = 0
): Promise<{ foods: FatSecretFoodHit[]; total: number; page: number }> {
  const data = (await fatsecretCall({
    method: "foods.search",
    search_expression: query,
    page_number: String(page),
    max_results: "20",
  })) as {
    foods?: { total_results?: string; page_number?: string; food?: unknown };
    error?: { message?: string };
  };

  if (data.error?.message) throw new Error(data.error.message);

  const raw = asArray(data.foods?.food) as Record<string, unknown>[];
  const foods: FatSecretFoodHit[] = raw.map((f) => {
    const servings = asArray(
      (f.servings as { serving?: unknown } | undefined)?.serving
    ) as Record<string, unknown>[];
    const s = servings[0] ?? {};
    const desc = String(f.food_description ?? "");
    const parsed = parseFoodDescription(desc);
    return {
      foodId: String(f.food_id ?? ""),
      name: String(f.food_name ?? "Food"),
      brand: f.brand_name ? String(f.brand_name) : null,
      description: desc,
      calories: Math.round(num(s.calories) || parsed.calories),
      protein: Math.round(num(s.protein) || parsed.protein),
      carbs: Math.round(num(s.carbohydrate) || parsed.carbs),
      fat: Math.round(num(s.fat) || parsed.fat),
    };
  });

  return {
    foods,
    total: parseInt(String(data.foods?.total_results ?? foods.length), 10) || 0,
    page: parseInt(String(data.foods?.page_number ?? page), 10) || 0,
  };
}

function parseFoodDescription(desc: string): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const cal = /Calories:\s*([\d.]+)kcal/i.exec(desc);
  const fat = /Fat:\s*([\d.]+)g/i.exec(desc);
  const carbs = /Carbs:\s*([\d.]+)g/i.exec(desc);
  const protein = /Protein:\s*([\d.]+)g/i.exec(desc);
  return {
    calories: cal ? Math.round(parseFloat(cal[1])) : 0,
    fat: fat ? Math.round(parseFloat(fat[1])) : 0,
    carbs: carbs ? Math.round(parseFloat(carbs[1])) : 0,
    protein: protein ? Math.round(parseFloat(protein[1])) : 0,
  };
}
