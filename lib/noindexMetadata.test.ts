import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { noindexWithoutInheritedCanonical } from "./noindexMetadata";

const HABIT_SUBPAGES = [
  "app/habit-tracker/calories/page.tsx",
  "app/habit-tracker/recipes/page.tsx",
  "app/habit-tracker/recipes/[slug]/page.tsx",
  "app/habit-tracker/podcasts/page.tsx",
  "app/habit-tracker/fitness/page.tsx",
  "app/habit-tracker/profile/page.tsx",
  "app/habit-tracker/coach/page.tsx",
  "app/habit-tracker/meal-plan/page.tsx",
  "app/habit-tracker/shop/page.tsx",
];

describe("noindexWithoutInheritedCanonical", () => {
  it("is noindex for robots and googlebot and emits no canonical", () => {
    const metadata = noindexWithoutInheritedCanonical({
      title: { absolute: "Calorie Tracker" },
      description: "Track meals.",
    });

    expect(metadata.robots).toEqual({
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    });
    expect(metadata.alternates).toEqual({ canonical: null });
    expect(metadata.title).toEqual({ absolute: "Calorie Tracker" });
    expect(metadata.description).toBe("Track meals.");
  });

  it("can nofollow an error page", () => {
    const metadata = noindexWithoutInheritedCanonical(
      { title: "Page Not Found" },
      { follow: false }
    );

    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
    expect(metadata.alternates).toEqual({ canonical: null });
  });
});

describe("habit tracker indexing", () => {
  it("noindexes app subpages without a homepage canonical", () => {
    for (const file of HABIT_SUBPAGES) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("noindexWithoutInheritedCanonical");
    }
  });

  it("leaves the habit tracker landing page indexable on its own URL", () => {
    const source = readFileSync("app/habit-tracker/page.tsx", "utf8");
    expect(source).toContain('canonical: "/habit-tracker"');
    expect(source).not.toContain("noindexWithoutInheritedCanonical");
  });
});

describe("404 metadata", () => {
  it("noindexes the not-found template and clears the homepage canonical", () => {
    const source = readFileSync("app/not-found.tsx", "utf8");
    expect(source).toContain("noindexWithoutInheritedCanonical");
    expect(source).toContain("follow: false");
  });
});

describe("holistic health outgoing links", () => {
  it("points Financial Peace and Feel Great links at the live pages", () => {
    const source = readFileSync(
      "app/holistic-health-and-wellness/HolisticHealthClient.tsx",
      "utf8"
    );
    expect(source).toContain('link: "/financial-peace"');
    expect(source).toContain('link: "/unicity"');
    expect(source).toContain('href="/unicity"');
    expect(source).not.toContain("/financial-peace-university");
    expect(source).not.toContain("/feel-great-system");
  });
});
