import { PROGRAM, SITE_URL } from "@shared/brand";
import { REAL_FOOD_RESET } from "@shared/realFoodReset";
import { buildNewsletterHtml } from "./newsletterShell";

const NAME = REAL_FOOD_RESET.name;
const PROGRAM_NAME = REAL_FOOD_RESET.paidProgram;
const PRICE = REAL_FOOD_RESET.paidPrice;
const CTA = `${SITE_URL}${REAL_FOOD_RESET.paidProgramPath}`;
const APP = `${SITE_URL}/habit-tracker`;
const BOOK = `${SITE_URL}/book`;

function bookLine(copy: string): string {
  return p(`${copy} <a href="${BOOK}">mindandbodyresetcoach.com/book</a>.`);
}

function p(text: string): string {
  return `<p>${text}</p>`;
}

type OfferDraft = {
  subject: string;
  previewText: string;
  headline: string;
  subheadline?: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
};

function wrap(firstName: string, draft: OfferDraft) {
  return {
    subject: draft.subject,
    html: buildNewsletterHtml({
      firstName,
      previewText: draft.previewText,
      headline: draft.headline,
      subheadline: draft.subheadline ?? null,
      bodyHtml: draft.bodyHtml,
      ctaLabel: draft.ctaLabel,
      ctaUrl: draft.ctaUrl,
    }),
  };
}

/** Calendar send dates (America/Denver) after the 5-day challenge. */
export const REAL_FOOD_RESET_OFFER_DATES = [
  "2026-10-03",
  "2026-10-06",
  "2026-10-08",
  "2026-10-10",
  "2026-10-13",
] as const;

const DRAFTS: OfferDraft[] = [
  {
    subject: "You did five days. Don't start over Monday.",
    previewText: "One imperfect meal does not erase the week.",
    headline: "You showed up.",
    subheadline: `${NAME} · what happens now`,
    bodyHtml: [
      p("Five days. That's what we asked of you. And whether you hit every check-in or missed a live and came back anyway — you practiced something most diets never teach: <strong>make the next choice and keep going.</strong>"),
      p("Please don't let Monday-brain talk you out of that. One takeout night does not mean you “blew it.” One leftover breakfast does not mean you have to start over."),
      p("The food log is still in the app. The journal is still there. The Meet replays are still there. Use them this weekend if you want. Or just eat a plate with protein, fat, and fiber and notice how you feel."),
      p("Next week I'll tell you about the next step I built for women who want this to stick longer than five days. No pressure today. Just: you did it."),
      bookLine("If you want to talk one-on-one about what you noticed this week, book a free discovery call:"),
    ].join("\n"),
    ctaLabel: "Open the app",
    ctaUrl: APP,
  },
  {
    subject: "Five days proved you can. Six weeks is how it sticks.",
    previewText: `${PROGRAM_NAME} — ${PRICE}.`,
    headline: "Five days was the proof.",
    subheadline: `${PROGRAM_NAME} · ${PRICE}`,
    bodyHtml: [
      p("Five days is long enough to notice. It is not long enough to rewire twenty years of “I'll start Monday.”"),
      p(`That's why I built <strong>${PROGRAM_NAME}</strong>. Same work we started last week — labels, plates, evenings, the story you tell yourself when you're tired — with me in your corner for six weeks.`),
      p("This is private coaching, not another giant group challenge. We use the app you already have. We keep the “progress, not perfection” rule. And we go deep enough that the next holiday / stressful Tuesday / quiet 9pm doesn't wipe the five days away."),
      p(`Investment: <strong>${PRICE}</strong> (or a $${PROGRAM.depositPrice} deposit to hold your seat). That's the same intro rate as my 6-week 1:1 program.`),
      p(`The door stays open through <strong>${REAL_FOOD_RESET.offerClosesLabel}</strong>. If you're not ready, keep using the app. You're still welcome here.`),
      bookLine("Not ready to enroll? That's okay. Book a free discovery call and we'll talk it through:"),
    ].join("\n"),
    ctaLabel: `See ${PROGRAM_NAME}`,
    ctaUrl: CTA,
  },
  {
    subject: "What's actually inside the 6 weeks",
    previewText: "Habits, live support, the app you already opened, and a clear plan.",
    headline: "What the 6 weeks actually look like",
    subheadline: `${PROGRAM.sessionCount} private sessions · ${PROGRAM.sessionDurationMins} minutes each`,
    bodyHtml: [
      p("A lot of “programs” are a PDF and a prayer. This isn't that."),
      p(`Inside <strong>${PROGRAM_NAME}</strong> you get:`),
      `<ul>
          <li><strong>${PROGRAM.sessionCount} private sessions</strong> with me (${PROGRAM.sessionDurationMins} minutes) — not a webinar with 200 people</li>
          <li>Week-by-week habits so you're never guessing what to practice</li>
          <li>The same app you used during the challenge: food log, check-ins, chat</li>
          <li>Support for food noise, evenings, midlife energy, and the “I blew it” spiral</li>
          <li>Accountability between sessions so you don't carry it alone</li>
        </ul>`,
      p(`Investment is <strong>${PRICE}</strong> paid in full, or <strong>$${PROGRAM.depositPrice}</strong> to hold your seat (balance before session 1).`),
      p("If you already know you want a coach for the next six weeks, don't wait for a more perfect Monday."),
      bookLine("Want to ask questions first? Book a free discovery call:"),
    ].join("\n"),
    ctaLabel: `Join for ${PRICE}`,
    ctaUrl: CTA,
  },
  {
    subject: "“But what if I fall off again?”",
    previewText: "That's the point of six weeks — not five perfect days.",
    headline: "You're allowed to be scared you'll fall off.",
    bodyHtml: [
      p("I hear this every time. “I did well for a few days. Then life happened.” That's not a character flaw. That's why five days isn't the whole plan."),
      p("<strong>If you're busy:</strong> we work inside the life you already have. No 37-container Sunday. The app is on the phone that's already in your pocket."),
      p("<strong>If your family won't eat “that way”:</strong> you don't need them to applaud. You need a plate that satisfies you and a swap you can live with at dinner."),
      p(`<strong>If money is tight:</strong> I hear you. This is not a $3,000 mastermind. It's ${PRICE} for six weeks of private support — or a $${PROGRAM.depositPrice} deposit.`),
      p("<strong>If you've tried before:</strong> good. Come anyway. We don't score you. We practice the next choice."),
      p(`The offer stays open through ${REAL_FOOD_RESET.offerClosesLabel}. Reply to this email if you have a real question — I read them.`),
      bookLine("Or book a free discovery call if a conversation would help more than another email:"),
    ].join("\n"),
    ctaLabel: "I want the 6 weeks",
    ctaUrl: CTA,
  },
  {
    subject: `Last invitation — ${PROGRAM_NAME}`,
    previewText: `Door open through ${REAL_FOOD_RESET.offerClosesLabel}. ${PRICE}.`,
    headline: "This is the last note I'll send about it.",
    subheadline: `Door open through ${REAL_FOOD_RESET.offerClosesLabel}`,
    bodyHtml: [
      p("I'm not going to chase you. You already proved something in five days. The question is whether you want someone walking the next six weeks with you."),
      p(`<strong>${PROGRAM_NAME}</strong> is ${PRICE}. Same app. Same “progress, not perfection.” Private sessions, not another restart speech.`),
      p("If now isn't the season, keep the food log. Keep turning the package around. You're still on this list, and I'm still glad you showed up in September."),
      p("If it is the season — come in before the door closes."),
      bookLine("If you want to talk it through first, book a free discovery call:"),
    ].join("\n"),
    ctaLabel: `Join ${PROGRAM_NAME}`,
    ctaUrl: CTA,
  },
];

export const REAL_FOOD_RESET_OFFER_EMAILS = DRAFTS.map(
  (draft) => (firstName: string) => wrap(firstName, draft)
);
