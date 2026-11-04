import { describe, expect, it } from "vitest";
import { UTAH_LINKS, UTAH_PAGE, utahBodyWordCount } from "./utahHealthCoach";

describe("Utah health coach page", () => {
  it("stays between 500 and 800 words and keeps the brand out of the title", () => {
    const words = utahBodyWordCount();
    expect(words).toBeGreaterThanOrEqual(500);
    expect(words).toBeLessThanOrEqual(800);
    expect(UTAH_PAGE.title).not.toMatch(/Mind and Body Reset/i);
    expect(UTAH_PAGE.description.length).toBeGreaterThan(50);
    expect(UTAH_PAGE.description).not.toBe(UTAH_PAGE.title);
  });

  it("links the book page, the about page, and three to five articles", () => {
    expect(UTAH_LINKS.some((link) => link.href === "/book")).toBe(true);
    expect(UTAH_LINKS.some((link) => link.href === "/about")).toBe(true);
    const articles = UTAH_LINKS.filter((link) => link.href.startsWith("/health-wellness-blog/"));
    expect(articles.length).toBeGreaterThanOrEqual(3);
    expect(articles.length).toBeLessThanOrEqual(5);
  });
});
