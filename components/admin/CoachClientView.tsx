"use client";

import AdminClientHabits from "@/components/AdminClientHabits";
import AdminModuleAssignment from "@/components/AdminModuleAssignment";
import { trpc } from "@/lib/trpc";
import type { ProgramId } from "@shared/programs";

/**
 * Per-client screen opened from the program roster.
 * The program-hub coach workspace (AdminClientWorkspace) is the fuller view.
 * This reuses the module and habit panels already on a contact record,
 * plus the short intake answers for this program.
 */
export function CoachClientView({
  userId,
  email,
  name,
  program,
  shareHabitsWithCoach,
}: {
  userId: number;
  email: string;
  name: string;
  program: ProgramId;
  shareHabitsWithCoach: boolean;
}) {
  const submission = trpc.programIntake.adminSubmission.useQuery(
    { program, email },
    { enabled: program !== "metabolic" && !!email }
  );

  return (
    <div className="space-y-8">
      <div>
        <h3
          className="text-2xl"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          {name}
        </h3>
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          {email}
        </p>
      </div>

      {program === "metabolic" ? (
        <p className="text-sm" style={{ color: "oklch(0.42 0.015 50)" }}>
          Their full intake answers are in People, under Intakes.
        </p>
      ) : submission.data?.answers?.length ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "oklch(0.52 0.015 50)" }}>
            Intake answers
          </p>
          <dl className="space-y-3">
            {submission.data.answers.map((answer) => (
              <div key={answer.questionId}>
                <dt className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                  {answer.prompt}
                </dt>
                <dd className="text-sm font-semibold whitespace-pre-wrap" style={{ color: "oklch(0.22 0.015 50)" }}>
                  {answer.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <AdminModuleAssignment userId={userId} />
      {shareHabitsWithCoach ? <AdminClientHabits userId={userId} /> : null}
    </div>
  );
}
