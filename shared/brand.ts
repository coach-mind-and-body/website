// Mind & Body Reset — Brand Constants
// Single source of truth for all brand config, URLs, and copy

/** Canonical production origin (apex, no www). Use everywhere for SEO. */
export const SITE_URL = "https://mindandbodyresetcoach.com";

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export const BRAND = {
  name: "Mind & Body Reset Coaches",
  tagline: "Reclaim Your Body. Rewire Your Mind. Reset Your Life.",
  coachName: "Lee Anne",
  coachFullName: "Lee Anne Chapman",
  website: SITE_URL,
  logoUrl: "/logo-new.jpg",
  logoWideUrl: "/logo-wide.jpg",
} as const;

export const GOOGLE_CALENDAR = {
  // Free 30-min discovery call (1st appointment only)
  discoveryCall:
    "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1hsIet71zyFRyzpnpjs1wUWx7ibZhsDTVpOWUR3BE1lQNLirGK6tyRywHa7-xgQz1MaK4zDTHt?gv=true",
  // R.E.C.L.A.I.M. 6-Week Program sessions (50 min, paid clients only)
  reclaimSession:
    "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3tlzR8FWHdYzdtXqI43ULRAnOYehFPjpe7uLgjQn9fJ3udHMCJLlIQhahbQ9-_R-GjtY8r6O5k",
} as const;

export const PROGRAM = {
  name: "R.E.C.L.A.I.M.",
  fullName: "R.E.C.L.A.I.M. 6-Week Mind & Body Reset",
  tagline: "Experience transformation and empowerment",
  sessionCount: 6,
  sessionDurationMins: 50,
  fullPrice: 597,
  depositPrice: 200,
  balancePrice: 397,
  originalPrice: 1294,
  savingsPercent: 54,
  currency: "USD",
} as const;

export const BLOG_CATEGORIES = [
  "Body Image",
  "Hormonal Health",
  "Menopause & Hormonal Health",
  "Mind and Body Reset",
  "Mindful Eating & Nutrition",
  "Mindset & Self-Compassion",
  "Thought Work",
  "Weight Loss Mindset",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
