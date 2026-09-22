import type { RecipeIngredient, RecipeStep } from "@shared/food";

export type StarterRecipe = {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  mealSlots: string[];
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  notes: string;
};

export const STARTER_RECIPES: StarterRecipe[] = [
  {
    slug: "greek-yogurt-berry-bowl",
    title: "Greek Yogurt Berry Bowl",
    description:
      "A quiet, high-protein breakfast that actually keeps you full until lunch — no cereal crash.",
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    tags: ["breakfast", "high-protein", "insulin-friendly", "quiet-food-noise", "quick"],
    mealSlots: ["breakfast", "snack"],
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    calories: 320,
    protein: 28,
    carbs: 28,
    fat: 10,
    fiber: 5,
    ingredients: [
      { name: "plain Greek yogurt (2%)", amount: "1", unit: "cup" },
      { name: "mixed berries", amount: "3/4", unit: "cup" },
      { name: "chia seeds", amount: "1", unit: "tbsp" },
      { name: "sliced almonds", amount: "1", unit: "tbsp" },
    ],
    steps: [
      { text: "Spoon yogurt into a bowl." },
      { text: "Top with berries, chia, and almonds." },
      { text: "Eat slowly. That's the whole recipe." },
    ],
    notes: "If dairy is loud for you, swap in unsweetened coconut yogurt and add a scoop of protein powder.",
  },
  {
    slug: "peach-cottage-cheese-bowl",
    title: "Peach Cottage Cheese Bowl",
    description: "Sweet enough to feel like a treat. Protein enough to quiet the 10 a.m. hunt.",
    imageUrl:
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1200&q=80",
    tags: ["breakfast", "high-protein", "insulin-friendly", "quick"],
    mealSlots: ["breakfast", "snack"],
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    calories: 280,
    protein: 26,
    carbs: 22,
    fat: 9,
    fiber: 3,
    ingredients: [
      { name: "cottage cheese (2%)", amount: "1", unit: "cup" },
      { name: "peach, sliced", amount: "1", unit: "" },
      { name: "cinnamon", amount: "1/4", unit: "tsp" },
      { name: "chopped walnuts", amount: "1", unit: "tbsp" },
    ],
    steps: [
      { text: "Scoop cottage cheese into a bowl." },
      { text: "Add peach slices, cinnamon, and walnuts." },
    ],
    notes: "Frozen peaches work. Thaw or microwave 30 seconds.",
  },
  {
    slug: "veggie-scramble-sweet-potato",
    title: "Veggie Scramble with Sweet Potato",
    description: "Eggs, greens, and a little sweet potato so breakfast has staying power.",
    imageUrl:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80",
    tags: ["breakfast", "high-protein", "insulin-friendly", "gluten-free", "vegetarian"],
    mealSlots: ["breakfast", "lunch"],
    prepMinutes: 8,
    cookMinutes: 12,
    servings: 1,
    calories: 410,
    protein: 24,
    carbs: 28,
    fat: 22,
    fiber: 5,
    ingredients: [
      { name: "eggs", amount: "2", unit: "" },
      { name: "egg whites", amount: "2", unit: "" },
      { name: "sweet potato, diced", amount: "1/2", unit: "cup" },
      { name: "spinach", amount: "1", unit: "handful" },
      { name: "olive oil", amount: "1", unit: "tsp" },
      { name: "salt and pepper", amount: "", unit: "to taste" },
    ],
    steps: [
      { text: "Sauté sweet potato in oil over medium heat until tender, about 8 minutes." },
      { text: "Add spinach until wilted." },
      { text: "Pour in beaten eggs and whites. Soft-scramble. Season." },
    ],
    notes: "Batch-roast sweet potato on Sunday and this is a 5-minute breakfast.",
  },
  {
    slug: "salmon-greens-plate",
    title: "Salmon & Greens Plate",
    description: "Omega-3s, protein, and a pile of greens. Dinner that doesn't start a negotiation.",
    imageUrl:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
    tags: ["dinner", "high-protein", "insulin-friendly", "gluten-free", "one-pan"],
    mealSlots: ["lunch", "dinner"],
    prepMinutes: 8,
    cookMinutes: 15,
    servings: 2,
    calories: 480,
    protein: 36,
    carbs: 12,
    fat: 32,
    fiber: 4,
    ingredients: [
      { name: "salmon fillets", amount: "2", unit: "(5 oz)" },
      { name: "olive oil", amount: "1", unit: "tbsp" },
      { name: "lemon", amount: "1/2", unit: "" },
      { name: "mixed greens", amount: "4", unit: "cups" },
      { name: "cucumber, sliced", amount: "1/2", unit: "" },
      { name: "salt, pepper, garlic powder", amount: "", unit: "to taste" },
    ],
    steps: [
      { text: "Pat salmon dry. Season with salt, pepper, and garlic powder." },
      { text: "Pan-sear skin-side down 5–6 minutes, flip 2–3 minutes." },
      { text: "Plate over greens and cucumber. Squeeze lemon and drizzle oil." },
    ],
    notes: "Canned salmon works when you don't want to cook.",
  },
  {
    slug: "turkey-avocado-lettuce-wraps",
    title: "Turkey & Avocado Lettuce Wraps",
    description: "Crunchy, filling, and gone in ten minutes. Lunch without a food coma.",
    imageUrl:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80",
    tags: ["lunch", "high-protein", "insulin-friendly", "quick", "gluten-free"],
    mealSlots: ["lunch", "snack"],
    prepMinutes: 10,
    cookMinutes: 0,
    servings: 1,
    calories: 360,
    protein: 28,
    carbs: 10,
    fat: 22,
    fiber: 7,
    ingredients: [
      { name: "romaine or butter lettuce leaves", amount: "4", unit: "large" },
      { name: "sliced turkey breast", amount: "4", unit: "oz" },
      { name: "avocado", amount: "1/2", unit: "" },
      { name: "tomato, sliced", amount: "1/2", unit: "" },
      { name: "mustard", amount: "1", unit: "tsp" },
    ],
    steps: [
      { text: "Lay out lettuce leaves." },
      { text: "Layer turkey, avocado, tomato, and mustard." },
      { text: "Wrap and eat immediately so the lettuce stays crisp." },
    ],
    notes: "If lettuce wraps frustrate you, use a high-fiber tortilla. No morality either way.",
  },
  {
    slug: "chicken-quinoa-roasted-veg",
    title: "Chicken, Quinoa & Roasted Veg",
    description: "The Sunday-prep plate. Portion it, refrigerate, stop deciding at 6 p.m.",
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    tags: ["dinner", "lunch", "high-protein", "meal-prep", "insulin-friendly"],
    mealSlots: ["lunch", "dinner"],
    prepMinutes: 15,
    cookMinutes: 30,
    servings: 4,
    calories: 450,
    protein: 38,
    carbs: 36,
    fat: 14,
    fiber: 7,
    ingredients: [
      { name: "chicken breasts", amount: "1.5", unit: "lb" },
      { name: "quinoa, dry", amount: "1", unit: "cup" },
      { name: "broccoli florets", amount: "3", unit: "cups" },
      { name: "bell peppers, chopped", amount: "2", unit: "" },
      { name: "olive oil", amount: "2", unit: "tbsp" },
      { name: "garlic powder, paprika, salt", amount: "", unit: "to taste" },
    ],
    steps: [
      { text: "Heat oven to 425°F. Toss veg with 1 tbsp oil and salt. Roast 20–25 min." },
      { text: "Season chicken and roast or skillet-cook until 165°F. Rest and slice." },
      { text: "Cook quinoa per package. Divide everything into 4 containers." },
    ],
    notes: "Swap quinoa for cauliflower rice if you want a lower-carb week.",
  },
  {
    slug: "lentil-vegetable-soup",
    title: "Lentil Vegetable Soup",
    description: "Fiber, protein, and a pot that feeds you all week. Midlife gold.",
    imageUrl:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
    tags: ["dinner", "lunch", "vegetarian", "meal-prep", "insulin-friendly"],
    mealSlots: ["lunch", "dinner"],
    prepMinutes: 15,
    cookMinutes: 35,
    servings: 6,
    calories: 290,
    protein: 16,
    carbs: 42,
    fat: 6,
    fiber: 14,
    ingredients: [
      { name: "dry brown or green lentils", amount: "1.5", unit: "cups" },
      { name: "onion, diced", amount: "1", unit: "" },
      { name: "carrots, diced", amount: "2", unit: "" },
      { name: "celery stalks, diced", amount: "2", unit: "" },
      { name: "garlic cloves, minced", amount: "3", unit: "" },
      { name: "diced tomatoes", amount: "1", unit: "can (14 oz)" },
      { name: "vegetable broth", amount: "6", unit: "cups" },
      { name: "olive oil", amount: "1", unit: "tbsp" },
      { name: "cumin, salt, pepper", amount: "", unit: "to taste" },
    ],
    steps: [
      { text: "Sauté onion, carrot, celery, and garlic in oil until soft." },
      { text: "Add lentils, tomatoes, broth, and cumin. Simmer 30 minutes until tender." },
      { text: "Season. Freeze extra portions." },
    ],
    notes: "A squeeze of lemon at the end wakes the whole pot up.",
  },
  {
    slug: "apple-almond-butter",
    title: "Apple + Almond Butter",
    description: "The snack that ends the pantry tour. Crunch plus fat plus fiber.",
    imageUrl:
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=1200&q=80",
    tags: ["snack", "quick", "quiet-food-noise", "vegetarian"],
    mealSlots: ["snack", "snack2"],
    prepMinutes: 3,
    cookMinutes: 0,
    servings: 1,
    calories: 240,
    protein: 6,
    carbs: 26,
    fat: 14,
    fiber: 6,
    ingredients: [
      { name: "apple", amount: "1", unit: "medium" },
      { name: "almond butter", amount: "1.5", unit: "tbsp" },
    ],
    steps: [
      { text: "Slice the apple. Dip or spread the almond butter. Sit down to eat it." },
    ],
    notes: "Measure the almond butter. The jar is not a serving size.",
  },
  {
    slug: "overnight-protein-oats",
    title: "Overnight Protein Oats",
    description: "Make it the night before so morning-you doesn't have to think.",
    imageUrl:
      "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=1200&q=80",
    tags: ["breakfast", "high-protein", "meal-prep", "vegetarian"],
    mealSlots: ["breakfast"],
    prepMinutes: 8,
    cookMinutes: 0,
    servings: 1,
    calories: 390,
    protein: 27,
    carbs: 42,
    fat: 12,
    fiber: 8,
    ingredients: [
      { name: "rolled oats", amount: "1/2", unit: "cup" },
      { name: "unsweetened almond milk", amount: "1/2", unit: "cup" },
      { name: "plain Greek yogurt", amount: "1/2", unit: "cup" },
      { name: "vanilla protein powder", amount: "1", unit: "scoop" },
      { name: "chia seeds", amount: "1", unit: "tbsp" },
      { name: "berries", amount: "1/2", unit: "cup" },
    ],
    steps: [
      { text: "Stir oats, milk, yogurt, protein, and chia in a jar." },
      { text: "Refrigerate overnight. Top with berries in the morning." },
    ],
    notes: "If oats spike you, try 1/4 cup oats + extra yogurt and chia.",
  },
  {
    slug: "sheet-pan-chicken-broccoli",
    title: "Sheet Pan Chicken & Broccoli",
    description: "One pan, twenty-five minutes, dishes you'll actually do.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80",
    tags: ["dinner", "high-protein", "one-pan", "quick", "gluten-free", "insulin-friendly"],
    mealSlots: ["dinner", "lunch"],
    prepMinutes: 10,
    cookMinutes: 22,
    servings: 3,
    calories: 420,
    protein: 40,
    carbs: 14,
    fat: 22,
    fiber: 5,
    ingredients: [
      { name: "chicken thighs, boneless", amount: "1.25", unit: "lb" },
      { name: "broccoli florets", amount: "5", unit: "cups" },
      { name: "olive oil", amount: "2", unit: "tbsp" },
      { name: "garlic powder", amount: "1", unit: "tsp" },
      { name: "smoked paprika", amount: "1", unit: "tsp" },
      { name: "salt and pepper", amount: "", unit: "to taste" },
    ],
    steps: [
      { text: "Heat oven to 425°F. Toss chicken and broccoli with oil and spices on a sheet pan." },
      { text: "Roast 20–24 minutes until chicken is cooked through and broccoli is charred at the edges." },
    ],
    notes: "Leftovers become tomorrow's lunch over leftover quinoa or greens.",
  },
];

function challengeRecipe(
  slug: string,
  title: string,
  mealSlots: string[],
  ingredients: RecipeIngredient[],
  steps: string[],
  extras: Partial<StarterRecipe> = {}
): StarterRecipe {
  return {
    slug,
    title,
    description: extras.description ?? `From the 5-Day No Processed Food Challenge recipe bundle.`,
    imageUrl: extras.imageUrl ?? "",
    tags: extras.tags ?? ["challenge", "whole-food", ...mealSlots],
    mealSlots,
    prepMinutes: extras.prepMinutes ?? 10,
    cookMinutes: extras.cookMinutes ?? 15,
    servings: extras.servings ?? 1,
    calories: extras.calories ?? 0,
    protein: extras.protein ?? 0,
    carbs: extras.carbs ?? 0,
    fat: extras.fat ?? 0,
    fiber: extras.fiber ?? 0,
    ingredients,
    steps: steps.map((text) => ({ text })),
    notes: extras.notes ?? "Whole-food version from the challenge bundle. Adjust salt and heat to taste.",
  };
}

/** Challenge bundle recipes — also live in the main vault after the 5 days. */
export const CHALLENGE_RECIPES: StarterRecipe[] = [
  challengeRecipe(
    "eggs-broccoli-slaw-salad",
    "Eggs and Broccoli Slaw Salad",
    ["breakfast"],
    [
      { name: "eggs", amount: "2", unit: "" },
      { name: "broccoli slaw", amount: "2", unit: "cups" },
      { name: "olive oil", amount: "1", unit: "tbsp" },
      { name: "lemon juice", amount: "1", unit: "tsp" },
    ],
    ["Cook eggs how you like (scrambled, fried, or hard-boiled).", "Toss slaw with olive oil and lemon.", "Plate eggs over the slaw."]
  ),
  challengeRecipe(
    "green-egg-scramble",
    "Green Egg Scramble",
    ["breakfast"],
    [
      { name: "eggs", amount: "2-3", unit: "" },
      { name: "spinach or mixed greens", amount: "2", unit: "cups" },
      { name: "olive oil or butter", amount: "1", unit: "tsp" },
    ],
    ["Wilt greens in a little oil.", "Add beaten eggs and scramble until just set.", "Salt and pepper. Eat."]
  ),
  challengeRecipe(
    "turkey-sausage-cucumber-tomato",
    "Turkey Sausage with Cucumber Tomato Salad",
    ["breakfast"],
    [
      { name: "turkey sausage", amount: "2", unit: "links" },
      { name: "cucumber", amount: "1", unit: "" },
      { name: "tomato", amount: "1", unit: "" },
      { name: "olive oil", amount: "1", unit: "tsp" },
    ],
    ["Cook sausage.", "Chop cucumber and tomato, toss with oil and salt.", "Serve together."]
  ),
  challengeRecipe(
    "vibrant-breakfast-plate",
    "Vibrant Breakfast Plate",
    ["breakfast"],
    [
      { name: "eggs", amount: "2", unit: "" },
      { name: "avocado", amount: "1/2", unit: "" },
      { name: "berries or tomato", amount: "1/2", unit: "cup" },
    ],
    ["Cook eggs.", "Add avocado and fruit or tomato on the side.", "That's a protein + fat + fiber plate."]
  ),
  challengeRecipe(
    "lettuce-wrapped-turkey-burger",
    "Lettuce Wrapped Turkey Burger",
    ["lunch"],
    [
      { name: "ground turkey", amount: "4-6", unit: "oz" },
      { name: "large lettuce leaves", amount: "2-3", unit: "" },
      { name: "tomato, onion, mustard", amount: "", unit: "to taste" },
    ],
    ["Form and cook the turkey patty.", "Wrap in lettuce with tomato and onion.", "Skip the bun."]
  ),
  challengeRecipe(
    "mediterranean-salmon-salad",
    "Mediterranean Salmon Salad",
    ["lunch"],
    [
      { name: "cooked salmon", amount: "4", unit: "oz" },
      { name: "mixed greens", amount: "3", unit: "cups" },
      { name: "cucumber, tomato, olives", amount: "", unit: "handful" },
      { name: "olive oil + lemon", amount: "1", unit: "tbsp" },
    ],
    ["Flake salmon over greens.", "Add vegetables.", "Dress with olive oil and lemon."]
  ),
  challengeRecipe(
    "mouth-watering-shrimp-salad",
    "Mouth Watering Shrimp Salad",
    ["lunch"],
    [
      { name: "shrimp, cooked", amount: "4-6", unit: "oz" },
      { name: "greens", amount: "3", unit: "cups" },
      { name: "avocado", amount: "1/4", unit: "" },
      { name: "olive oil", amount: "1", unit: "tbsp" },
    ],
    ["Warm shrimp if needed.", "Pile on greens with avocado.", "Drizzle oil, salt, pepper."]
  ),
  challengeRecipe(
    "nashville-hot-chicken-salad",
    "Nashville Hot Chicken Salad",
    ["lunch"],
    [
      { name: "cooked chicken", amount: "4-6", unit: "oz" },
      { name: "greens", amount: "3", unit: "cups" },
      { name: "hot paprika or cayenne + olive oil", amount: "1", unit: "tsp" },
    ],
    ["Toss chicken with a little oil and heat.", "Serve over greens.", "Keep the heat, skip the breading."]
  ),
  challengeRecipe(
    "edamame-snack",
    "Edamame",
    ["snack"],
    [{ name: "shelled edamame", amount: "1", unit: "cup" }],
    ["Steam or microwave until hot.", "Salt. That's the snack."],
    { prepMinutes: 2, cookMinutes: 5 }
  ),
  challengeRecipe(
    "orange-dry-roasted-nuts",
    "Orange with Dry Roasted Mixed Nuts",
    ["snack"],
    [
      { name: "orange", amount: "1", unit: "" },
      { name: "dry roasted mixed nuts (no sugar)", amount: "1", unit: "oz" },
    ],
    ["Peel the orange.", "Eat with a small handful of nuts."],
    { prepMinutes: 2, cookMinutes: 0 }
  ),
  challengeRecipe(
    "chicken-burrito-bowl",
    "Chicken Burrito Bowl",
    ["dinner"],
    [
      { name: "cooked chicken", amount: "4-6", unit: "oz" },
      { name: "cauliflower rice or leftover rice", amount: "1", unit: "cup" },
      { name: "black beans", amount: "1/2", unit: "cup" },
      { name: "salsa, lettuce, avocado", amount: "", unit: "to taste" },
    ],
    ["Warm chicken, beans, and rice.", "Top with salsa, lettuce, and avocado.", "No tortilla needed."]
  ),
  challengeRecipe(
    "curried-chicken-meatballs",
    "Curried Chicken Meatballs",
    ["dinner"],
    [
      { name: "ground chicken", amount: "1", unit: "lb" },
      { name: "curry powder", amount: "1-2", unit: "tsp" },
      { name: "egg", amount: "1", unit: "" },
      { name: "vegetables for serving", amount: "", unit: "" },
    ],
    ["Mix chicken, curry, egg, salt.", "Roll into meatballs and bake at 400°F until cooked through (~18 min).", "Serve with vegetables."],
    { servings: 4, cookMinutes: 20 }
  ),
  challengeRecipe(
    "hearty-vegetable-chili",
    "Hearty Vegetable Chili",
    ["dinner"],
    [
      { name: "onion, peppers, garlic", amount: "", unit: "to sauté" },
      { name: "canned tomatoes", amount: "1", unit: "can" },
      { name: "beans (kidney or black)", amount: "1", unit: "can" },
      { name: "chili powder", amount: "1", unit: "tbsp" },
    ],
    ["Sauté onion, peppers, garlic.", "Add tomatoes, beans, chili powder, simmer 20 minutes.", "Taste for salt."],
    { servings: 4, cookMinutes: 25 }
  ),
  challengeRecipe(
    "salmon-mango-salsa",
    "Salmon with Mango Salsa",
    ["dinner"],
    [
      { name: "salmon fillet", amount: "5", unit: "oz" },
      { name: "mango, diced", amount: "1/2", unit: "" },
      { name: "red onion, cilantro, lime", amount: "", unit: "to taste" },
    ],
    ["Bake or pan-sear salmon.", "Toss mango with onion, cilantro, lime.", "Spoon salsa over the fish."]
  ),
];
