import { headers } from "next/headers";

export async function appUrl() {
  const fromEnv = (
    process.env.WEEKLY_PAIRS_URL?.trim() || process.env.APP_URL?.trim() || ""
  ).replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv.endsWith("/this-week") ? fromEnv : `${fromEnv}/this-week`;
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return "http://localhost:3000/this-week";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}/this-week`;
}

export async function memberUrl(token: string) {
  return `${await appUrl()}/m/${token}`;
}

export async function homeUrl() {
  return await appUrl();
}
