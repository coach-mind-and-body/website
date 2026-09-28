export function youtubeIdFromUrl(raw: string): string | null {
  const t = raw.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    if (u.hostname.replace(/^www\./, "") === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").slice(0, 11);
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    const v = u.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const embed = u.pathname.match(/\/embed\/([\w-]{11})/);
    if (embed) return embed[1];
    const shorts = u.pathname.match(/\/shorts\/([\w-]{11})/);
    if (shorts) return shorts[1];
  } catch {
    return null;
  }
  return null;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
