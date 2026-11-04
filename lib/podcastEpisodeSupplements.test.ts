import { describe, expect, it } from "vitest";
import {
  EPISODE_SUPPLEMENTS,
  podcastNotesAreThin,
  showNotesForEpisode,
  summaryWordCount,
} from "./podcastEpisodeSupplements";

const STUB =
  "<p>Show notes for <strong>Example</strong>.</p><p>Watch the full episode below, then explore related resources for midlife health, food freedom, and lasting habits.</p>";

describe("thin podcast episode summaries", () => {
  it("keeps each summary between 150 and 300 words with 3 to 5 takeaways", () => {
    const slugs = Object.keys(EPISODE_SUPPLEMENTS);
    expect(slugs.length).toBeGreaterThanOrEqual(9);
    for (const slug of slugs) {
      const supplement = EPISODE_SUPPLEMENTS[slug];
      const words = summaryWordCount(supplement);
      expect(words, slug).toBeGreaterThanOrEqual(150);
      expect(words, slug).toBeLessThanOrEqual(300);
      expect(supplement.takeaways.length).toBeGreaterThanOrEqual(3);
      expect(supplement.takeaways.length).toBeLessThanOrEqual(5);
    }
  });

  it("replaces a stub and leaves a long page alone", () => {
    const slug = "why-your-brain-resists-change";
    expect(podcastNotesAreThin(STUB)).toBe(true);
    const replaced = showNotesForEpisode(slug, STUB);
    expect(replaced).toContain("Key takeaways");
    expect(replaced).not.toContain("Watch the full episode below");

    const long = `<p>${"word ".repeat(220)}</p>`;
    expect(podcastNotesAreThin(long)).toBe(false);
    expect(showNotesForEpisode(slug, long)).toBe(long);
    expect(showNotesForEpisode("not-a-thin-episode", STUB)).toBe(STUB);
  });
});
