/**
 * Inbound links for published posts that the Nov 9, 2026 crawl found
 * with zero <a href> from any other sitemap page.
 *
 * Each target is an existing article. The source is a different published
 * page on the same subject (a hub-linked article, or the episode that
 * already pairs with that article). Link text is the live title from the
 * database, not copy written here.
 */

export const ORPHAN_POST_SLUGS = [
  "when-your-body-stops-responding-finding-the-balance",
  "rebuilding-your-body-after-baby-how-i-got-my-energy-and-confidence-back",
  "colon-health-after-40-diet-inflammation",
  "embrace-reflection-shifting-from-fault-finding-to-self-awareness",
  "the-power-of-your-hormone-reset-embrace-day-one-with-confidence",
  "embracing-change-redefining-your-journey-through-menopause",
  "stop-food-shame-healing-midlife-insulin-resistance",
] as const;

export type RelatedSourceKind = "blog" | "episode";

export type CuratedRelatedLink = {
  fromKind: RelatedSourceKind;
  fromSlug: string;
  toSlug: (typeof ORPHAN_POST_SLUGS)[number];
};

export const CURATED_RELATED: readonly CuratedRelatedLink[] = [
  {
    fromKind: "blog",
    fromSlug: "why-am-i-gaining-weight-after-40-even-when-i-eat-less",
    toSlug: "when-your-body-stops-responding-finding-the-balance",
  },
  {
    fromKind: "blog",
    fromSlug: "reclaim-rewire-reset-become-a-different-decision-maker",
    toSlug:
      "rebuilding-your-body-after-baby-how-i-got-my-energy-and-confidence-back",
  },
  {
    fromKind: "episode",
    fromSlug: "reclaim-rewire-reset-transform-identity",
    toSlug:
      "rebuilding-your-body-after-baby-how-i-got-my-energy-and-confidence-back",
  },
  {
    fromKind: "blog",
    fromSlug: "mastering-insulin-fueling-fat-burning-and-energy-after-40",
    toSlug: "colon-health-after-40-diet-inflammation",
  },
  {
    fromKind: "blog",
    fromSlug: "midlife-body-image-your-body-is-not-a-before-picture",
    toSlug: "embrace-reflection-shifting-from-fault-finding-to-self-awareness",
  },
  {
    fromKind: "blog",
    fromSlug: "mastering-insulin-fueling-fat-burning-and-energy-after-40",
    toSlug: "the-power-of-your-hormone-reset-embrace-day-one-with-confidence",
  },
  {
    fromKind: "blog",
    fromSlug: "menopause-belly-why-it-shows-up-and-what-actually-helps",
    toSlug: "embracing-change-redefining-your-journey-through-menopause",
  },
  {
    fromKind: "blog",
    fromSlug: "how-to-stop-emotional-eating-after-40-without-shame",
    toSlug: "stop-food-shame-healing-midlife-insulin-resistance",
  },
];

export type RelatedCard = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  coverImage: string | null;
  publishedAt: string | null;
};

export function curatedTargets(
  fromKind: RelatedSourceKind,
  fromSlug: string
): string[] {
  return CURATED_RELATED.filter(
    link => link.fromKind === fromKind && link.fromSlug === fromSlug
  ).map(link => link.toSlug);
}

/**
 * Curated cards stay, in the given order, even when same-category recents
 * would otherwise fill the row. Then fill up to `limit`.
 */
export function mergeRelated<T extends { slug: string }>(
  curated: readonly T[],
  others: readonly T[],
  limit = 3
): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  const push = (item: T) => {
    if (!item.slug || seen.has(item.slug)) return;
    seen.add(item.slug);
    out.push(item);
  };
  for (const item of curated) push(item);
  const cap = Math.max(limit, out.length);
  for (const item of others) {
    if (out.length >= cap) break;
    push(item);
  }
  return out;
}
