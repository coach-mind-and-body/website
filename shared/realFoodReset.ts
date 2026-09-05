import { SITE_URL } from "./brand";

export const REAL_FOOD_RESET_THEME = "real_food_reset";
export const REAL_FOOD_RESET_CLAIM_KEY = "mbr_rfr_claim";
export const REAL_FOOD_RESET_SEQUENCE_ID = "real_food_reset_days";

export type RealFoodResetDayFormat = "live" | "video";

export type RealFoodResetDay = {
  n: number;
  dateStr: string;
  weekday: string;
  title: string;
  win: string;
  format: RealFoodResetDayFormat;
  formatLabel: string;
  journal: { noticed: string; glad: string; hard: string };
};

/** FREE 5-Day Real Food Reset — Sept 28–Oct 2, 2026 */
export const REAL_FOOD_RESET = {
  name: "The 5-Day Real Food Reset",
  shortName: "Real Food Reset",
  path: "/real-food-reset",
  thankYouPath: "/real-food-reset/thank-you",
  trackerPath: "/habit-tracker",
  themeTag: REAL_FOOD_RESET_THEME,
  startLabel: "September 28",
  startDate: "2026-09-28",
  endDate: "2026-10-02",
  endLabel: "October 2",
  liveTime: "12:00 pm Mountain",
  liveDays: "Monday, Wednesday, and Friday",
  liveDuration: "1 hour",
  offerClosesDate: "2026-11-01",
  offerClosesLabel: "November 1",
  paidProgram: "6 Habits in 6 Weeks to Quiet Food Noise",
  paidPrice: "$597",
  segment: "leadgen_real_food_reset",
  days: [
    {
      n: 1,
      dateStr: "2026-09-28",
      weekday: "Monday, Sept 28",
      title: "Processed food vs. whole food",
      win: "More awareness of what’s actually on your plate.",
      format: "live" as const,
      formatLabel: "Live · 12:00 pm Mountain",
      journal: {
        noticed: "What did you notice in your body, energy, or cravings today?",
        glad: "One choice you’re glad you made:",
        hard: "One thing that was hard (no scorekeeping):",
      },
    },
    {
      n: 2,
      dateStr: "2026-09-29",
      weekday: "Tuesday, Sept 29",
      title: "Become a food-label detective",
      win: "More confidence in the grocery store.",
      format: "video" as const,
      formatLabel: "Video + recipes in the app",
      journal: {
        noticed: "What surprised you when you turned a package around?",
        glad: "One choice you’re glad you made:",
        hard: "One thing that was hard (no scorekeeping):",
      },
    },
    {
      n: 3,
      dateStr: "2026-09-30",
      weekday: "Wednesday, Sept 30",
      title: "Let’s talk sugar",
      win: "See where added sugar is showing up — no food police.",
      format: "live" as const,
      formatLabel: "Live · 12:00 pm Mountain",
      journal: {
        noticed: "Where did added sugar show up that you didn’t expect?",
        glad: "One choice you’re glad you made:",
        hard: "One thing that was hard (no scorekeeping):",
      },
    },
    {
      n: 4,
      dateStr: "2026-10-01",
      weekday: "Thursday, Oct 1",
      title: "Protein is not the answer",
      win: "A simple plate: protein + fat + fiber.",
      format: "video" as const,
      formatLabel: "Video + recipes in the app",
      journal: {
        noticed: "How did a plate with protein, fat, and fiber feel compared to usual?",
        glad: "One choice you’re glad you made:",
        hard: "One thing that was hard (no scorekeeping):",
      },
    },
    {
      n: 5,
      dateStr: "2026-10-02",
      weekday: "Friday, Oct 2",
      title: "Real food in the real world",
      win: "Eating out, swaps, Q&A, and your next step.",
      format: "live" as const,
      formatLabel: "Live · 12:00 pm Mountain",
      journal: {
        noticed: "What changed for you across these five days?",
        glad: "What are you taking with you?",
        hard: "What was hardest — and what might help next time?",
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
      "Eggs with sautéed vegetables",
      "Greek yogurt, berries, and chia",
      "Oats with banana and almond butter",
    ],
    lunch: [
      "Big salad + leftover protein + olive oil",
      "Lentil or bean soup",
      "Quinoa bowl with veggies and walnuts",
    ],
    dinner: [
      "Salmon, sweet potato, green vegetable",
      "Turkey skillet with squash and brussels",
      "Chicken and veggie stir-fry over rice",
    ],
    snacks: [
      "Fruit and a handful of nuts",
      "Carrots or peppers with guacamole",
      "Apple with cinnamon and almond butter",
    ],
  },
} as const;
