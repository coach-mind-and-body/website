import { youtubeIdFromUrl, youtubeWatchUrl } from "./youtube";

export type ReplaySource =
  | { kind: "youtube"; id: string }
  | { kind: "drive"; id: string; resourceKey?: string };

export type ReplayParseFailure = "meet_live" | "drive_folder" | "unrecognized";

export type ReplayParseResult =
  | { ok: true; source: ReplaySource }
  | { ok: false; error: ReplayParseFailure };

const DRIVE_ID = /^[A-Za-z0-9_-]{20,80}$/;
const DRIVE_PREFIX = "drive:";

function asUrl(raw: string): URL | null {
  const t = raw.trim();
  try {
    return new URL(t.startsWith("http") ? t : `https://${t}`);
  } catch {
    return null;
  }
}

function hostOf(u: URL): string {
  return u.hostname.replace(/^www\./, "").toLowerCase();
}

function driveFileIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/file\/d\/([A-Za-z0-9_-]{20,80})/);
  return m ? m[1] : null;
}

export function parseReplayUrl(raw: string): ReplayParseResult {
  const t = raw.trim();
  if (!t) return { ok: false, error: "unrecognized" };

  const yt = youtubeIdFromUrl(t);
  if (yt) return { ok: true, source: { kind: "youtube", id: yt } };

  const u = asUrl(t);
  if (!u) return { ok: false, error: "unrecognized" };
  const host = hostOf(u);

  if (host === "meet.google.com") {
    return { ok: false, error: "meet_live" };
  }

  if (host === "drive.google.com" || host === "docs.google.com") {
    if (/\/folders\//.test(u.pathname)) {
      return { ok: false, error: "drive_folder" };
    }
    const id = driveFileIdFromPath(u.pathname) || (DRIVE_ID.test(u.searchParams.get("id") || "") ? u.searchParams.get("id") : null);
    if (id) {
      const resourceKey = u.searchParams.get("resourcekey") || undefined;
      return { ok: true, source: { kind: "drive", id, resourceKey } };
    }
  }

  return { ok: false, error: "unrecognized" };
}

export function replayParseErrorMessage(error: ReplayParseFailure): string {
  switch (error) {
    case "meet_live":
      return "That's the live Meet room, not the recording. Open the file in Drive, share it as Anyone with the link, and paste that link.";
    case "drive_folder":
      return "That's a Drive folder. Open the recording file itself, share it as Anyone with the link, and paste that file link.";
    default:
      return "Paste a Google Drive share link (drive.google.com/file/d/…) or a YouTube link.";
  }
}

/** Stored in challenge_day_videos.videoId. YouTube stays an 11-char id so existing rows keep working. */
export function replayToken(source: ReplaySource): string {
  if (source.kind === "youtube") return source.id;
  return source.resourceKey ? `${DRIVE_PREFIX}${source.id}|${source.resourceKey}` : `${DRIVE_PREFIX}${source.id}`;
}

export function parseReplayToken(token: string | null | undefined): ReplaySource | null {
  if (!token) return null;
  const t = token.trim();
  if (t.startsWith(DRIVE_PREFIX)) {
    const rest = t.slice(DRIVE_PREFIX.length);
    const pipe = rest.indexOf("|");
    const id = pipe === -1 ? rest : rest.slice(0, pipe);
    const resourceKey = pipe === -1 ? undefined : rest.slice(pipe + 1);
    if (!DRIVE_ID.test(id)) return null;
    return { kind: "drive", id, resourceKey: resourceKey || undefined };
  }
  if (/^[\w-]{11}$/.test(t)) return { kind: "youtube", id: t };
  if (DRIVE_ID.test(t)) return { kind: "drive", id: t };
  return null;
}

export function replayWatchUrl(source: ReplaySource): string {
  if (source.kind === "youtube") return youtubeWatchUrl(source.id);
  const qs = source.resourceKey ? `?resourcekey=${encodeURIComponent(source.resourceKey)}` : "";
  return `https://drive.google.com/file/d/${source.id}/view${qs}`;
}

export function replayEmbedUrl(source: ReplaySource): string {
  if (source.kind === "youtube") return `https://www.youtube.com/embed/${source.id}?rel=0`;
  const qs = source.resourceKey ? `?resourcekey=${encodeURIComponent(source.resourceKey)}` : "";
  return `https://drive.google.com/file/d/${source.id}/preview${qs}`;
}
