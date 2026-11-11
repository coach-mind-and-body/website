/**
 * Enrolled-client notes for Metabolic Coaching.
 * The six emails in metabolicPracticum.ts are recruitment for a closed
 * application window. They are not this series.
 */
import {
  APP_STORE_URL,
  foodLogWays,
  p,
  renderOnboardingLetter,
  whereToLook,
} from "./onboardingLetter";

export type OnboardingStep = {
  key: string;
  /** Days after Lee Anne enrolls them. Day 0 sends as soon as they are enrolled. */
  day: number;
  subject: string;
  previewText: string;
  /** One line for the send plan. Not shown in the email. */
  gist: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export const METABOLIC_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: "welcome",
    day: 0,
    subject: "You're in. Let's start these five weeks",
    previewText: "Five weeks. One hour a week. You and me.",
    gist: "Welcome, the shape of the five weeks, and an invite to the app and the portal.",
    ctaLabel: "Download the iPhone app",
    ctaUrl: APP_STORE_URL,
    bodyHtml: [
      p("You're in Metabolic Coaching. I'm glad."),
      p(
        "This is five weeks, you and me. A discovery session, then four coaching sessions. One hour a week, on a video call. You don't need to know how to fast."
      ),
      p(
        "We'll work on blood sugar, cravings, energy, and habits you can stick with. The coaching is free. A Keto-Mojo meter is required, and that's the part you purchase. We'll use it so you can see your own blood sugar and ketones."
      ),
      p(
        "A mentor may review our sessions. This is my Mindy Pelz coaching practicum."
      ),
      p(
        "This is coaching, not medical care, and not a promise of any specific result."
      ),
      whereToLook(),
    ].join("\n"),
  },
  {
    key: "food-log",
    day: 2,
    subject: "Your food log can start on paper",
    previewText:
      "Type it, photograph the plate, or photograph the page you wrote.",
    gist: "How to log a meal, including a photo of a food log already written on paper.",
    ctaLabel: "Download the iPhone app",
    ctaUrl: APP_STORE_URL,
    bodyHtml: [
      p("Your food log lives in the app. Use whichever way is easiest:"),
      foodLogWays(),
      p(
        "It doesn't have to be perfect. A few honest lines are enough for our next call."
      ),
      whereToLook(),
    ].join("\n"),
  },
  {
    key: "week-1",
    day: 7,
    subject: "How was the first week?",
    previewText: "One week of our five. Bring one thing you noticed.",
    gist: "First week check-in. One observation is enough, and the first call can still be ahead.",
    bodyHtml: [
      p("You're one week into our five."),
      p(
        "If we've already talked, bring one thing you noticed. Blood sugar, a craving, your energy, or a habit. If our first call is still ahead, that's okay."
      ),
      p(
        "Log what you ate, even if the page is short. Reply if something feels confusing. I read these."
      ),
      whereToLook(),
    ].join("\n"),
  },
  {
    key: "midpoint",
    day: 14,
    subject: "This is the middle week",
    previewText: "Week three of five. You're not behind.",
    gist: "Middle week of the five. Keep the log, including a photo of a paper page.",
    bodyHtml: [
      p("This is the middle week of our five. Week three."),
      p(
        "You don't have to have it all tidy. Keep the food log going. If paper is easier at the table, take a photo of that page when you can."
      ),
      p(
        "On our call we'll stay with what you're noticing. I'm not looking for a perfect week."
      ),
      whereToLook(),
    ].join("\n"),
  },
  {
    key: "week-4",
    day: 21,
    subject: "Four weeks in",
    previewText: "One week left after this one. Keep the log simple.",
    gist: "Week-four check-in. Bring one habit she wants to keep.",
    bodyHtml: [
      p("You're four weeks in. One week left after this one."),
      p(
        "Keep the food log simple. Type it, photograph the plate, or photograph the page you wrote."
      ),
      p("Come to the call with one habit you want to keep."),
      whereToLook(),
    ].join("\n"),
  },
  {
    key: "final-week",
    day: 28,
    subject: "This is the last week",
    previewText: "Our last week of the five. Bring what you want to keep.",
    gist: "Final week. One more hour, and the app stays available.",
    bodyHtml: [
      p("This is our last week. One more hour together."),
      p(
        "Bring what you want to keep. A habit that survived a real week, or a question you still have."
      ),
      whereToLook(),
    ].join("\n"),
  },
  {
    key: "wrap-up",
    day: 35,
    subject: "You did the five weeks",
    previewText: "The calls are done. The app and the portal stay.",
    gist: "Wrap-up after the five weeks. The app and portal remain, with no result promised.",
    bodyHtml: [
      p("These five weeks are done. Thank you for showing up for them."),
      p(
        "The app is still there, and so is the website. You can keep the food log if you want to."
      ),
      p(
        "Reply and tell me one thing you're taking with you. I'd like to hear it."
      ),
      p("This was coaching, not a promise of a specific result."),
      whereToLook(),
    ].join("\n"),
  },
];

export const METABOLIC_ONBOARDING_DAY_OFFSETS: readonly number[] =
  METABOLIC_ONBOARDING_STEPS.map(step => step.day);

export const METABOLIC_ONBOARDING_EMAILS = METABOLIC_ONBOARDING_STEPS.map(
  step => (firstName: string) => ({
    subject: step.subject,
    html: renderOnboardingLetter({
      firstName,
      previewText: step.previewText,
      bodyHtml: step.bodyHtml,
      ctaLabel: step.ctaLabel,
      ctaUrl: step.ctaUrl,
    }),
  })
);

if (
  METABOLIC_ONBOARDING_EMAILS.length !== METABOLIC_ONBOARDING_DAY_OFFSETS.length
) {
  throw new Error("Metabolic onboarding days do not match the emails.");
}
