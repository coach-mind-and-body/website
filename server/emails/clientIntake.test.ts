import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  INTAKE,
  MENOPAUSE_OPTIONS,
  clientIntakeAnswerLines,
  clientIntakeSchema,
  clientIntakeShareMessage,
  formatClientIntakeText,
} from "@shared/clientIntake";
import { buildClientIntakeCoachEmail } from "./clientIntake";

const PDF_TEXT = [
  INTAKE.eyebrow,
  INTAKE.title,
  INTAKE.name,
  INTAKE.contact,
  INTAKE.phone,
  INTAKE.email,
  INTAKE.goals,
  INTAKE.health,
  INTAKE.habitsWorse,
  INTAKE.habitsWorseExamples,
  INTAKE.habitsBetter,
  INTAKE.habitsBetterExamples,
  INTAKE.activity,
  INTAKE.activityHint,
  INTAKE.menopause,
  INTAKE.menopauseHint,
  INTAKE.lastCycle,
  INTAKE.allergies,
  ...MENOPAUSE_OPTIONS.map((option) => option.label),
];

function sample(overrides: Record<string, unknown> = {}) {
  return {
    name: "Karen Smith",
    phone: "(801) 555-0148",
    email: "karen@example.com",
    goals: "Quiet the evening cravings and sleep through the night.",
    health1: "Insulin resistance",
    health2: "Poor sleep",
    health3: "Afternoon crashes",
    habitsWorse: "Wine after dinner and staying up late.",
    habitsBetter: "A protein breakfast and a walk after lunch.",
    activity: "Walk 30 minutes most days. Strength training twice a week for 20 minutes.",
    menopause: "perimenopausal",
    lastCycle: "2026-09-12",
    allergies: "None",
    ...overrides,
  };
}

describe("client intake questions", () => {
  it("keeps the paper form wording", () => {
    expect(PDF_TEXT).toEqual([
      "METABOLIC COACHING",
      "Client Intake Form",
      "Name",
      "Best Number and Email to Contact You",
      "BEST PHONE NUMBER",
      "EMAIL",
      "What do you hope to achieve in your sessions with me?",
      "Please list your top three current and/or ongoing health problems in order of priority",
      "What habits make you feel worse?",
      "Examples: drinking alcohol, stress, work",
      "What habits make you feel better?",
      "Examples: eating healthy, movement/exercising, sleeping 8 hours",
      "What is your daily physical activity level?",
      "List the type of activity and the duration.",
      "Are you pre, peri, or postmenopausal?",
      "Postmenopausal means going without a menstrual cycle for at least one year.",
      "If you are pre or perimenopausal, what date did your last cycle start on?",
      "Please list any food allergies you have",
      "Premenopausal",
      "Perimenopausal",
      "Postmenopausal",
    ]);
  });

  it("shows every paper question on the public form", () => {
    const form = readFileSync("components/client-intake/ClientIntakeForm.tsx", "utf8");
    const page = readFileSync("app/client-intake/ClientIntakePage.tsx", "utf8");
    const rendered = `${form}\n${page}`;
    for (const key of Object.keys(INTAKE) as (keyof typeof INTAKE)[]) {
      expect(rendered).toContain(`INTAKE.${key}`);
    }
    for (const option of MENOPAUSE_OPTIONS) {
      expect(form).toContain("option.label");
    }
  });
});

describe("client intake validation", () => {
  it("accepts a complete intake", () => {
    const parsed = clientIntakeSchema.safeParse(sample());
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("karen@example.com");
      expect(parsed.data.lastCycle).toBe("2026-09-12");
    }
  });

  it("requires the cycle date for pre and peri", () => {
    for (const menopause of ["premenopausal", "perimenopausal"] as const) {
      const parsed = clientIntakeSchema.safeParse(sample({ menopause, lastCycle: "" }));
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues.some((issue) => issue.path[0] === "lastCycle")).toBe(true);
      }
    }
  });

  it("allows a blank cycle date after menopause", () => {
    const parsed = clientIntakeSchema.safeParse(sample({ menopause: "postmenopausal", lastCycle: "" }));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.lastCycle).toBeUndefined();
  });

  it("rejects a short phone and a bad email", () => {
    expect(clientIntakeSchema.safeParse(sample({ phone: "555-0148" })).success).toBe(false);
    expect(clientIntakeSchema.safeParse(sample({ email: "not-an-email" })).success).toBe(false);
  });
});

describe("client intake coach email", () => {
  it("includes every answer under the paper question", () => {
    const input = clientIntakeSchema.parse(sample());
    const email = buildClientIntakeCoachEmail(input);
    expect(email.subject).toBe("New client intake: Karen Smith");
    expect(email.text).toContain("What do you hope to achieve in your sessions with me?");
    expect(email.text).toContain("Quiet the evening cravings and sleep through the night.");
    expect(email.text).toContain("1. Insulin resistance");
    expect(email.text).toContain("2. Poor sleep");
    expect(email.text).toContain("3. Afternoon crashes");
    expect(email.text).toContain("Perimenopausal");
    expect(email.text).toContain("September 12, 2026");
    expect(email.text).toContain("Please list any food allergies you have");
    expect(email.text).toContain("None");
    expect(email.html).toContain("Open in the admin portal");
    expect(email.text).toContain("/admin?tab=intakes");
    for (const line of clientIntakeAnswerLines(input)) {
      expect(email.text).toContain(line.label);
    }
  });

  it("marks the cycle date not applicable after menopause", () => {
    const input = clientIntakeSchema.parse(sample({ menopause: "postmenopausal", lastCycle: "" }));
    expect(formatClientIntakeText(input)).toContain("Not applicable");
  });
});

describe("client intake share note", () => {
  it("is a short message with the public link", () => {
    const message = clientIntakeShareMessage("https://mindandbodyresetcoach.com/client-intake");
    expect(message).toContain("https://mindandbodyresetcoach.com/client-intake");
    expect(message.split("\n").filter(Boolean)).toHaveLength(2);
  });
});
