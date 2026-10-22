/** Apple Podcasts show id. Episode links add /{slug}/id{this}?i={episodeId}. */
export const APPLE_PODCAST_ID = "6821146296";

/** Where the Mind and Body Reset podcast lives, show-wide. */
export const PODCAST_SHOW = {
  spotify: "https://open.spotify.com/show/4Ohw5PZw6XD2Mqo94EiwLu",
  apple: `https://podcasts.apple.com/us/podcast/the-mindandbodyresetgalss-podcast/id${APPLE_PODCAST_ID}`,
  /** The podcast playlist, not the whole channel. */
  youtube:
    "https://www.youtube.com/playlist?list=PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H",
} as const;

export type ListenTarget = {
  youtubeUrl: string;
  spotifyUrl: string | null;
  appleUrl: string | null;
  /** Set when these URLs are for one episode. Null means the whole show. */
  episodeTitle: string | null;
};

export function showListenTarget(): ListenTarget {
  return {
    youtubeUrl: PODCAST_SHOW.youtube,
    spotifyUrl: PODCAST_SHOW.spotify,
    appleUrl: PODCAST_SHOW.apple,
    episodeTitle: null,
  };
}

export function youtubeEpisodeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function appleEpisodeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&amp;/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Episode link: /podcast/{slug}/id6821146296?i={episodeId} */
export function appleEpisodeUrl(episodeSlug: string, episodeId: string | number): string {
  const slug = episodeSlug.replace(/^\/+|\/+$/g, "");
  return `https://podcasts.apple.com/us/podcast/${slug}/id${APPLE_PODCAST_ID}?i=${episodeId}`;
}

export function normalizeEpisodeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** True when two episode titles are the same recording, even if one has a suffix. */
export function episodeTitlesMatch(a: string, b: string): boolean {
  const na = normalizeEpisodeTitle(a);
  const nb = normalizeEpisodeTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  return shorter.length >= 24 && longer.includes(shorter);
}
