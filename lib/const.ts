export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Only allow same-site relative paths after login (open-redirect safe).
 * Accepts "/habit-tracker" or full path+query; rejects //evil.com and external URLs.
 */
export function safeReturnTo(
  raw: string | null | undefined,
  fallback = "/portal"
): string {
  if (!raw) return fallback;
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return fallback;
  }
  // Block protocol-relative and weird schemes
  if (path.includes("\\") || /[\u0000-\u001F]/.test(path)) return fallback;
  return path;
}

// Point to the site's own login page (email/password + Google OAuth)
export const getLoginUrl = (returnTo?: string) => {
  const base = "/login";
  if (returnTo) {
    const safe = safeReturnTo(returnTo, "");
    if (safe) return `${base}?returnTo=${encodeURIComponent(safe)}`;
  }
  return base;
};
