import { and, eq } from "drizzle-orm";
import { leads } from "../drizzle/schema";
import type { getDb } from "./db";
import {
  ensureClientAccount,
  enrollInPrograms,
  EnrollmentConflictError,
  normalizeEnrollmentEmail,
  type EnrollmentStore,
  type EnrollDeps,
} from "./programEnrollment";
import type { ProgramId } from "@shared/programs";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export interface IntakeLeadStore {
  flagNeedsProgram(input: { name: string; email: string; phone?: string | null }): Promise<void>;
  clearNeedsProgram(email: string): Promise<void>;
}

export type IntakeEnrollmentResult = {
  userId: number;
  createdUser: boolean;
  enrolled: boolean;
  alreadyEnrolled: boolean;
  needsProgram: boolean;
  welcomeEmailSent: boolean;
  program: ProgramId | null;
};

/**
 * One path for every intake submit.
 * A known program uses enrollInPrograms (the admin Enroll window).
 * An unknown program creates the account and a CRM lead flagged Needs program.
 */
export async function enrollSubmittedIntake(
  store: EnrollmentStore,
  leadStore: IntakeLeadStore,
  input: { email: string; name?: string | null; phone?: string | null; program: ProgramId | null },
  deps: EnrollDeps
): Promise<IntakeEnrollmentResult> {
  if (!input.program) {
    const account = await ensureClientAccount(
      store,
      { email: input.email, name: input.name, phone: input.phone },
      deps
    );
    await leadStore.flagNeedsProgram({
      name: account.clientName,
      email: account.clientEmail,
      phone: input.phone,
    });
    return {
      userId: account.userId,
      createdUser: account.createdUser,
      enrolled: false,
      alreadyEnrolled: false,
      needsProgram: true,
      welcomeEmailSent: false,
      program: null,
    };
  }

  try {
    const result = await enrollInPrograms(
      store,
      {
        email: input.email,
        name: input.name,
        phone: input.phone,
        programs: [input.program],
      },
      deps
    );
    await leadStore.clearNeedsProgram(result.clientEmail);
    const user = await store.findUserByEmail(result.clientEmail);
    return {
      userId: user?.id ?? 0,
      createdUser: result.createdUser,
      enrolled: true,
      alreadyEnrolled: false,
      needsProgram: false,
      welcomeEmailSent: result.welcomeEmailSent,
      program: input.program,
    };
  } catch (err) {
    if (err instanceof EnrollmentConflictError) {
      const email = normalizeEnrollmentEmail(input.email);
      await leadStore.clearNeedsProgram(email);
      const user = await store.findUserByEmail(email);
      return {
        userId: user?.id ?? 0,
        createdUser: false,
        enrolled: true,
        alreadyEnrolled: true,
        needsProgram: false,
        welcomeEmailSent: false,
        program: input.program,
      };
    }
    throw err;
  }
}

export function drizzleIntakeLeadStore(db: Db): IntakeLeadStore {
  return {
    async flagNeedsProgram(input) {
      const email = normalizeEnrollmentEmail(input.email);
      const name = (input.name ?? "").trim() || email;
      const phone = input.phone?.trim() || null;
      const [existing] = await db.select().from(leads).where(eq(leads.email, email)).limit(1);
      if (existing) {
        await db
          .update(leads)
          .set({
            name: name || existing.name,
            phone: existing.phone || phone,
            needsProgram: true,
            notes: existing.notes?.trim()
              ? existing.notes
              : "Submitted an intake without a program.",
          })
          .where(eq(leads.id, existing.id));
        return;
      }
      await db.insert(leads).values({
        name,
        email,
        phone,
        notes: "Submitted an intake without a program.",
        status: "new",
        needsProgram: true,
      });
    },

    async clearNeedsProgram(email) {
      const normalized = normalizeEnrollmentEmail(email);
      await db
        .update(leads)
        .set({ needsProgram: false, status: "enrolled" })
        .where(and(eq(leads.email, normalized), eq(leads.needsProgram, true)));
    },
  };
}
