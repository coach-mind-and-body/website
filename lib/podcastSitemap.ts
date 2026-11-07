function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type PodcastSitemapRow = {
  slug: string;
  publishedAt: Date | string | null;
  updatedAt: Date | string | null;
};

function lastmodDay(
  episode: PodcastSitemapRow,
  fallbackDay: string
): string {
  const stamp = episode.updatedAt || episode.publishedAt;
  if (!stamp) return fallbackDay;
  return new Date(stamp).toISOString().split("T")[0];
}

/** One <url> block per published episode row. The query decides published vs draft. */
export function podcastSitemapUrl(
  siteUrl: string,
  episode: PodcastSitemapRow,
  fallbackDay: string
): string {
  return `
  <url>
    <loc>${siteUrl}/midlife-health-podcast/${escapeXml(episode.slug)}</loc>
    <lastmod>${lastmodDay(episode, fallbackDay)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.65</priority>
  </url>`;
}
