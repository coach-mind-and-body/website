import { describe, expect, it } from "vitest";
import { buildNewsletterHtml } from "./newsletterShell";
import {
  METABOLIC_EMAILS,
  METABOLIC_FORM_URL,
  METABOLIC_SHELL,
} from "./metabolicPracticum";

describe("metabolic practicum emails", () => {
  it("renders six standalone notes that get more urgent on Friday", () => {
    expect(METABOLIC_EMAILS.map((e) => e.key)).toEqual([
      "thu-1",
      "thu-2",
      "thu-3",
      "fri-1",
      "fri-2",
      "fri-3",
    ]);
    expect(new Set(METABOLIC_EMAILS.map((e) => e.subject)).size).toBe(6);

    const lengths = METABOLIC_EMAILS.map((e) => e.bodyHtml.length);
    expect(lengths[5]).toBeLessThan(lengths[0]);

    for (const email of METABOLIC_EMAILS) {
      const html = buildNewsletterHtml({
        firstName: "Karen",
        previewText: email.previewText,
        headline: METABOLIC_SHELL.headline,
        greetingTemplate: METABOLIC_SHELL.greetingTemplate,
        signOffClosing: METABOLIC_SHELL.signOffClosing,
        signOffName: METABOLIC_SHELL.signOffName,
        signOffTitle: METABOLIC_SHELL.signOffTitle,
        bodyHtml: email.bodyHtml,
      });
      expect(html).toContain("Hi Karen,");
      expect(html).toContain(METABOLIC_FORM_URL);
      expect(html).toContain("<img ");
      expect(html).toContain("Better Than Perfect,");
      expect(html).toContain("<!--UNSUB_FOOTER-->");
      expect(html).toContain("MIND &amp; BODY RESET");
      expect(html).not.toContain("logo-horizontal");
      expect(html).not.toContain('bgcolor="#5a3e28"');
      expect(html.toLowerCase()).not.toContain("attached questionnaire");
      expect(html.toLowerCase()).not.toContain("send it back");
      if (email.day === "Thursday") {
        expect(html.toLowerCase()).not.toContain("tonight");
      } else {
        expect(html.toLowerCase()).toContain("tonight");
      }
    }
  });
});
