/**
 * Blog posts and podcast episodes that target the same query.
 *
 * Both URLs stay live. The article is the ranking page.
 * rel=canonical on the episode points at the article only when the episode
 * page is mostly the same text. These pairs were compared against the live
 * pages (sentence overlap and sequence similarity). None were mostly
 * duplicate — shared stories, different wording — so each episode gets a
 * distinct "Podcast:" title and H1 instead of a cross-canonical.
 *
 * Titles omit the brand. The root layout template appends it.
 */

export type TopicPair = {
  podcastSlug: string;
  blogSlug: string;
  /** True only when the episode page body is mostly the same text as the article. */
  mostlyDuplicate: boolean;
  /** Document title segment and on-page H1. */
  podcastTitle: string;
};

export const TOPIC_PAIRS: readonly TopicPair[] = [
  {
    podcastSlug: "normal-is-making-you-sick",
    blogSlug: "normal-is-making-you-sick",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Normal Is Making You Sick",
  },
  {
    podcastSlug: "are-you-shoulding-all-over-yourself",
    blogSlug: "are-you-shoulding-all-over-yourself",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Are You Shoulding All Over Yourself?",
  },
  {
    podcastSlug: "why-you-overspend-and-overeat-the-self-trust-leak",
    blogSlug: "why-you-overspend-and-overeat-the-self-trust-leak",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: The Self-Trust Leak",
  },
  {
    podcastSlug: "the-insulin-resistance-plate-what-to-eat-after-40",
    blogSlug: "the-insulin-resistance-plate-what-to-eat-after-40",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: The Insulin Resistance Plate",
  },
  {
    podcastSlug: "why-youre-gaining-weight-in-perimenopause-even-with-good-habits",
    blogSlug: "why-youre-gaining-weight-in-perimenopause-even-with-good-habits",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Weight Loss Stopping in Perimenopause",
  },
  {
    podcastSlug: "is-60-too-old-to-start-over",
    blogSlug: "is-60-too-old-to-start-over",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Is 60 Too Old to Start Over?",
  },
  {
    podcastSlug: "why-am-i-gaining-weight-after-40-even-when-i-eat-less",
    blogSlug: "why-am-i-gaining-weight-after-40-even-when-i-eat-less",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Gaining Weight After 40 When You Eat Less",
  },
  {
    podcastSlug: "could-tiny-movements-transform-your-energy-levels",
    blogSlug: "what-if-you-did-an-exercise-snack-instead",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Could Tiny Movements Replace the Snack?",
  },
  {
    podcastSlug: "overcoming-nighttime-sugar-battles",
    blogSlug: "how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Nighttime Sugar Battles After 40",
  },
  {
    podcastSlug: "fuel-system-reset-sugar-to-fat-burn",
    blogSlug: "fuel-system-reset-switching-from-sugar-to-fat-burning",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: The Sugar-to-Fat Fuel Switch",
  },
  {
    podcastSlug: "breaking-the-cycle-habits-not-plans",
    blogSlug: "stop-chasing-plans-lasting-health-transformation",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Habits, Not Another Plan",
  },
  {
    podcastSlug: "reclaim-rewire-reset-transform-identity",
    blogSlug: "reclaim-rewire-reset-become-a-different-decision-maker",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Reclaim, Rewire, Reset",
  },
  {
    podcastSlug: "fuel-fat-loss-over-40-balance-insulin",
    blogSlug: "mastering-insulin-fueling-fat-burning-and-energy-after-40",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Balance Insulin and Energy After 40",
  },
  {
    podcastSlug: "why-your-brain-resists-change",
    blogSlug: "beyond-willpower-how-to-stop-self-sabotaging-weight-loss-after-40",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Why Your Brain Resists Change",
  },
  {
    podcastSlug: "navigating-midlife-changes-hormones-weight",
    blogSlug: "why-youre-gaining-weight-in-perimenopause-even-with-good-habits",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Hormones, Weight, and a New Beginning",
  },
  {
    podcastSlug: "beyond-the-scale-building-new-weight-loss-patterns",
    blogSlug: "why-am-i-gaining-weight-after-40-even-when-i-eat-less",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Beyond the Scale",
  },
  {
    podcastSlug: "bridging-the-divide-body-journey-to-peace",
    blogSlug: "weight-loss-mindset-mind-the-gap-to-find-your-peace",
    mostlyDuplicate: false,
    podcastTitle: "Podcast: Bridging the Divide",
  },
] as const;

const byPodcast = new Map(TOPIC_PAIRS.map((pair) => [pair.podcastSlug, pair]));

export function pairForPodcast(slug: string): TopicPair | undefined {
  return byPodcast.get(slug);
}

/** Article path when this episode should canonicalize to the blog. Otherwise null. */
export function canonicalBlogPathForPodcast(slug: string): string | null {
  const pair = pairForPodcast(slug);
  if (!pair?.mostlyDuplicate) return null;
  return `/health-wellness-blog/${pair.blogSlug}`;
}

export function articlePathForPodcast(slug: string): string | null {
  const pair = pairForPodcast(slug);
  if (!pair) return null;
  return `/health-wellness-blog/${pair.blogSlug}`;
}

/**
 * The episode the article should link to.
 * When two episodes share an article, prefer the one whose slug matches the article.
 */
export function primaryPodcastForBlog(blogSlug: string): TopicPair | undefined {
  const matches = TOPIC_PAIRS.filter((pair) => pair.blogSlug === blogSlug);
  if (matches.length === 0) return undefined;
  return matches.find((pair) => pair.podcastSlug === pair.blogSlug) ?? matches[0];
}

export function podcastPathForBlog(blogSlug: string): string | null {
  const pair = primaryPodcastForBlog(blogSlug);
  if (!pair) return null;
  return `/midlife-health-podcast/${pair.podcastSlug}`;
}
