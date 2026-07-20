/**
 * Paths that must not count toward marketing analytics (GA4 / Meta Pixel).
 * Admin dashboard traffic was inflating “people viewing the site.”
 */
const EXCLUDED_PREFIXES = [
  "/admin",
  // Auth screens used mainly by staff / clients — not public marketing traffic
  "/login",
  "/reset-password",
] as const;

export function isAnalyticsExcludedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split("?")[0] || pathname;
  return EXCLUDED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/** Browser flag used by gtag/fbq wrappers when scripts already loaded. */
export const ANALYTICS_DISABLED_FLAG = "__mbrDisableAnalytics";

export function setClientAnalyticsDisabled(disabled: boolean): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, boolean>)[ANALYTICS_DISABLED_FLAG] = disabled;
  // Official GA4 kill-switch for this measurement ID
  (window as unknown as Record<string, boolean>)["ga-disable-G-09SQ5LHEEJ"] = disabled;
}

export function isClientAnalyticsDisabled(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Record<string, boolean>)[ANALYTICS_DISABLED_FLAG];
}
