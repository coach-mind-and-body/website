import { describe, expect, it } from "vitest";
import {
  FOOD_NOISE_GLP1_SEO,
  applyBlogSeoOverride,
} from "./blogSeoOverrides";

describe("food noise after GLP-1 SEO", () => {
  it("sets the approved title and a 150-160 character description", () => {
    expect(FOOD_NOISE_GLP1_SEO.seoTitle).toBe(
      "Does Food Noise Come Back After Stopping Wegovy or Ozempic?"
    );
    expect(FOOD_NOISE_GLP1_SEO.seoTitle).not.toMatch(/Mind and Body Reset/i);
    expect(FOOD_NOISE_GLP1_SEO.seoDescription.length).toBeGreaterThanOrEqual(150);
    expect(FOOD_NOISE_GLP1_SEO.seoDescription.length).toBeLessThanOrEqual(160);
  });

  it("replaces SEO fields and leaves the article title and body alone", () => {
    const post = applyBlogSeoOverride({
      slug: "food-noise-after-stopping-ozempic-or-wegovy",
      title: "Food Noise After Stopping Ozempic or Wegovy: What Comes Next",
      content: "<p>unchanged body</p>",
      seoTitle: "Food Noise After Stopping Ozempic or Wegovy",
      seoDescription: "old description",
    });

    expect(post.title).toBe(
      "Food Noise After Stopping Ozempic or Wegovy: What Comes Next"
    );
    expect(post.content).toBe("<p>unchanged body</p>");
    expect(post.seoTitle).toBe(FOOD_NOISE_GLP1_SEO.seoTitle);
    expect(post.seoDescription).toBe(FOOD_NOISE_GLP1_SEO.seoDescription);
  });

  it("leaves other posts unchanged", () => {
    const other = applyBlogSeoOverride({
      slug: "calming-food-noise-drop-the-food-courtroom",
      seoTitle: "How to Calm Food Noise After 40 (Without Another Diet)",
      seoDescription: "existing",
    });
    expect(other.seoTitle).toBe(
      "How to Calm Food Noise After 40 (Without Another Diet)"
    );
  });
});
