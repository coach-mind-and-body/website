/**
 * Short welcome series for the Holiday program.
 * Copy follows shared/holidayCoaching.ts. The five-week practicum,
 * the Keto-Mojo meter, and the mentor review belong to Metabolic Coaching.
 */
import { FOOD_APP_URL, PORTAL_HUB_URL } from "@shared/appLinks";
import { HOLIDAY_COPY } from "@shared/holidayCoaching";
import {
  foodLogWays,
  p,
  renderOnboardingLetter,
  whereToLook,
} from "./onboardingLetter";

export type HolidayOnboardingStep = {
  key: string;
  day: number;
  subject: string;
  previewText: string;
  gist: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  appStoreFallback?: boolean;
};

export const HOLIDAY_ONBOARDING_STEPS: HolidayOnboardingStep[] = [
  {
    key: "welcome",
    day: 0,
    subject: HOLIDAY_COPY.headline,
    previewText: "No waiting until January. Your program is in the app.",
    gist: "Welcome to the holiday program, with the app and the website portal.",
    ctaLabel: "Open your program",
    ctaUrl: PORTAL_HUB_URL,
    appStoreFallback: true,
    bodyHtml: [
      p("You're in the holiday program. I'm glad you're here."),
      p(HOLIDAY_COPY.subhead),
      p(
        "We'll look at blood sugar, cravings, energy, and habits you can stick with through a real week, including the holidays."
      ),
      whereToLook(),
      p(HOLIDAY_COPY.notAPromise),
    ].join("\n"),
  },
  {
    key: "food-log",
    day: 2,
    subject: "Log the meal, even the holiday one",
    previewText:
      "Type it, photograph the plate, or photograph the page you wrote.",
    gist: "How to log food, including a photo of a written page, holiday meal included.",
    ctaLabel: "Open your food log",
    ctaUrl: FOOD_APP_URL,
    appStoreFallback: true,
    bodyHtml: [
      p("Keep your food log in the app. A holiday meal can go in there too."),
      foodLogWays(),
      p("The point is to see the day, not to start over on Monday."),
      whereToLook(FOOD_APP_URL),
    ].join("\n"),
  },
  {
    key: "check-in",
    day: 7,
    subject: "You don't have to wait until January",
    previewText: "A holiday meal is not a reason to start over.",
    gist: "A one-week note: log the party or the long dinner, then come back to the next meal.",
    bodyHtml: [
      p("You don't have to wait until January."),
      p(
        "If a party, a cookie, or a long dinner is already on the calendar, log it and come back to the next meal. We're practicing habits that can survive a real week."
      ),
      p("Reply if you want to tell me how the week is going."),
      whereToLook(),
    ].join("\n"),
  },
];

export const HOLIDAY_ONBOARDING_DAY_OFFSETS: readonly number[] =
  HOLIDAY_ONBOARDING_STEPS.map(step => step.day);

export const HOLIDAY_ONBOARDING_EMAILS = HOLIDAY_ONBOARDING_STEPS.map(
  step => (firstName: string) => ({
    subject: step.subject,
    html: renderOnboardingLetter({
      firstName,
      previewText: step.previewText,
      bodyHtml: step.bodyHtml,
      ctaLabel: step.ctaLabel,
      ctaUrl: step.ctaUrl,
      appStoreFallback: step.appStoreFallback,
    }),
  })
);

if (
  HOLIDAY_ONBOARDING_EMAILS.length !== HOLIDAY_ONBOARDING_DAY_OFFSETS.length
) {
  throw new Error("Holiday onboarding days do not match the emails.");
}
