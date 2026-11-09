/**
 * Href builders for the blog and podcast indexes.
 * The index pages render one <a href> per published item from these paths
 * so the first HTML response is a crawl path, not a client-only list.
 */

export const BLOG_INDEX_PATH = "/health-wellness-blog";
export const PODCAST_INDEX_PATH = "/midlife-health-podcast";

export type ArchiveEntry = {
  slug: string;
  title: string;
  publishedAt?: string | null;
};

export function blogPostPath(slug: string): string {
  return `${BLOG_INDEX_PATH}/${slug}`;
}

export function episodePath(slug: string): string {
  return `${PODCAST_INDEX_PATH}/${slug}`;
}

/** Unique crawlable paths, in the order the index should print them. */
export function archiveHrefs(
  entries: readonly ArchiveEntry[],
  kind: "blog" | "episode"
): string[] {
  const toPath = kind === "blog" ? blogPostPath : episodePath;
  const seen = new Set<string>();
  const hrefs: string[] = [];
  for (const entry of entries) {
    const slug = entry.slug?.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    hrefs.push(toPath(slug));
  }
  return hrefs;
}

/** UTC calendar date so server and client markup match. */
export function formatArchiveDate(
  iso: string | null | undefined
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
