"use client";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getMetaParams(): { fbc?: string; fbp?: string } {
  const fbc = readCookie("_fbc");
  const fbp = readCookie("_fbp");
  return {
    ...(fbc ? { fbc } : {}),
    ...(fbp ? { fbp } : {}),
  };
}

export function generateMetaEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function captureFbclidFromUrl(): void {
  if (typeof window === "undefined") return;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return;

  const existing = readCookie("_fbc");
  if (existing?.endsWith(fbclid)) return;

  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  const maxAge = 90 * 24 * 60 * 60;
  document.cookie = `_fbc=${encodeURIComponent(fbc)}; path=/; max-age=${maxAge}; samesite=lax`;
}
