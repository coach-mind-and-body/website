import { z } from "zod";
import { absoluteUrl } from "./brand";

/** Private form. Not in the sitemap. */
export const CLIENT_INTAKE_PATH = "/client-intake";
export const CLIENT_INTAKE_ADMIN_TAB = "intakes";
export const CLIENT_INTAKE_ADMIN_PATH = `/admin?tab=${CLIENT_INTAKE_ADMIN_TAB}`;
export const CLIENT_INTAKE_COACH_EMAIL = "coach@mindandbodyresetcoach.com";

/**
 * Wording from the paper Client Intake Form.
 * Field labels, examples, and the three menopause choices are included so the
 * digital form asks the same things.
 */
export const INTAKE = {
  eyebrow: "METABOLIC COACHING",
  title: "Client Intake Form",
  name: "Name",
  contact: "Best Number and Email to Contact You",
  phone: "BEST PHONE NUMBER",
  email: "EMAIL",
  goals: "What do you hope to achieve in your sessions with me?",
  health: "Please list your top three current and/or ongoing health problems in order of priority",
  habitsWorse: "What habits make you feel worse?",
  habitsWorseExamples: "Examples: drinking alcohol, stress, work",
  habitsBetter: "What habits make you feel better?",
  habitsBetterExamples: "Examples: eating healthy, movement/exercising, sleeping 8 hours",
  activity: "What is your daily physical activity level?",
  activityHint: "List the type of activity and the duration.",
  menopause: "Are you pre, peri, or postmenopausal?",
  menopauseHint: "Postmenopausal means going without a menstrual cycle for at least one year.",
  lastCycle: "If you are pre or perimenopausal, what date did your last cycle start on?",
  allergies: "Please list any food allergies you have",
} as const;

export const MENOPAUSE_OPTIONS = [
  { value: "premenopausal", label: "Premenopausal" },
  { value: "perimenopausal", label: "Perimenopausal" },
  { value: "postmenopausal", label: "Postmenopausal" },
] as const;

export type MenopauseStatus = (typeof MENOPAUSE_OPTIONS)[number]["value"];

const MENOPAUSE_VALUES = MENOPAUSE_OPTIONS.map((option) => option.value) as [
  MenopauseStatus,
  ...MenopauseStatus[],
];

export function menopauseLabel(value: MenopauseStatus): string {
  const match = MENOPAUSE_OPTIONS.find((option) => option.value === value);
  if (!match) return value;
  return match.label;
}

export function clientIntakeShareUrl(): string {
  return absoluteUrl(CLIENT_INTAKE_PATH);
}

export function clientIntakeAdminUrl(): string {
  return absoluteUrl(CLIENT_INTAKE_ADMIN_PATH);
}

/** Short note Lee Anne can text or email. She can edit it before sending. */
export function clientIntakeShareMessage(url = clientIntakeShareUrl()): string {
  return `Please fill this out before we meet. It only takes a few minutes.\n\n${url}`;
}

export function clientIntakeSmsHref(url = clientIntakeShareUrl()): string {
  return `sms:?body=${encodeURIComponent(clientIntakeShareMessage(url))}`;
}

export function clientIntakeMailtoHref(url = clientIntakeShareUrl()): string {
  const subject = encodeURIComponent("Client intake form");
  const body = encodeURIComponent(clientIntakeShareMessage(url));
  return `mailto:?subject=${subject}&body=${body}`;
}

function scrub(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

function requiredText(min: number, max: number, message: string) {
  return z
    .string()
    .max(max)
    .transform(scrub)
    .pipe(z.string().min(min, message).max(max));
}

function isRealCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1920 || year > 2100 || month < 1 || month > 12) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function formatIntakeCycleDate(iso: string): string {
  if (!isRealCalendarDate(iso)) return iso;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export const clientIntakeSchema = z
  .object({
    name: requiredText(2, 200, "Please enter your name."),
    phone: z
      .string()
      .max(40)
      .transform((value) => value.trim())
      .pipe(
        z
          .string()
          .min(7, "Please enter your best phone number.")
          .max(40)
          .refine((value) => {
            const digits = value.replace(/\D/g, "");
            return digits.length >= 10 && digits.length <= 15;
          }, "Enter a phone number with at least 10 digits.")
      ),
    email: z
      .string()
      .max(320)
      .transform((value) => value.trim().toLowerCase())
      .pipe(z.string().email("Please enter a valid email address.").max(320)),
    goals: requiredText(2, 5000, "Please share what you hope to achieve."),
    health1: requiredText(1, 500, "Please list health problem 1."),
    health2: requiredText(1, 500, "Please list health problem 2."),
    health3: requiredText(1, 500, "Please list health problem 3."),
    habitsWorse: requiredText(2, 5000, "Please share the habits that make you feel worse."),
    habitsBetter: requiredText(2, 5000, "Please share the habits that make you feel better."),
    activity: requiredText(2, 5000, "Please list your daily activity and how long you do it."),
    menopause: z.enum(MENOPAUSE_VALUES, {
      message: "Please choose Premenopausal, Perimenopausal, or Postmenopausal.",
    }),
    lastCycle: z
      .string()
      .max(40)
      .optional()
      .transform((value) => {
        const clean = (value ?? "").trim();
        return clean ? clean : undefined;
      }),
    allergies: requiredText(1, 5000, "Please list any food allergies you have. Write none if you have none."),
    /** Honeypot. People leave this blank. A URL here is treated as a bot. */
    companyWebsite: z.string().max(300).optional(),
  })
  .superRefine((input, ctx) => {
    const needsDate = input.menopause === "premenopausal" || input.menopause === "perimenopausal";
    if (needsDate && !input.lastCycle) {
      ctx.addIssue({
        code: "custom",
        path: ["lastCycle"],
        message: "Please enter the date your last cycle started.",
      });
      return;
    }
    if (input.lastCycle && !isRealCalendarDate(input.lastCycle)) {
      ctx.addIssue({
        code: "custom",
        path: ["lastCycle"],
        message: "Enter the date your last cycle started.",
      });
    }
  });

export type ClientIntakeInput = z.infer<typeof clientIntakeSchema>;

export function isClientIntakeHoneypot(value: string | undefined): boolean {
  if (!value) return false;
  return /https?:\/\/|www\./i.test(value);
}

export function clientIntakeFieldErrors(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export type ClientIntakeAnswers = {
  name: string;
  phone: string;
  email: string;
  goals: string;
  health1: string;
  health2: string;
  health3: string;
  habitsWorse: string;
  habitsBetter: string;
  activity: string;
  menopause: MenopauseStatus;
  lastCycle?: string | null;
  allergies: string;
};

export function clientIntakeAnswerLines(input: ClientIntakeAnswers): { label: string; value: string }[] {
  const cycle = input.lastCycle?.trim()
    ? formatIntakeCycleDate(input.lastCycle.trim())
    : input.menopause === "postmenopausal"
      ? "Not applicable"
      : "";

  return [
    { label: INTAKE.name, value: input.name },
    { label: INTAKE.phone, value: input.phone },
    { label: INTAKE.email, value: input.email },
    { label: INTAKE.goals, value: input.goals },
    {
      label: INTAKE.health,
      value: `1. ${input.health1}\n2. ${input.health2}\n3. ${input.health3}`,
    },
    { label: INTAKE.habitsWorse, value: input.habitsWorse },
    { label: INTAKE.habitsBetter, value: input.habitsBetter },
    { label: INTAKE.activity, value: input.activity },
    { label: INTAKE.menopause, value: menopauseLabel(input.menopause) },
    { label: INTAKE.lastCycle, value: cycle },
    { label: INTAKE.allergies, value: input.allergies },
  ];
}

export function formatClientIntakeText(input: ClientIntakeAnswers): string {
  return clientIntakeAnswerLines(input)
    .flatMap((line) => [line.label, line.value, ""])
    .join("\n")
    .trim();
}
