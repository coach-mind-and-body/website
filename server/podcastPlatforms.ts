import { eq } from "drizzle-orm";
import { podcastEpisodes } from "../drizzle/schema";
import { getDb } from "./db";
import {
  appleEpisodeSlug,
  appleEpisodeUrl,
  episodeTitlesMatch,
  normalizeEpisodeTitle,
  showListenTarget,
  youtubeEpisodeUrl,
  type ListenTarget,
} from "@shared/podcastLinks";

const APPLE_LOOKUP =
  "https://itunes.apple.com/lookup?id=6821146296&entity=podcastEpisode&limit=200";
const SPOTIFY_EMBED =
  "https://open.spotify.com/embed/show/4Ohw5PZw6XD2Mqo94EiwLu?utm_source=oembed";
const PODBEAN_FEED = "https://feed.podbean.com/mindandbodyresetgals/feed.xml";

type PlatformEpisode = {
  title: string;
  spotifyUrl: string | null;
  appleUrl: string | null;
};

/**
 * Episodes already on Spotify. The show embed only returns the latest episode,
 * so earlier ones stay listed here.
 */
const SPOTIFY_SEED: PlatformEpisode[] = [
  {
    title: "Are You Shoulding All Over Yourself?",
    spotifyUrl: "https://open.spotify.com/episode/2nomH3yw4TtuTp5SyYOXoc",
    appleUrl: appleEpisodeUrl("are-you-shoulding-all-over-yourself", "1000794529789"),
  },
];

type Cache = { at: number; ttl: number; episodes: PlatformEpisode[] };
let cache: Cache | null = null;

async function fetchText(url: string, ms = 5000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MindBodyReset/1.0; +https://mindandbodyresetcoach.com)",
        Accept: "application/json, application/xml, text/html, */*",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function appleUrlFromLookup(row: {
  trackName?: string;
  trackId?: number;
  trackViewUrl?: string;
}): string | null {
  const episodeId =
    row.trackId ||
    Number(row.trackViewUrl?.match(/[?&]i=(\d+)/)?.[1] || "");
  if (!episodeId || !row.trackName) return null;
  const slug =
    row.trackViewUrl?.match(/\/podcast\/([^/?]+)\/id\d+/)?.[1] ||
    appleEpisodeSlug(row.trackName);
  return appleEpisodeUrl(slug, episodeId);
}

function merge(list: PlatformEpisode[]): PlatformEpisode[] {
  const byKey = new Map<string, PlatformEpisode>();
  for (const ep of list) {
    const key = normalizeEpisodeTitle(ep.title);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...ep });
      continue;
    }
    prev.spotifyUrl = prev.spotifyUrl || ep.spotifyUrl;
    prev.appleUrl = prev.appleUrl || ep.appleUrl;
  }
  return [...byKey.values()];
}

async function fetchAppleEpisodes(): Promise<PlatformEpisode[]> {
  const text = await fetchText(APPLE_LOOKUP);
  if (!text) return [];
  try {
    const data = JSON.parse(text) as {
      results?: { kind?: string; trackName?: string; trackId?: number; trackViewUrl?: string }[];
    };
    return (data.results ?? [])
      .filter((row) => row.kind === "podcast-episode" && row.trackName)
      .map((row) => ({
        title: row.trackName as string,
        spotifyUrl: null,
        appleUrl: appleUrlFromLookup(row),
      }))
      .filter((row) => row.appleUrl);
  } catch {
    return [];
  }
}

async function fetchSpotifyLatest(): Promise<PlatformEpisode[]> {
  const html = await fetchText(SPOTIFY_EMBED);
  if (!html) return [];
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return [];
  try {
    const data = JSON.parse(match[1]) as {
      props?: { pageProps?: { state?: { data?: { entity?: { type?: string; title?: string; id?: string } } } } };
    };
    const entity = data.props?.pageProps?.state?.data?.entity;
    if (entity?.type !== "episode" || !entity.title || !entity.id) return [];
    return [
      {
        title: entity.title,
        spotifyUrl: `https://open.spotify.com/episode/${entity.id}`,
        appleUrl: null,
      },
    ];
  } catch {
    return [];
  }
}

async function fetchRssSpotify(): Promise<PlatformEpisode[]> {
  const xml = await fetchText(PODBEAN_FEED);
  if (!xml) return [];
  const found: PlatformEpisode[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title =
      item.match(/<itunes:title>([^<]+)<\/itunes:title>/)?.[1]?.trim() ||
      item.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
    const id =
      item.match(/open\.spotify\.com\/episode\/([A-Za-z0-9]+)/)?.[1] ||
      item.match(/spotify:episode:([A-Za-z0-9]+)/)?.[1];
    if (!title || !id) continue;
    found.push({
      title,
      spotifyUrl: `https://open.spotify.com/episode/${id}`,
      appleUrl: null,
    });
  }
  return found;
}

export async function loadPlatformEpisodes(): Promise<PlatformEpisode[]> {
  if (cache && Date.now() - cache.at < cache.ttl) return cache.episodes;

  const [apple, spotifyLatest, rss] = await Promise.all([
    fetchAppleEpisodes(),
    fetchSpotifyLatest(),
    fetchRssSpotify(),
  ]);
  const fresh = apple.length > 0 || spotifyLatest.length > 0 || rss.length > 0;
  const episodes = merge([...SPOTIFY_SEED, ...apple, ...spotifyLatest, ...rss]);
  cache = { at: Date.now(), ttl: fresh ? 30 * 60 * 1000 : 2 * 60 * 1000, episodes };
  return episodes;
}

export async function platformUrlsForTitle(title: string): Promise<{
  spotifyUrl: string | null;
  appleUrl: string | null;
}> {
  try {
    const catalog = await loadPlatformEpisodes();
    const hit = catalog.find((ep) => episodeTitlesMatch(ep.title, title));
    return { spotifyUrl: hit?.spotifyUrl ?? null, appleUrl: hit?.appleUrl ?? null };
  } catch {
    const hit = SPOTIFY_SEED.find((ep) => episodeTitlesMatch(ep.title, title));
    return { spotifyUrl: hit?.spotifyUrl ?? null, appleUrl: hit?.appleUrl ?? null };
  }
}

export async function attachPlatformUrls<
  T extends { title: string; spotifyUrl?: string | null; appleUrl?: string | null },
>(episodes: T[]): Promise<T[]> {
  let catalog: PlatformEpisode[] = SPOTIFY_SEED;
  try {
    catalog = await loadPlatformEpisodes();
  } catch {
    catalog = SPOTIFY_SEED;
  }
  for (const ep of episodes) {
    const hit = catalog.find((row) => episodeTitlesMatch(row.title, ep.title));
    ep.spotifyUrl = hit?.spotifyUrl ?? null;
    ep.appleUrl = hit?.appleUrl ?? null;
  }
  return episodes;
}

function episodeSlugFromHtml(html: string): string | null {
  const match = html.match(/\/midlife-health-podcast\/([a-z0-9-]+)/i);
  return match?.[1] ?? null;
}

function videoIdFromHtml(html: string): string | null {
  const match = html.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/);
  return match?.[1] ?? null;
}

/** Icons for a blog post: the episode it discusses, or the show if it only links the podcast. */
export async function listenTargetForBlogPost(
  slug: string,
  content: string,
  schemaVideoUrl: string | null
): Promise<ListenTarget | null> {
  const db = await getDb();
  if (!db) return null;

  const htmlSlug = episodeSlugFromHtml(content);
  const videoId = videoIdFromHtml(schemaVideoUrl || "") || videoIdFromHtml(content);

  const [byBlog] = await db
    .select()
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.linkedBlogSlug, slug))
    .limit(1);

  let row = byBlog ?? null;
  if (!row && htmlSlug) {
    const [bySlug] = await db
      .select()
      .from(podcastEpisodes)
      .where(eq(podcastEpisodes.slug, htmlSlug))
      .limit(1);
    row = bySlug ?? null;
  }
  if (!row && videoId) {
    const [byVideo] = await db
      .select()
      .from(podcastEpisodes)
      .where(eq(podcastEpisodes.videoId, videoId))
      .limit(1);
    row = byVideo ?? null;
  }

  if (row?.videoId && row.title) {
    const platforms = await platformUrlsForTitle(row.title);
    return {
      youtubeUrl: youtubeEpisodeUrl(row.videoId),
      spotifyUrl: platforms.spotifyUrl,
      appleUrl: platforms.appleUrl,
      episodeTitle: row.title,
    };
  }

  if (htmlSlug || /\/midlife-health-podcast(?!\/[a-z0-9])/i.test(content)) {
    return showListenTarget();
  }
  return null;
}
