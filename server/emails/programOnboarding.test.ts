import { describe, expect, it } from "vitest";
import { BRAND } from "@shared/brand";
import { HOLIDAY_COPY } from "@shared/holidayCoaching";
import {
  HOLIDAY_ONBOARDING_SEQUENCE_ID,
  METABOLIC_ONBOARDING_SEQUENCE_ID,
  PROGRAMS,
} from "@shared/programs";
import { getSequenceConfig } from "../sequences";
import { HOLIDAY_EMAIL_LOGO_URL, USE_HOLIDAY_EMAIL_LOGO } from "./holidayLogo";
import {
  HOLIDAY_ONBOARDING_DAY_OFFSETS,
  HOLIDAY_ONBOARDING_EMAILS,
  HOLIDAY_ONBOARDING_STEPS,
} from "./holidayOnboarding";
import { METABOLIC_EMAILS } from "./metabolicPracticum";
import {
  METABOLIC_ONBOARDING_DAY_OFFSETS,
  METABOLIC_ONBOARDING_EMAILS,
  METABOLIC_ONBOARDING_STEPS,
} from "./metabolicOnboarding";
import {
  APP_STORE_URL,
  PORTAL_URL,
  renderOnboardingLetter,
} from "./onboardingLetter";

const APP_URL = "https://apps.apple.com/app/mind-body-reset/id6809038480";

function rendered(
  emails: ((name: string) => { subject: string; html: string })[]
) {
  return emails.map(build => build("Karen"));
}

describe("metabolic onboarding", () => {
  it("schedules seven notes from day 0 through the wrap-up", () => {
    expect(USE_HOLIDAY_EMAIL_LOGO).toBe(true);
    expect(PROGRAMS.metabolic.sequenceId).toBe(
      METABOLIC_ONBOARDING_SEQUENCE_ID
    );
    expect(METABOLIC_ONBOARDING_DAY_OFFSETS).toEqual([0, 2, 7, 14, 21, 28, 35]);
    expect(METABOLIC_ONBOARDING_STEPS.map(step => step.subject)).toEqual([
      "You're in. Let's start these five weeks",
      "Your food log can start on paper",
      "How was the first week?",
      "This is the middle week",
      "Four weeks in",
      "This is the last week",
      "You did the five weeks",
    ]);

    const config = getSequenceConfig(METABOLIC_ONBOARDING_SEQUENCE_ID);
    expect(config?.type).toBe("absolute_days");
    if (config?.type !== "absolute_days") return;
    expect(config.dayOffsets).toEqual(METABOLIC_ONBOARDING_DAY_OFFSETS);
    expect(config.emails).toHaveLength(METABOLIC_ONBOARDING_EMAILS.length);
    expect(config.emails[0]("Karen").subject).toBe(
      METABOLIC_ONBOARDING_STEPS[0].subject
    );
  });

  it("invites her to the app and the portal, in Lee Anne's voice", () => {
    const notes = rendered(METABOLIC_ONBOARDING_EMAILS);
    expect(notes[0].html).toContain("Hi Karen,");
    expect(notes[0].html).toContain("Keto-Mojo");
    expect(notes[0].html).toContain("Mindy Pelz");
    expect(notes[0].html).toContain("mentor may review");
    expect(notes[0].html.toLowerCase()).toContain("not a promise");
    expect(notes[1].html).toContain("wrote it on paper");
    expect(notes[1].html).toContain("photo of your plate");

    for (const note of notes) {
      expect(note.html).toContain(APP_URL);
      expect(note.html).toContain(APP_STORE_URL);
      expect(APP_STORE_URL).toBe(BRAND.appStoreUrl);
      expect(note.html).toContain(PORTAL_URL);
      expect(note.html).toContain("Continue with Google");
      expect(note.html).toContain("Better Than Perfect,");
      expect(note.html).toContain("<!--UNSUB_FOOTER-->");
      expect(note.html).toContain(HOLIDAY_EMAIL_LOGO_URL);
      expect(note.html).toContain('width="200"');
      expect(note.html).not.toContain("logo-horizontal");
      expect(note.html.toLowerCase()).not.toContain("guaranteed");
      expect(note.html.toLowerCase()).not.toContain("cure");
      expect(note.html.toLowerCase()).not.toContain("lose weight");
    }
  });

  it("does not send the old recruitment notes", () => {
    const config = getSequenceConfig(METABOLIC_ONBOARDING_SEQUENCE_ID);
    const subjects = new Set(
      METABOLIC_ONBOARDING_EMAILS.map(build => build("Karen").subject)
    );
    for (const recruitment of METABOLIC_EMAILS) {
      expect(subjects.has(recruitment.subject)).toBe(false);
    }
    expect(config?.emails).toHaveLength(7);
    expect(METABOLIC_EMAILS).toHaveLength(6);
  });

  it("escapes the first name", () => {
    const html = METABOLIC_ONBOARDING_EMAILS[0]("<b>Eve</b>").html;
    expect(html).toContain("Hi &lt;b&gt;Eve&lt;/b&gt;,");
    expect(html).not.toContain("<b>Eve</b>");
  });
});

describe("holiday onboarding", () => {
  it("schedules a short series from the holiday page copy", () => {
    expect(PROGRAMS.holiday.sequenceId).toBe(HOLIDAY_ONBOARDING_SEQUENCE_ID);
    expect(HOLIDAY_ONBOARDING_DAY_OFFSETS).toEqual([0, 2, 7]);
    expect(HOLIDAY_ONBOARDING_STEPS[0].subject).toBe(HOLIDAY_COPY.headline);

    const config = getSequenceConfig(HOLIDAY_ONBOARDING_SEQUENCE_ID);
    expect(config?.type).toBe("absolute_days");
    if (config?.type !== "absolute_days") return;
    expect(config.dayOffsets).toEqual([0, 2, 7]);
    expect(config.emails).toHaveLength(3);
  });

  it("uses the Christmas logo, the app, and the portal", () => {
    const notes = rendered(HOLIDAY_ONBOARDING_EMAILS);
    expect(notes[0].html).toContain(HOLIDAY_COPY.subhead);
    expect(notes[0].html).toContain(HOLIDAY_COPY.notAPromise);
    expect(notes[1].html).toContain("wrote it on paper");
    expect(notes[2].html).toContain("January");

    for (const note of notes) {
      expect(note.html).toContain("Hi Karen,");
      expect(note.html).toContain(HOLIDAY_EMAIL_LOGO_URL);
      expect(note.html).not.toContain("logo-horizontal");
      expect(note.html).toContain(APP_URL);
      expect(note.html).toContain(PORTAL_URL);
      expect(note.html).toContain("Continue with Google");
      expect(note.html).toContain("<!--UNSUB_FOOTER-->");
      expect(note.html).not.toContain("Keto-Mojo");
      expect(note.html.toLowerCase()).not.toContain("guaranteed");
    }
  });

  it("returns to the regular logo when the January switch is off", () => {
    const html = renderOnboardingLetter({
      firstName: "Karen",
      previewText: "A note",
      bodyHtml: "<p>Hello.</p>",
      holidayLogo: false,
    });
    expect(html).toContain("logo-horizontal");
    expect(html).not.toContain("logo-holiday");
    expect(HOLIDAY_EMAIL_LOGO_URL).toBe(
      "https://mindandbodyresetcoach.com/logo-holiday.jpg"
    );
  });
});
