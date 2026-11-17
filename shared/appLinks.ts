import { SITE_URL } from "./brand";

/** Team ID + bundle ID. Associated Domains must be on for this App ID. */
export const APPLE_APP_ID = "8D3TJ8W8XK.com.mindandbodyreset.habittracker";

/**
 * Paths that should open the iOS app. Marketing pages (/reclaim, /book, /blog, /food-quiz)
 * are intentionally absent so they stay in Safari.
 */
export const UNIVERSAL_LINK_PATHS = [
  "/habit-tracker",
  "/habit-tracker/",
  "/habit-tracker/*",
  "/portal",
  "/portal/",
  "/portal/*",
] as const;

export function appleAppSiteAssociation() {
  return {
    applinks: {
      apps: [] as string[],
      details: [
        {
          appID: APPLE_APP_ID,
          paths: [...UNIVERSAL_LINK_PATHS],
        },
      ],
    },
  };
}

/** Challenge emails were `/habit-tracker`, which opens Habits. This opens the challenge pane. */
export function challengeAppUrl(claimToken?: string | null): string {
  const url = new URL("/habit-tracker", SITE_URL);
  url.searchParams.set("focus", "challenge");
  if (claimToken) url.searchParams.set("claim", claimToken);
  return url.toString();
}

export const HABITS_APP_URL = `${SITE_URL}/habit-tracker`;
export const COACH_APP_URL = `${SITE_URL}/habit-tracker/coach`;
export const FOOD_APP_URL = `${SITE_URL}/habit-tracker/calories`;
export const PORTAL_APP_URL = `${SITE_URL}/portal`;
export const PORTAL_HUB_URL = `${SITE_URL}/portal/hub`;

export function formAppUrl(formId: number): string {
  return `${SITE_URL}/portal/forms/${formId}`;
}
