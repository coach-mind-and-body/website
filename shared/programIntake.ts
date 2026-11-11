import { z } from "zod";
import { absoluteUrl } from "./brand";
import { CLIENT_INTAKE_PATH } from "./clientIntake";
import { isProgramId, PROGRAMS, type ProgramId } from "./programs";

/** Existing full form. This is the Metabolic Coaching intake. */
export const METABOLIC_INTAKE_PATH = CLIENT_INTAKE_PATH;

/** Same form, program-shaped address. The old /client-intake URL keeps working. */
export const METABOLIC_INTAKE_ALIAS = "/intake/metabolic-coaching";

/** Short intakes. The program is fixed by the link. */
export const PROGRAM_INTAKE_SLUGS = {
  reclaim: "reclaim",
  fpu: "fpu",
  challenge: "challenge",
  holiday: "holiday",
} as const;

export type ShortProgramId = keyof typeof PROGRAM_INTAKE_SLUGS;

export function isShortProgram(program: ProgramId): program is ShortProgramId {
  return program !== "metabolic";
}

export function programIntakePath(program: ProgramId): string {
  if (program === "metabolic") return METABOLIC_INTAKE_PATH;
  return `/intake/${PROGRAM_INTAKE_SLUGS[program]}`;
}

export function programIntakeUrl(program: ProgramId): string {
  return absoluteUrl(programIntakePath(program));
}

export function programIdFromIntakeSlug(slug: string | null | undefined): ProgramId | null {
  const clean = (slug ?? "").trim().toLowerCase();
  if (!clean) return null;
  if (clean === "metabolic" || clean === "metabolic-coaching") return "metabolic";
  for (const program of Object.keys(PROGRAM_INTAKE_SLUGS) as ShortProgramId[]) {
    if (PROGRAM_INTAKE_SLUGS[program] === clean) return program;
  }
  if (isProgramId(clean)) return clean;
  return null;
}

export function intakeFormKind(slug: string): "metabolic" | "short" | "unknown" {
  const program = programIdFromIntakeSlug(slug);
  if (program === "metabolic") return "metabolic";
  if (program && isShortProgram(program)) return "short";
  return "unknown";
}

const phoneSchema = z
  .string()
  .max(40)
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(7, "Please enter your best phone number.")
      .max(40)
      .refine((value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
      }, "Enter a phone number with at least 10 digits.")
  );

export const programIntakeSchema = z.object({
  /** Program id or intake slug. An unknown value leaves enrollment for Lee Anne. */
  program: z.string().max(80).optional(),
  name: z
    .string()
    .max(200)
    .transform((value) => value.trim())
    .pipe(z.string().min(2, "Please enter your name.").max(200)),
  email: z
    .string()
    .max(320)
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().email("Please enter a valid email address.").max(320)),
  phone: phoneSchema,
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        answer: z.string().max(5000),
      })
    )
    .max(40)
    .optional(),
  companyWebsite: z.string().max(300).optional(),
});

export type ProgramIntakeInput = z.infer<typeof programIntakeSchema>;

export function programIntakeFieldErrors(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function isProgramIntakeHoneypot(value: string | undefined): boolean {
  if (!value) return false;
  return /https?:\/\/|www\./i.test(value);
}

export function shortProgramLabel(program: ShortProgramId): string {
  return PROGRAMS[program].label;
}
