import { describe, expect, it } from "vitest";
import { blogPostPath } from "./crawlArchive";
import {
  CURATED_RELATED,
  ORPHAN_POST_SLUGS,
  curatedTargets,
  mergeRelated,
} from "./relatedReading";

describe("related reading for orphan posts", () => {
  it("links each of the seven posts from a different published page", () => {
    const orphans = new Set<string>(ORPHAN_POST_SLUGS);
    expect(orphans.size).toBe(7);

    for (const slug of ORPHAN_POST_SLUGS) {
      const inbound = CURATED_RELATED.filter(link => link.toSlug === slug);
      expect(inbound.length).toBeGreaterThan(0);
      for (const link of inbound) {
        expect(link.fromSlug).not.toBe(slug);
        expect(orphans.has(link.fromSlug)).toBe(false);
        expect(link.fromSlug).not.toMatch(/financial-peace|unicity/);
        expect(blogPostPath(slug)).toBe(`/health-wellness-blog/${slug}`);
      }
    }
  });

  it("uses the live colon and menopause slugs", () => {
    expect(ORPHAN_POST_SLUGS).toContain(
      "colon-health-after-40-diet-inflammation"
    );
    expect(ORPHAN_POST_SLUGS).toContain(
      "embracing-change-redefining-your-journey-through-menopause"
    );
    expect(
      curatedTargets(
        "blog",
        "menopause-belly-why-it-shows-up-and-what-actually-helps"
      )
    ).toEqual(["embracing-change-redefining-your-journey-through-menopause"]);
  });

  it("keeps curated posts ahead of newer same-category posts", () => {
    const curated = [
      { slug: "colon-health-after-40-diet-inflammation" },
      {
        slug: "the-power-of-your-hormone-reset-embrace-day-one-with-confidence",
      },
    ];
    const others = [
      { slug: "mastering-insulin-fueling-fat-burning-and-energy-after-40" },
      { slug: "colon-health-after-40-diet-inflammation" },
      { slug: "the-insulin-resistance-plate-what-to-eat-after-40" },
    ];
    expect(mergeRelated(curated, others, 3).map(item => item.slug)).toEqual([
      "colon-health-after-40-diet-inflammation",
      "the-power-of-your-hormone-reset-embrace-day-one-with-confidence",
      "mastering-insulin-fueling-fat-burning-and-energy-after-40",
    ]);
  });

  it("points the reclaim episode at the postpartum article", () => {
    expect(
      curatedTargets("episode", "reclaim-rewire-reset-transform-identity")
    ).toEqual([
      "rebuilding-your-body-after-baby-how-i-got-my-energy-and-confidence-back",
    ]);
    expect(
      curatedTargets("blog", "reclaim-rewire-reset-transform-identity")
    ).toEqual([]);
  });
});
