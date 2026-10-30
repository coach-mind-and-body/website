import { describe, expect, it } from "vitest";
import {
  BOOK_INTRO,
  BOOK_PAGE_SEO,
  HABIT_TRACKER_INTRO,
  HABIT_TRACKER_PAGE_SEO,
  introWordCount,
} from "./thinPageCopy";

describe("book and habit tracker intro copy", () => {
  it("keeps each intro between 150 and 300 words", () => {
    for (const paragraphs of [BOOK_INTRO, HABIT_TRACKER_INTRO]) {
      const words = introWordCount(paragraphs);
      expect(words).toBeGreaterThanOrEqual(150);
      expect(words).toBeLessThanOrEqual(300);
    }
  });

  it("uses unique titles and descriptions without the brand in the title", () => {
    expect(BOOK_PAGE_SEO.title).not.toBe(HABIT_TRACKER_PAGE_SEO.title);
    expect(BOOK_PAGE_SEO.description).not.toBe(HABIT_TRACKER_PAGE_SEO.description);
    for (const seo of [BOOK_PAGE_SEO, HABIT_TRACKER_PAGE_SEO]) {
      expect(seo.title).not.toMatch(/Mind and Body Reset/i);
      expect(seo.description.length).toBeGreaterThan(50);
    }
  });
});
