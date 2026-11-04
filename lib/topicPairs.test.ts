import { describe, expect, it } from "vitest";
import {
  TOPIC_PAIRS,
  articlePathForPodcast,
  canonicalBlogPathForPodcast,
  pairForPodcast,
  podcastPathForBlog,
  primaryPodcastForBlog,
} from "./topicPairs";

describe("blog and podcast topic pairs", () => {
  it("keeps episode titles distinct and free of the brand", () => {
    const titles = TOPIC_PAIRS.map((pair) => pair.podcastTitle);
    expect(new Set(titles).size).toBe(titles.length);
    for (const pair of TOPIC_PAIRS) {
      expect(pair.podcastTitle.startsWith("Podcast:")).toBe(true);
      expect(pair.podcastTitle).not.toMatch(/Mind and Body Reset/i);
      expect(pair.mostlyDuplicate).toBe(false);
    }
  });

  it("does not canonicalize episodes that are not mostly duplicate text", () => {
    for (const pair of TOPIC_PAIRS) {
      expect(canonicalBlogPathForPodcast(pair.podcastSlug)).toBeNull();
      expect(articlePathForPodcast(pair.podcastSlug)).toBe(
        `/health-wellness-blog/${pair.blogSlug}`
      );
    }
    expect(canonicalBlogPathForPodcast("not-a-pair")).toBeNull();
  });

  it("points an article at the same-slug episode when a second episode shares it", () => {
    expect(podcastPathForBlog("why-youre-gaining-weight-in-perimenopause-even-with-good-habits")).toBe(
      "/midlife-health-podcast/why-youre-gaining-weight-in-perimenopause-even-with-good-habits"
    );
    expect(
      primaryPodcastForBlog("why-am-i-gaining-weight-after-40-even-when-i-eat-less")?.podcastSlug
    ).toBe("why-am-i-gaining-weight-after-40-even-when-i-eat-less");
    expect(pairForPodcast("navigating-midlife-changes-hormones-weight")?.blogSlug).toBe(
      "why-youre-gaining-weight-in-perimenopause-even-with-good-habits"
    );
  });

  it("uses one podcast slug per pair", () => {
    const slugs = TOPIC_PAIRS.map((pair) => pair.podcastSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
