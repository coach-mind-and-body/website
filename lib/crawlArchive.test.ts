import { describe, expect, it } from "vitest";
import {
  archiveHrefs,
  blogPostPath,
  episodePath,
  formatArchiveDate,
} from "./crawlArchive";

describe("crawlable index hrefs", () => {
  it("builds one blog path per published slug, skipping blanks and duplicates", () => {
    const hrefs = archiveHrefs(
      [
        {
          slug: "permission-to-be-a-beginner",
          title: "Permission to Be a Beginner",
        },
        { slug: "  ", title: "blank" },
        { slug: "permission-to-be-a-beginner", title: "duplicate" },
        {
          slug: "colon-health-after-40-diet-inflammation",
          title: "Colon health",
        },
      ],
      "blog"
    );
    expect(hrefs).toEqual([
      "/health-wellness-blog/permission-to-be-a-beginner",
      "/health-wellness-blog/colon-health-after-40-diet-inflammation",
    ]);
  });

  it("builds one episode path per published slug", () => {
    expect(
      archiveHrefs(
        [
          {
            slug: "normal-is-making-you-sick",
            title: "Normal Is Making You Sick",
          },
          {
            slug: "is-60-too-old-to-start-over",
            title: "Is 60 Too Old to Start Over?",
          },
        ],
        "episode"
      )
    ).toEqual([
      episodePath("normal-is-making-you-sick"),
      episodePath("is-60-too-old-to-start-over"),
    ]);
  });

  it("keeps every published post when the old index only had room for nine", () => {
    const published = Array.from({ length: 35 }, (_, i) => ({
      slug: `post-${i + 1}`,
      title: `Post ${i + 1}`,
    }));
    const firstPageOnly = published.slice(0, 9);
    expect(archiveHrefs(firstPageOnly, "blog")).toHaveLength(9);
    expect(archiveHrefs(published, "blog")).toHaveLength(35);
    expect(archiveHrefs(published, "blog")[0]).toBe(blogPostPath("post-1"));
    expect(archiveHrefs(published, "blog")[34]).toBe(blogPostPath("post-35"));
  });

  it("formats dates in UTC", () => {
    expect(formatArchiveDate("2026-11-06T23:30:00.000Z")).toBe(
      "November 6, 2026"
    );
    expect(formatArchiveDate(null)).toBeNull();
    expect(formatArchiveDate("not-a-date")).toBeNull();
  });
});
