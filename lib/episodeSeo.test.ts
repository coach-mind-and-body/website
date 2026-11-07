import { describe, expect, it } from "vitest";
import {
  PERMISSION_TO_BE_A_BEGINNER_SEO,
  editorialEpisodeDescription,
  editorialEpisodeTitle,
} from "./episodeSeo";
import { episodeShareImage } from "./episodeShareImage";
import { formatEpisodePublicationDate } from "./episodePublicationDate";
import { podcastSitemapUrl } from "./podcastSitemap";
import {
  articlePathForPodcast,
  canonicalBlogPathForPodcast,
} from "./topicPairs";

const BEGINNER_SLUG = "permission-to-be-a-beginner";
const BEGINNER_INSTANT = "2026-11-07T03:20:32.000Z";

describe("permission to be a beginner public metadata", () => {
  it("uses the Podcast: title segment without a brand suffix", () => {
    expect(editorialEpisodeTitle(BEGINNER_SLUG)).toBe(
      "Podcast: Permission to Be a Beginner – Building New Habits After 40"
    );
    expect(PERMISSION_TO_BE_A_BEGINNER_SEO.title.startsWith("Podcast:")).toBe(
      true
    );
    expect(PERMISSION_TO_BE_A_BEGINNER_SEO.title).not.toMatch(
      /Mind and Body Reset/i
    );
    expect(PERMISSION_TO_BE_A_BEGINNER_SEO.title).not.toMatch(
      /Podcast Show Notes/
    );
    expect(editorialEpisodeTitle("normal-is-making-you-sick")).toBeNull();
    expect(canonicalBlogPathForPodcast(BEGINNER_SLUG)).toBeNull();
    expect(articlePathForPodcast(BEGINNER_SLUG)).toBeNull();
  });

  it("replaces the show-notes label with a transcript-backed description", () => {
    const description = editorialEpisodeDescription(BEGINNER_SLUG);
    expect(description).toBe(PERMISSION_TO_BE_A_BEGINNER_SEO.description);
    expect(description?.startsWith("Show notes:")).toBe(false);
    expect(description).toMatch(/expect the wobble/i);
    expect(description).toMatch(/cheer the reps/i);
    expect(description).toMatch(/something small/i);
    expect(description).not.toMatch(
      /weight loss|lose weight|income|unicity|ramsey|guaranteed/i
    );
    expect(description!.length).toBeGreaterThanOrEqual(120);
    expect(description!.length).toBeLessThanOrEqual(160);
    expect(editorialEpisodeDescription("normal-is-making-you-sick")).toBeNull();
  });

  it("points this episode's share image at the existing 1280x720 frame", () => {
    expect(episodeShareImage("mL6fCK4SvwE", "https://i.ytimg.com/vi/mL6fCK4SvwE/hqdefault.jpg")).toEqual({
      url: "https://i.ytimg.com/vi/mL6fCK4SvwE/maxresdefault.jpg",
      width: 1280,
      height: 720,
    });
  });

  it("leaves other episode thumbnails on the stored url", () => {
    const stored = "https://i.ytimg.com/vi/cb3pdFVqyzk/hqdefault.jpg";
    expect(episodeShareImage("cb3pdFVqyzk", stored)).toEqual({ url: stored });
    expect(episodeShareImage("cb3pdFVqyzk", null)).toBeUndefined();
  });

  it("shows the Denver calendar day and does not rewrite the UTC instant", () => {
    expect(formatEpisodePublicationDate(BEGINNER_INSTANT)).toBe(
      "November 6, 2026"
    );
    expect(new Date(BEGINNER_INSTANT).toISOString()).toBe(BEGINNER_INSTANT);
    expect(formatEpisodePublicationDate("2026-10-23T13:00:00.000Z")).toBe(
      "October 23, 2026"
    );
    expect(formatEpisodePublicationDate("2026-04-17T22:28:40.000Z")).toBe(
      "April 17, 2026"
    );
    expect(formatEpisodePublicationDate("2026-03-27T21:50:37.000Z")).toBe(
      "March 27, 2026"
    );
  });

  it("includes the published episode in the sitemap url set", () => {
    const xml = podcastSitemapUrl(
      "https://mindandbodyresetcoach.com",
      {
        slug: BEGINNER_SLUG,
        publishedAt: BEGINNER_INSTANT,
        updatedAt: "2026-11-07T03:20:39.000Z",
      },
      "2026-07-01"
    );
    expect(xml).toContain(
      "<loc>https://mindandbodyresetcoach.com/midlife-health-podcast/permission-to-be-a-beginner</loc>"
    );
    expect(xml).toContain("<lastmod>2026-11-07</lastmod>");
  });
});
