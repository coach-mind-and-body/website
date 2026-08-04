import { describe, expect, it } from "vitest";
import {
  buildNewsletterHtml,
  prepareBodyHtmlForEmail,
} from "./newsletterShell";

describe("newsletterShell", () => {
  it("wraps body with logo, greeting, and unsub marker", () => {
    const html = buildNewsletterHtml({
      firstName: "Sarah",
      headline: "This week’s tip",
      bodyHtml: "<p>Stay consistent.</p>",
      ctaLabel: "Learn more",
      ctaUrl: "https://mindandbodyresetcoach.com/reclaim",
    });
    expect(html).toContain("Hi Sarah");
    expect(html).toContain("This week’s tip");
    expect(html).toContain("Stay consistent.");
    expect(html).toContain("Learn more");
    expect(html).toContain("logo-wide.jpg");
    expect(html).toContain("<!--UNSUB_FOOTER-->");
    expect(html).toContain("Lee Anne");
  });

  it("personalizes {{firstName}} placeholders", () => {
    const html = buildNewsletterHtml({
      firstName: "Mia",
      bodyHtml: "<p>Keep going, {{firstName}}!</p>",
    });
    expect(html).toContain("Keep going, Mia!");
  });

  it("converts YouTube iframes to thumbnail links", () => {
    const out = prepareBodyHtmlForEmail(
      `<div data-youtube-video><iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe></div>`
    );
    expect(out).toContain("youtube.com/watch?v=dQw4w9WgXcQ");
    expect(out).toContain("img.youtube.com/vi/dQw4w9WgXcQ");
    expect(out).not.toContain("<iframe");
  });
});
