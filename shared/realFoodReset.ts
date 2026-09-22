import { SITE_URL } from "./brand";

export const REAL_FOOD_RESET_THEME = "real_food_reset";
export const REAL_FOOD_RESET_CLAIM_KEY = "mbr_rfr_claim";
export const REAL_FOOD_RESET_SEQUENCE_ID = "real_food_reset_days";
export const REAL_FOOD_RESET_OFFER_SEQUENCE_ID = "real_food_reset_offer";

export type RealFoodResetDayFormat = "live" | "video";

export type RealFoodResetDay = {
  n: number;
  dateStr: string;
  weekday: string;
  title: string;
  win: string;
  format: RealFoodResetDayFormat;
  formatLabel: string;
  assignmentTitle: string;
  assignmentSteps: string[];
  journal: { noticed: string; glad: string; hard: string };
};

/** FREE 5-Day No Processed Food Challenge — Sept 28–Oct 2, 2026 */
export const REAL_FOOD_RESET = {
  name: "The 5-Day No Processed Food Challenge",
  shortName: "No Processed Food Challenge",
  hosts: "Lee Anne & Sara",
  path: "/real-food-reset",
  thankYouPath: "/real-food-reset/thank-you",
  trackerPath: "/habit-tracker",
  themeTag: REAL_FOOD_RESET_THEME,
  startLabel: "September 28",
  startDate: "2026-09-28",
  endDate: "2026-10-02",
  endLabel: "October 2",
  liveTime: "1:00 pm Mountain",
  liveTimeShort: "1:00 pm",
  liveDays: "Monday, Wednesday, and Friday",
  liveDuration: "1 hour",
  meetUrl: "https://meet.google.com/ppv-kose-wyj",
  meetPhone: "+1 424-360-0732",
  meetPin: "203 858 286",
  offerClosesDate: "2026-11-01",
  offerClosesLabel: "November 1",
  paidProgram: "6 Habits in 6 Weeks to Quiet Food Noise",
  paidPrice: "$597",
  paidProgramPath: "/reclaim-invite",
  segment: "leadgen_real_food_reset",
  welcomeVideoId: "-c7-sQUW46M",
  welcomeVideoUrl: "https://youtube.com/shorts/-c7-sQUW46M",
  welcomeVideoWatchUrl: "https://www.youtube.com/watch?v=-c7-sQUW46M",
  philosophy: "The goal isn’t more food rules. It’s more food confidence.",
  days: [
    {
      n: 1,
      dateStr: "2026-09-28",
      weekday: "Monday, Sept 28",
      title: "Start seeing",
      win: "Notice where ultra-processed food shows up — then swap one.",
      format: "live" as const,
      formatLabel: "Live · 1:00 pm Mountain",
      assignmentTitle: "NOTICE → SWAP ONE → TRACK",
      assignmentSteps: [
        "NOTICE: Where are ultra-processed foods showing up in your normal routine?",
        "SWAP ONE: Choose one food today and try a whole or minimally processed alternative.",
        "TRACK: Write down what you eat and what you notice. Logging a meal counts.",
      ],
      journal: {
        noticed: "The ultra-processed food I didn’t realize I ate so regularly was:",
        glad: "One swap I tried today:",
        hard: "What surprised me — hunger, cravings, energy, habits, or thoughts:",
      },
    },
    {
      n: 2,
      dateStr: "2026-09-29",
      weekday: "Tuesday, Sept 29",
      title: "Flip it",
      win: "Turn two packages around and choose with information, not the front of the box.",
      format: "video" as const,
      formatLabel: "Video + recipes in the app",
      assignmentTitle: "FLIP IT challenge",
      assignmentSteps: [
        "Pick TWO similar products you actually buy (yogurt, bars, bread, cereal, creamer…).",
        "Flip both packages. Compare ingredients, added sugar, serving size, protein, fiber, carbs, and fat.",
        "Answer: What surprised me? Which would I choose now — and WHY?",
      ],
      journal: {
        noticed: "What two products did I compare, and what surprised me?",
        glad: "Which would I choose now — and WHY?",
        hard: "Did knowing what’s in the food make the choice easy, or was I still negotiating?",
      },
    },
    {
      n: 3,
      dateStr: "2026-09-30",
      weekday: "Wednesday, Sept 30",
      title: "Sugar detective",
      win: "Find added sugar in foods you actually eat — no food police.",
      format: "live" as const,
      formatLabel: "Live · 1:00 pm Mountain",
      assignmentTitle: "Find 3 foods with added sugar",
      assignmentSteps: [
        "Find 3 foods you regularly eat that list Added Sugars.",
        "For each: name, grams of added sugar per serving, and one sweetener name in the ingredients.",
        "Then choose: KEEP IT, SWAP IT, or CHOOSE IT INTENTIONALLY.",
      ],
      journal: {
        noticed: "Three foods with added sugar I found (and whether I expected it):",
        glad: "KEEP / SWAP / CHOOSE INTENTIONALLY — what I decided:",
        hard: "Biggest “wait… there’s sugar in THAT?” moment:",
      },
    },
    {
      n: 4,
      dateStr: "2026-10-01",
      weekday: "Thursday, Oct 1",
      title: "Build it",
      win: "One real plate: protein + fat + fiber. Snap it. Notice how you feel.",
      format: "video" as const,
      formatLabel: "Video + recipes in the app",
      assignmentTitle: "BUILD IT → SNAP IT → SHARE IT",
      assignmentSteps: [
        "Build ONE meal (breakfast, lunch, or dinner) with protein + fat + fiber. No calorie counting.",
        "Take a picture before you eat — ugly broccoli and paper plates count.",
        "Write what was on the plate and what you noticed afterward. Bonus: where do you still get stuck even when you know what to eat?",
      ],
      journal: {
        noticed: "My protein / fat / fiber on this meal:",
        glad: "Something I noticed after eating it:",
        hard: "If I already know what to eat, where do I STILL get stuck?",
      },
    },
    {
      n: 5,
      dateStr: "2026-10-02",
      weekday: "Friday, Oct 2",
      title: "Keep going",
      win: "Eating out, swaps, and how you keep going when life isn’t perfect.",
      format: "live" as const,
      formatLabel: "Live · 1:00 pm Mountain",
      assignmentTitle: "Real life — keep going",
      assignmentSteps: [
        "Bring questions about restaurants, swaps, weekends, and 9pm.",
        "Notice: knowing what to eat is one skill. Living it when life isn’t perfect is another.",
        "Your next choice is your next choice. No Monday restart.",
      ],
      journal: {
        noticed: "What changed for me across these five days?",
        glad: "What am I taking with me?",
        hard: "Where do I still get stuck in real life?",
      },
    },
  ] satisfies RealFoodResetDay[],
} as const;

export function realFoodResetUrl(path: string = REAL_FOOD_RESET.path): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export function realFoodResetDayForDate(dateStr: string): RealFoodResetDay | null {
  return REAL_FOOD_RESET.days.find((d) => d.dateStr === dateStr) ?? null;
}

export function realFoodResetGuideImages(): { title: string; alt: string; url: string }[] {
  return REAL_FOOD_RESET_GUIDES.images.map((img) => ({
    title: img.title,
    alt: img.alt,
    url: `${SITE_URL}${img.path}`,
  }));
}

export function realFoodResetDocuments(): { title: string; url: string }[] {
  return REAL_FOOD_RESET_GUIDES.documents.map((doc) => ({
    title: doc.title,
    url: `${SITE_URL}${doc.path}`,
  }));
}

export const REAL_FOOD_RESET_GUIDES = {
  levels: [
    {
      type: "Whole or minimally processed",
      description: "Close to how it grew or lived. Little or nothing added.",
      examples: "Fruit, vegetables, eggs, fish, meat, beans, nuts, seeds, plain yogurt, frozen fruit and veg",
    },
    {
      type: "Processed",
      description: "Changed from its original form; may have salt, oil, or culture added.",
      examples: "Cheese, canned beans, tofu, whole-grain bread with a short ingredient list",
    },
    {
      type: "Ultra-processed",
      description: "Long ingredient lists, additives, or “science textbook” labels. Not a moral failing — just useful to notice.",
      examples: "Soda, chips, many protein bars, flavored yogurt, deli meats, microwave meals",
    },
  ],
  foodsToStart: {
    vegetables: "Fresh or frozen veggies (aim for some at most meals)",
    protein: "Eggs, fish, poultry, tofu, edamame, plain Greek yogurt, beans",
    fats: "Avocado, olive oil, olives, nuts, nut butter (nuts + salt)",
    carbs: "Potatoes, fruit, oats, brown rice, quinoa, beans",
    drinks: "Water, herbal tea, coffee, unsweetened milk of choice",
  },
  mealIdeas: {
    breakfast: [
      "Smoothie with berries, spinach, hemp seeds, avocado & coconut water",
      "Overnight oats with almond butter & banana",
      "Scrambled eggs with sautéed veggies",
      "Egg bites",
      "Chia pudding",
    ],
    lunch: [
      "Mixed green salad with protein, seeds & lemon/olive oil",
      "Lentil soup",
      "Quinoa salad with cherry tomatoes, cucumbers, and walnuts",
      "Dinner leftovers",
    ],
    dinner: [
      "Salmon with baked sweet potato and asparagus",
      "Skillet meal with ground turkey, butternut squash & brussels sprouts",
      "Chicken and veggie stir fry over brown rice",
    ],
    snacks: [
      "Fresh fruit",
      "Raw nuts & seeds",
      "Carrot sticks or pepper slices with guacamole",
      "Apple slices with cinnamon and almond butter",
      "Homemade roasted chickpeas",
    ],
  },
  images: [
    {
      title: "Examples of whole foods",
      alt: "Foods to enjoy during the 5-Day No Processed Food Challenge — vegetables, protein, fats, fruits, grains, drinks",
      path: "/real-food-reset/whole-foods.png",
    },
    {
      title: "Whole food meal ideas",
      alt: "Breakfast, lunch, dinner, and snack ideas made with whole foods",
      path: "/real-food-reset/meal-ideas.png",
    },
  ],
  documents: [
    {
      title: "Week 1 meal plan",
      path: "/real-food-reset/meal-plan.pdf",
    },
    {
      title: "Shopping list",
      path: "/real-food-reset/shopping-list.pdf",
    },
    {
      title: "Recipe bundle",
      path: "/real-food-reset/recipe-bundle.pdf",
    },
  ],
  mealPlan: [
    {
      weekday: "Monday",
      breakfast: "Turkey Sausage with Cucumber Tomato Salad",
      snack: "Apple with Almond Butter",
      lunch: "Nashville Hot Chicken Salad",
      dinner: "Hearty Vegetable Chili",
    },
    {
      weekday: "Tuesday",
      breakfast: "Vibrant Breakfast Plate",
      snack: "Edamame",
      lunch: "Nashville Hot Chicken Salad",
      dinner: "Chicken Burrito Bowl",
    },
    {
      weekday: "Wednesday",
      breakfast: "Vibrant Breakfast Plate",
      snack: "Orange with Dry Roasted Mixed Nuts",
      lunch: "Mediterranean Salmon Salad",
      dinner: "Chicken Burrito Bowl",
    },
    {
      weekday: "Thursday",
      breakfast: "Eggs and Broccoli Slaw Salad",
      snack: "Apple with Almond Butter",
      lunch: "Mediterranean Salmon Salad",
      dinner: "Curried Chicken Meatballs",
    },
    {
      weekday: "Friday",
      breakfast: "Eggs and Broccoli Slaw Salad",
      snack: "Edamame",
      lunch: "Lettuce Wrapped Turkey Burger",
      dinner: "Curried Chicken Meatballs",
    },
  ],
  flipIt: {
    headline: "Front = marketing. Back = information.",
    mantra: "Flip it before you buy it.",
    checks: [
      "Ingredients first. What’s actually in this food?",
      "Order matters. Ingredients are listed by weight.",
      "Compare similar products. Yogurt vs yogurt. Bread vs bread.",
      "Find Added Sugars. Today we’re noticing.",
      "Check the serving size. The numbers refer to that amount.",
      "Find protein + fiber. No magic numbers — build the habit of looking.",
      "Check total carbohydrate + fat. Information, not judgment.",
      "Don’t let one number make the whole decision.",
      "You don’t need the “perfect” product. You need enough information to choose on purpose.",
    ],
    compareRows: [
      "First 3 ingredients",
      "Added sugar",
      "Serving size",
      "Protein",
      "Fiber",
      "Total carbohydrate",
      "Fat",
    ],
  },
  plate: {
    protein: "Eggs, chicken, turkey, beef, fish, Greek yogurt, cottage cheese, tofu/tempeh, beans, lentils. Start with a protein source — don’t try to calculate a perfect number.",
    fat: "Avocado, olive oil, olives, nuts, seeds, nut/seed butter. Some protein foods already contain fat. You don’t have to add three separate foods just to check three boxes.",
    fiber: "Vegetables, fruit, beans, lentils, whole grains, chia, nuts, seeds.",
    carbsNote:
      "Carbs aren’t the enemy. Fruit, beans, oats, quinoa, potatoes are carbohydrates. Ask: what am I eating, and what does the whole meal look like?",
    unicityNote:
      "Optional: Unicity Balance is a supplemental source of fiber. It isn’t required for the challenge and doesn’t replace fiber-rich foods.",
    combos: {
      breakfast: [
        "Eggs + avocado + berries",
        "Plain Greek yogurt + berries + chia + walnuts",
        "Oatmeal + chia + berries + nut butter, with a protein alongside",
      ],
      lunch: [
        "Chicken + giant salad + avocado/olive oil",
        "Turkey lettuce wrap + vegetables + hummus + fruit",
        "Tuna + vegetables + a whole-food carb + olive-oil dressing",
      ],
      dinner: [
        "Salmon + roasted vegetables + potato",
        "Chicken + broccoli + quinoa + avocado",
        "Beef + vegetables + brown/wild rice",
        "Tofu + vegetable stir-fry + whole grain + nuts/seeds",
      ],
      snacks: [
        "Apple + nut butter",
        "Plain Greek yogurt + berries + chia",
        "Vegetables + hummus",
        "Fruit + nuts",
        "Cottage cheese + fruit + seeds",
      ],
    },
  },
} as const;
