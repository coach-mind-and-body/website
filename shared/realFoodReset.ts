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
  days: [
    {
      n: 1,
      dateStr: "2026-09-28",
      weekday: "Monday, Sept 28",
      title: "Processed food vs. whole food",
      win: "More awareness of what’s actually on your plate.",
      format: "live" as const,
      formatLabel: "Live · 1:00 pm Mountain",
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
      formatLabel: "Live · 1:00 pm Mountain",
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
      formatLabel: "Live · 1:00 pm Mountain",
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

export function realFoodResetGuideImages(): { title: string; alt: string; url: string }[] {
  return REAL_FOOD_RESET_GUIDES.images.map((img) => ({
    title: img.title,
    alt: img.alt,
    url: `${SITE_URL}${img.path}`,
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
      alt: "Foods to enjoy during the Real Food Reset — vegetables, protein, fats, fruits, grains, drinks",
      path: "/real-food-reset/whole-foods.png",
    },
    {
      title: "Whole food meal ideas",
      alt: "Breakfast, lunch, dinner, and snack ideas made with whole foods",
      path: "/real-food-reset/meal-ideas.png",
    },
  ],
} as const;
