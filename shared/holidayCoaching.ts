import { z } from "zod";

/** Ad landing page for the free holiday metabolic-coaching practicum. */
export const HOLIDAY_PATH = "/holiday";
export const HOLIDAY_COACH_EMAIL = "coach@mindandbodyresetcoach.com";
export const HOLIDAY_LEAD_NAME = "Holiday Coaching Application";
export const HOLIDAY_EVENT_SOURCE = "https://mindandbodyresetcoach.com/holiday";

export const yesNoSchema = z.enum(["yes", "no"], {
  message: "Please choose Yes or No.",
});

export type YesNo = z.infer<typeof yesNoSchema>;

export const HOLIDAY_YES_NO = [
  { key: "age18", label: "Are you 18 years of age or older?" },
  { key: "newToFasting", label: "Are you new to fasting?" },
  { key: "pregnantOrBreastfeeding", label: "Are you currently pregnant or breastfeeding?" },
  {
    key: "eatingDisorder",
    label: "Are you currently experiencing, or in active recovery from, an eating disorder?",
  },
  {
    key: "addiction",
    label:
      "Do you have an active serious addiction or engage in serious destructive behaviors (like alcohol, drug, sex, food...)?",
  },
  {
    key: "twelveStep",
    label: "Are you newly involved in a twelve-step or other addiction treatment program?",
  },
  { key: "moodMedication", label: "Are you currently taking significant mood-altering medications?" },
  {
    key: "takeResponsibility",
    label: "Are you willing to take responsibility for the results you are seeking?",
  },
  {
    key: "buyKetoMojo",
    label: "Are you willing to purchase a Keto-Mojo meter?",
    hint: "This meter is required. The coaching is free. The meter is the part you purchase.",
  },
  {
    key: "logFood",
    label: "Are you willing to log your food in our app?",
    hint: "That's the Mind & Body Reset app. You'll keep your food log there.",
  },
  {
    key: "commitFiveWeeks",
    label:
      "Are you willing to commit to a 5-week coaching relationship (a Discovery Session plus 4 coaching sessions)?",
  },
  {
    key: "weeklyZoom",
    label: "Are you willing to commit to a weekly video call lasting 60 minutes?",
  },
  {
    key: "actionSteps",
    label: "Are you willing to complete follow-up action steps between sessions?",
  },
  {
    key: "availableNov3to8",
    label:
      "Are you available between November 3 and 8, 2026 for a Discovery Session, if we decide this is a fit?",
  },
] as const;

export type HolidayYesNoKey = (typeof HOLIDAY_YES_NO)[number]["key"];

/** Screening block, then the two written answers, then the commitment block. Matches her Google Form. */
export const HOLIDAY_QUESTION_GROUPS: { title: string; intro: string; keys: HolidayYesNoKey[] }[] = [
  {
    title: "A few yes or no questions",
    intro: "Answer honestly. I read every application.",
    keys: [
      "age18",
      "newToFasting",
      "pregnantOrBreastfeeding",
      "eatingDisorder",
      "addiction",
      "twelveStep",
      "moodMedication",
      "takeResponsibility",
    ],
  },
  {
    title: "What this asks of you",
    intro: "The coaching is free. A Keto-Mojo meter is required.",
    keys: ["buyKetoMojo", "logFood", "commitFiveWeeks", "weeklyZoom", "actionSteps", "availableNov3to8"],
  },
];

const FLAG_IF_YES = new Set<HolidayYesNoKey>([
  "pregnantOrBreastfeeding",
  "eatingDisorder",
  "addiction",
  "twelveStep",
  "moodMedication",
]);

const FLAG_IF_NO = new Set<HolidayYesNoKey>([
  "age18",
  "takeResponsibility",
  "buyKetoMojo",
  "logFood",
  "commitFiveWeeks",
  "weeklyZoom",
  "actionSteps",
  "availableNov3to8",
]);

function clipOptional(max: number) {
  return z
    .string()
    .max(max)
    .optional()
    .transform((value) => {
      const clean = (value ?? "").replace(/[\u0000-\u001F]/g, " ").trim();
      return clean ? clean.slice(0, max) : undefined;
    });
}

function requiredText(min: number, max: number, message: string) {
  return z
    .string()
    .max(max)
    .transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim())
    .pipe(z.string().min(min, message).max(max));
}

const yesNoFields = Object.fromEntries(
  HOLIDAY_YES_NO.map((question) => [question.key, yesNoSchema])
) as Record<HolidayYesNoKey, typeof yesNoSchema>;

export const holidayApplicationSchema = z.object({
  fullName: requiredText(2, 200, "Please enter your full name."),
  email: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().email("Please enter a valid email address.").max(320)),
  phone: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(7, "Please enter your phone number.")
        .max(40)
        .refine((value) => {
          const digits = value.replace(/\D/g, "");
          return digits.length >= 10 && digits.length <= 15;
        }, "Enter a phone number with at least 10 digits.")
    ),
  ...yesNoFields,
  whyCoaching: requiredText(2, 5000, "Tell me why you want coaching."),
  hopes: requiredText(2, 5000, "Tell me what you hope for."),
  utmSource: clipOptional(255),
  utmMedium: clipOptional(255),
  utmCampaign: clipOptional(255),
  utmContent: clipOptional(255),
  utmTerm: clipOptional(255),
  fbclid: clipOptional(255),
  fbp: clipOptional(255),
  fbc: clipOptional(512),
  landingUrl: clipOptional(1000),
  eventSourceUrl: clipOptional(1000),
  eventId: z.string().min(8).max(80),
  /** Honeypot. Real applicants leave this blank. A URL here is treated as a bot. */
  companyWebsite: z.string().max(300).optional(),
});

export type HolidayApplicationInput = z.infer<typeof holidayApplicationSchema>;

export function holidayQuestion(key: HolidayYesNoKey) {
  const question = HOLIDAY_YES_NO.find((item) => item.key === key);
  if (!question) throw new Error(`Unknown holiday question: ${key}`);
  return question;
}

export function applicationFirstName(fullName: string): string {
  const full = fullName.replace(/[\r\n]/g, " ").trim();
  const first = full.split(/\s+/).filter(Boolean)[0] ?? "there";
  return first.slice(0, 40);
}

export function holidayCoachSubject(fullName: string): string {
  return `New holiday coaching application: ${applicationFirstName(fullName)}`;
}

export function holidayFlags(input: Pick<HolidayApplicationInput, HolidayYesNoKey>): string[] {
  const flags: string[] = [];
  for (const question of HOLIDAY_YES_NO) {
    const answer = input[question.key];
    if (FLAG_IF_YES.has(question.key) && answer === "yes") flags.push(question.label);
    if (FLAG_IF_NO.has(question.key) && answer === "no") flags.push(question.label);
  }
  return flags;
}

/** A filled honeypot that looks like a URL. Names and blank values are not bots. */
export function isHolidayHoneypot(value: string | undefined): boolean {
  if (!value) return false;
  return /https?:\/\/|www\./i.test(value);
}

export const HOLIDAY_COPY = {
  headline: "What if this holiday season was different?",
  subhead: "No waiting until January. No guilt over holiday meals. No starting another diet every Monday.",
  offer: "5 weeks of free 1:1 metabolic coaching with Lee Anne, for women over 40. A Keto-Mojo meter is required.",
  apply: "Apply for a spot",
  bio: "I'm Lee Anne. I coach women over 40 on hormones, blood sugar, and habits that can survive a real week, including the holidays. I started this work after I found out I had insulin resistance. This round is free while I complete my Mindy Pelz coaching certification. I can take 3 women. After that, I keep a waitlist.",
  learnTitle: "What you'll learn",
  learnIntro: "One hour a week, for five weeks. We'll work on:",
  learn: [
    "Blood sugar",
    "Cravings",
    "Energy crashes",
    "Metabolic flexibility",
    "Habits you can stick with",
  ],
  commitmentTitle: "The commitment",
  commitment: [
    "5 weeks",
    "1 hour a week on a video call",
    "A Discovery Session, plus 4 coaching sessions",
    "Discovery Session, November 3–8",
    "A Keto-Mojo meter is required",
    "3 spots, then a waitlist",
  ],
  ketoTitle: "A Keto-Mojo meter is required",
  ketoBody:
    "The coaching is free. The meter is the part you purchase. We'll use it so you can see your own blood sugar and ketones. If you don't want to buy one, this round isn't the right fit.",
  formTitle: "Apply for one of 3 spots",
  formIntro: "The form stays on this page. I read it myself.",
  privacy:
    "I use your answers only to review this application and to contact you about it. I don't sell your information.",
  notAPromise:
    "This is coaching, not medical care, and not a promise of any specific result.",
  thanks: "Thank you! Your application is in. I'll personally reach out within 24 hours.",
  thanksSign: "Lee Anne",
  applicantThanks: "Thanks! I'll review your application and reach out personally within 24 hours.",
} as const;

export const HOLIDAY_FAQ = [
  {
    q: "Is the coaching free?",
    a: "Yes. Five weeks, one hour a week, you and me on a video call. The only purchase is a Keto-Mojo meter, and that meter is required.",
  },
  {
    q: "Who is this for?",
    a: "Women over 40. You don't need to know how to fast.",
  },
  {
    q: "How many spots?",
    a: "3. If more women apply, I keep a waitlist.",
  },
  {
    q: "What are the sessions?",
    a: "A Discovery Session between November 3 and 8, then 4 coaching sessions. One hour each week, on a video call.",
  },
  {
    q: "Why is it free?",
    a: "I'm in the practicum for my Mindy Pelz coaching certification, so I'm taking 3 practice clients. A mentor may review our sessions. If that's a no for you, skip this one.",
  },
  {
    q: "What should I expect?",
    a: "Five weeks on blood sugar, cravings, energy, and habits you can keep. I don't promise a specific result.",
  },
] as const;
