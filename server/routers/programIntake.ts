import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PROGRAMS, isProgramId, type ProgramId } from "@shared/programs";
import {
  isProgramIntakeHoneypot,
  programIdFromIntakeSlug,
  programIntakeSchema,
} from "@shared/programIntake";
import { CLIENT_INTAKE_COACH_EMAIL } from "@shared/clientIntake";
import { escapeHtml } from "../../lib/htmlEscape";
import { getClientIp, rateLimit } from "../../lib/rateLimit";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { drizzleEnrollmentStore } from "../enrollmentStore";
import { drizzleIntakeLeadStore, enrollSubmittedIntake } from "../intakeEnrollment";
import { sendTransactionalEmail, sendWelcomeAndSetPasswordEmail } from "../notifications";
import { notifyAdminsOfIntake } from "../notificationPush";
import {
  addProgramQuestion,
  getProgramIntakeSubmission,
  listProgramQuestions,
  removeProgramQuestion,
  saveProgramIntakeSubmission,
  snapshotAnswers,
} from "../programIntakeStore";
import { enrollUserInSequence } from "../sequences";

const enrollDeps = {
  sendWelcome: sendWelcomeAndSetPasswordEmail,
  startSequence: enrollUserInSequence,
};

function resolveProgram(value: string | undefined): ProgramId | null {
  if (!value) return null;
  if (isProgramId(value)) return value;
  return programIdFromIntakeSlug(value);
}

export const programIntakeRouter = router({
  questions: publicProcedure
    .input(z.object({ program: z.string().max(80) }))
    .query(async ({ input }) => {
      const program = resolveProgram(input.program);
      if (!program || program === "metabolic") return [];
      const db = await getDb();
      if (!db) return [];
      return listProgramQuestions(db, program);
    }),

  submit: publicProcedure.input(programIntakeSchema).mutation(async ({ input, ctx }) => {
    const ip = getClientIp(ctx.req);
    const limit = rateLimit(`program-intake:${ip}`, 8, 60 * 60 * 1000);
    if (!limit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many intakes from this connection. Please wait an hour and try again.",
      });
    }
    if (isProgramIntakeHoneypot(input.companyWebsite)) {
      return { success: true as const, stored: false, needsProgram: false };
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "We couldn't save this. Please try again in a moment.",
      });
    }

    const program = resolveProgram(input.program);
    const outcome = await enrollSubmittedIntake(
      drizzleEnrollmentStore(db),
      drizzleIntakeLeadStore(db),
      { email: input.email, name: input.name, phone: input.phone, program },
      enrollDeps
    );

    if (!program) {
      return { success: true as const, stored: true, needsProgram: true, enrolled: false };
    }

    const answers = await snapshotAnswers(db, program, input.answers);
    const saved = await saveProgramIntakeSubmission(db, {
      program,
      name: input.name,
      email: input.email,
      phone: input.phone,
      answers,
    });

    if (saved.created) {
      const answerText = answers.map((row) => `${row.prompt}\n${row.answer}`).join("\n\n");
      const label = PROGRAMS[program].label;
      try {
        await sendTransactionalEmail({
          to: CLIENT_INTAKE_COACH_EMAIL,
          toName: "Lee Anne",
          subject: `${label} intake: ${input.name}`,
          replyTo: input.email,
          textBody: `${input.name}\n${input.email}\n${input.phone}\nProgram: ${label}\n\n${answerText}`.trim(),
          htmlBody: `
            <div style="font-family:Arial,sans-serif;max-width:560px">
              <p><strong>${escapeHtml(input.name)}</strong> filled out the ${escapeHtml(label)} intake.</p>
              <p>Email: <a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a><br/>Phone: ${escapeHtml(input.phone)}</p>
              ${answers
                .map(
                  (row) =>
                    `<p style="margin:16px 0 0"><span style="color:#666">${escapeHtml(row.prompt)}</span><br/><strong>${escapeHtml(row.answer)}</strong></p>`
                )
                .join("")}
              <p style="color:#666;font-size:13px">${outcome.alreadyEnrolled ? "They were already enrolled." : "They're enrolled."}</p>
            </div>`,
        });
      } catch (err) {
        console.error("[Program intake] Coach email failed", err);
      }
      void notifyAdminsOfIntake({ name: input.name });
    }

    return {
      success: true as const,
      stored: true,
      needsProgram: false,
      enrolled: true,
      alreadyEnrolled: outcome.alreadyEnrolled,
    };
  }),

  adminQuestions: adminProcedure
    .input(z.object({ program: z.enum(["reclaim", "fpu", "challenge", "holiday", "metabolic"]) }))
    .query(async ({ input }) => {
      if (input.program === "metabolic") return [];
      const db = await getDb();
      if (!db) return [];
      return listProgramQuestions(db, input.program);
    }),

  addQuestion: adminProcedure
    .input(
      z.object({
        program: z.enum(["reclaim", "fpu", "challenge", "holiday"]),
        prompt: z.string().trim().min(2, "Write the question.").max(500),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const created = await addProgramQuestion(db, input.program, input.prompt);
      return { success: true as const, question: created };
    }),

  removeQuestion: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await removeProgramQuestion(db, input.id);
      return { success: true as const };
    }),

  adminSubmission: adminProcedure
    .input(
      z.object({
        program: z.enum(["reclaim", "fpu", "challenge", "holiday", "metabolic"]),
        email: z.string().email(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      return getProgramIntakeSubmission(db, input.program, input.email.trim().toLowerCase());
    }),
});
