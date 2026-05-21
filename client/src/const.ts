export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Point to the site's own login page (email/password + Google OAuth)
export const getLoginUrl = (returnTo?: string) => {
  const base = "/login";
  if (returnTo) return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  return base;
};

// Keep the Manus OAuth URL available for admin-only use if needed
export const getManusLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
};
