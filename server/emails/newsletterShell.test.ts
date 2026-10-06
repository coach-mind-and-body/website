import { describe, expect, it } from "vitest";
import {
  buildBroadcastHtml,
  buildNewsletterHtml,
  prepareBodyHtmlForEmail,
  RESEND_FIRST_NAME_TAG,
  RESEND_UNSUBSCRIBE_TAG,
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
    expect(html).toContain("Hi Sarah,");
    expect(html).toContain("This week’s tip");
    expect(html).toContain("Stay consistent.");
    expect(html).toContain("Learn more");
    expect(html).toContain("logo-horizontal.jpg");
    expect(html).toContain("<!--UNSUB_FOOTER-->");
    expect(html).toContain("Lee Anne");
  });

  it("supports custom greeting and sign-off", () => {
    const html = buildNewsletterHtml({
      firstName: "Mia",
      greetingTemplate: "Hey {{firstName}}!",
      signOffClosing: "Hugs,",
      signOffName: "Coach L",
      signOffTitle: "Your coach",
      bodyHtml: "<p>Body</p>",
    });
    expect(html).toContain("Hey Mia!");
    expect(html).toContain("Hugs,");
    expect(html).toContain("Coach L");
    expect(html).toContain("Your coach");
  });

  it("personalizes {{firstName}} placeholders", () => {
    const html = buildNewsletterHtml({
      firstName: "Mia",
      bodyHtml: "<p>Keep going, {{firstName}}!</p>",
    });
    expect(html).toContain("Keep going, Mia!");
  });

  it("leaves Resend merge tags in a broadcast", () => {
    const html = buildBroadcastHtml({
      headline: "{{firstName}}, a note",
      bodyHtml: "<p>Keep going, {{firstName}}.</p>",
      reasonLine: "You're receiving this because you joined our list.",
    });
    expect(html).toContain(`Hi ${RESEND_FIRST_NAME_TAG},`);
    expect(html).toContain(`Keep going, ${RESEND_FIRST_NAME_TAG}.`);
    expect(html).toContain(`${RESEND_FIRST_NAME_TAG}, a note`);
    expect(html).toContain(RESEND_UNSUBSCRIBE_TAG);
    expect(html).not.toContain("<!--UNSUB_FOOTER-->");
  });

  it("personalizes plain-text subjects", async () => {
    const { personalizeNewsletterText } = await import("./newsletterShell");
    expect(personalizeNewsletterText("{{firstName}}, hello", "Sarah")).toBe("Sarah, hello");
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
