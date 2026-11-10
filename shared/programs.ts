import { REAL_FOOD_RESET_SEQUENCE_ID, REAL_FOOD_RESET_THEME } from "./realFoodReset";

/** Programs Lee Anne can enroll someone in from the admin portal. */
export const PROGRAM_IDS = ["reclaim", "fpu", "challenge", "holiday", "metabolic"] as const;

export type ProgramId = (typeof PROGRAM_IDS)[number];

export type ProgramDefinition = {
  id: ProgramId;
  /** Name shown in the enroll menu. */
  label: string;
  /** One line under the menu, in plain language. */
  blurb: string;
  /** Existing drip in server/sequences.ts, or null when this program has no series. */
  sequenceId: string | null;
  /** Coaching session slots created at enrollment. Only Reclaim does this today. */
  sessionCount: number;
  /** Deposit / paid-in-full questions apply. */
  collectsPayment: boolean;
};

export const PROGRAMS: Record<ProgramId, ProgramDefinition> = {
  reclaim: {
    id: "reclaim",
    label: "R.E.C.L.A.I.M.",
    blurb: "Six coaching sessions, and the R.E.C.L.A.I.M. emails.",
    sequenceId: "reclaim_6_week",
    sessionCount: 6,
    collectsPayment: true,
  },
  fpu: {
    id: "fpu",
    label: "FPU class",
    blurb: "Financial Peace class. Starts those emails. Paid FPU orders stay as they are.",
    sequenceId: "fpu_babystep_1",
    sessionCount: 0,
    collectsPayment: false,
  },
  challenge: {
    id: "challenge",
    label: "Challenge",
    blurb: "Puts them in a challenge. The no-processed-food series starts when that challenge is the one with emails.",
    sequenceId: REAL_FOOD_RESET_SEQUENCE_ID,
    sessionCount: 0,
    collectsPayment: false,
  },
  holiday: {
    id: "holiday",
    label: "Holiday program",
    blurb: "A holiday program. There isn't an email series for this yet.",
    sequenceId: null,
    sessionCount: 0,
    collectsPayment: false,
  },
  metabolic: {
    id: "metabolic",
    label: "Metabolic Coaching",
    blurb: "The 5-week practicum from the holiday page. There isn't an email series for this yet.",
    sequenceId: null,
    sessionCount: 0,
    collectsPayment: false,
  },
};

export const PROGRAM_LIST: ProgramDefinition[] = PROGRAM_IDS.map((id) => PROGRAMS[id]);

export function isProgramId(value: string): value is ProgramId {
  return (PROGRAM_IDS as readonly string[]).includes(value);
}

/**
 * Which existing series to start. Challenge emails are the Real Food Reset
 * series, so a different challenge does not get those notes.
 */
export function sequenceForProgram(
  program: ProgramId,
  challengeThemeTag?: string | null
): string | null {
  if (program === "challenge") {
    if (challengeThemeTag && challengeThemeTag !== REAL_FOOD_RESET_THEME) return null;
    return PROGRAMS.challenge.sequenceId;
  }
  return PROGRAMS[program].sequenceId;
}

export type WelcomeProgramCopy = {
  /** Used in the subject and headline. Reclaim stays "R.E.C.L.A.I.M." */
  subjectName: string;
  /** HTML after "welcome you to ". */
  bodyFragmentHtml: string;
  bodyFragmentText: string;
};

function joinPhrases(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/** One program keeps that program's wording. Several programs are named together. */
export function welcomeCopyForPrograms(programs: ProgramId[]): WelcomeProgramCopy {
  const unique = [...new Set(programs)];
  if (unique.length === 0) return welcomeProgramCopy("reclaim");
  if (unique.length === 1) return welcomeProgramCopy(unique[0]);
  const labels = unique.map((id) => PROGRAMS[id].label);
  return {
    subjectName: joinPhrases(labels),
    bodyFragmentHtml: joinPhrases(labels.map((label) => `<strong>${label}</strong>`)),
    bodyFragmentText: joinPhrases(labels),
  };
}

export function welcomeProgramCopy(program: ProgramId): WelcomeProgramCopy {
  switch (program) {
    case "reclaim":
      return {
        subjectName: "R.E.C.L.A.I.M.",
        bodyFragmentHtml: "the <strong>R.E.C.L.A.I.M. program</strong>",
        bodyFragmentText: "R.E.C.L.A.I.M.",
      };
    case "fpu":
      return {
        subjectName: "Financial Peace University",
        bodyFragmentHtml: "<strong>Financial Peace University</strong>",
        bodyFragmentText: "Financial Peace University",
      };
    case "challenge":
      return {
        subjectName: "the challenge",
        bodyFragmentHtml: "<strong>the challenge</strong>",
        bodyFragmentText: "the challenge",
      };
    case "holiday":
      return {
        subjectName: "the holiday program",
        bodyFragmentHtml: "<strong>the holiday program</strong>",
        bodyFragmentText: "the holiday program",
      };
    case "metabolic":
      return {
        subjectName: "Metabolic Coaching",
        bodyFragmentHtml: "<strong>Metabolic Coaching</strong>",
        bodyFragmentText: "Metabolic Coaching",
      };
  }
}
