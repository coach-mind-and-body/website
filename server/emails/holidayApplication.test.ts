import { describe, expect, it } from "vitest";
import {
  HOLIDAY_COPY,
  HOLIDAY_FAQ,
  HOLIDAY_YES_NO,
  applicationFirstName,
  holidayApplicationSchema,
  holidayCoachSubject,
  holidayFlags,
  isHolidayHoneypot,
  type HolidayApplicationInput,
} from "@shared/holidayCoaching";
import { escapeHtml } from "../../lib/htmlEscape";
import { buildHolidayApplicantEmail, buildHolidayCoachEmail } from "./holidayApplication";

function sample(overrides: Partial<HolidayApplicationInput> = {}): HolidayApplicationInput {
  const yes = Object.fromEntries(HOLIDAY_YES_NO.map((question) => [question.key, "yes"])) as Pick<
    HolidayApplicationInput,
    (typeof HOLIDAY_YES_NO)[number]["key"]
  >;
  return {
    fullName: "Karen Smith",
    email: "karen@example.com",
    phone: "(801) 555-1212",
    ...yes,
    whyCoaching: "Holiday meals undo the week for me.",
    hopes: "Steadier energy through December.",
    utmSource: "facebook",
    utmMedium: "paid",
    utmCampaign: "holiday-coaching",
    utmContent: "video-1",
    utmTerm: undefined,
    fbclid: "IwAR123",
    fbp: "fb.1.1.abc",
    fbc: "fb.1.1.IwAR123",
    landingUrl: "https://mindandbodyresetcoach.com/holiday?utm_source=facebook",
    eventSourceUrl: "https://mindandbodyresetcoach.com/holiday?utm_source=facebook",
    eventId: "evt_test_123456",
    companyWebsite: undefined,
    ...overrides,
  };
}

describe("holiday coaching application", () => {
  it("uses the first name in the coach subject and strips line breaks", () => {
    expect(holidayCoachSubject("Karen Smith")).toBe("New holiday coaching application: Karen");
    expect(applicationFirstName("Karen\nBcc: spam@example.com")).toBe("Karen");
    expect(holidayCoachSubject("Maria Lopez")).toBe("New holiday coaching application: Maria");
  });

  it("accepts a full application and rejects a short phone number", () => {
    const parsed = holidayApplicationSchema.safeParse(sample());
    expect(parsed.success).toBe(true);

    const bad = holidayApplicationSchema.safeParse(sample({ phone: "12345" }));
    expect(bad.success).toBe(false);

    const { age18: _age, ...withoutAge } = sample();
    const missing = holidayApplicationSchema.safeParse(withoutAge);
    expect(missing.success).toBe(false);
    if (!missing.success) {
      const ageIssue = missing.error.issues.find((issue) => issue.path[0] === "age18");
      expect(ageIssue?.message).toMatch(/Yes or No/);
    }
  });

  it("emails every answer to Lee Anne and a short note to the applicant", () => {
    const input = sample({ buyKetoMojo: "no" });
    const coach = buildHolidayCoachEmail(input);
    expect(coach.subject).toBe("New holiday coaching application: Karen");
    for (const question of HOLIDAY_YES_NO) {
      expect(coach.html).toContain(escapeHtml(question.label));
      expect(coach.text).toContain(question.label);
    }
    expect(coach.text).toContain("Holiday meals undo the week for me.");
    expect(coach.text).toContain("utm_source: facebook");
    expect(holidayFlags(input).some((flag) => flag.includes("Keto-Mojo"))).toBe(true);
    expect(coach.html).toContain("Flags");

    const applicant = buildHolidayApplicantEmail(input.fullName);
    expect(applicant.text).toContain(HOLIDAY_COPY.applicantThanks);
    expect(applicant.text).toContain("Hi Karen,");
    expect(applicant.html).not.toContain("Keto-Mojo");
  });

  it("does not promise weight loss or a guaranteed result", () => {
    const blob = [
      JSON.stringify(HOLIDAY_COPY),
      JSON.stringify(HOLIDAY_FAQ),
      JSON.stringify(HOLIDAY_YES_NO),
      buildHolidayApplicantEmail("Karen Smith").text,
      buildHolidayCoachEmail(sample()).text,
    ].join("\n");
    expect(blob).not.toMatch(/\b(weight loss|lose weight|guaranteed|guarantee|pounds|lbs)\b/i);
  });

  it("treats a URL in the honeypot as a bot and ignores a blank field", () => {
    expect(isHolidayHoneypot("https://spam.example")).toBe(true);
    expect(isHolidayHoneypot("")).toBe(false);
    expect(isHolidayHoneypot(undefined)).toBe(false);
    expect(isHolidayHoneypot("Karen")).toBe(false);
  });
});
