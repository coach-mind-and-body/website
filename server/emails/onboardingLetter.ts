import { BRAND, SITE_URL } from "@shared/brand";
import { escapeHtml } from "../../lib/htmlEscape";
import { buildNewsletterHtml } from "./newsletterShell";
import {
  HOLIDAY_EMAIL_LOGO_BAR,
  HOLIDAY_EMAIL_LOGO_URL,
  HOLIDAY_EMAIL_LOGO_WIDTH,
  USE_HOLIDAY_EMAIL_LOGO,
} from "./holidayLogo";

export const PORTAL_URL = `${SITE_URL}/portal`;
export const APP_STORE_URL = BRAND.appStoreUrl;
export const APP_NAME = BRAND.appStoreName;

const appNameHtml = escapeHtml(APP_NAME);

export function p(html: string): string {
  return `<p>${html}</p>`;
}

/** Three ways to get a meal into the food log. No accuracy claim. */
export function foodLogWays(): string {
  return `<ul>
<li>Type what you ate.</li>
<li>Take a photo of your plate.</li>
<li>If you already wrote it on paper, take a photo of that page.</li>
</ul>`;
}

/** App, website portal, and Google sign-in, so each note stands alone. */
export function whereToLook(): string {
  return p(
    `Your program, assignments, food log, and files are in the <a href="${APP_STORE_URL}">${appNameHtml} app</a>. On the website, open <a href="${PORTAL_URL}">mindandbodyresetcoach.com/portal</a>. Sign in with this same account, or choose <strong>Continue with Google</strong>.`
  );
}

export type LetterInput = {
  firstName: string;
  previewText: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /**
   * Omit to follow USE_HOLIDAY_EMAIL_LOGO.
   * Pass false to render the regular wide logo (the January switch).
   */
  holidayLogo?: boolean;
};

export function renderOnboardingLetter(input: LetterInput): string {
  const seasonal = input.holidayLogo ?? USE_HOLIDAY_EMAIL_LOGO;
  return buildNewsletterHtml({
    firstName: input.firstName,
    previewText: input.previewText,
    greetingTemplate: "Hi {{firstName}},",
    signOffClosing: "Better Than Perfect,",
    signOffName: "Lee Anne",
    signOffTitle: "Mind & Body Reset",
    bodyHtml: input.bodyHtml,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    ...(seasonal
      ? {
          logoUrl: HOLIDAY_EMAIL_LOGO_URL,
          logoWidth: HOLIDAY_EMAIL_LOGO_WIDTH,
          logoBarColor: HOLIDAY_EMAIL_LOGO_BAR,
        }
      : {}),
  });
}
