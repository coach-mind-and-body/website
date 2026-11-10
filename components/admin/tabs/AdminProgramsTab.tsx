"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { isProgramId, PROGRAM_LIST, PROGRAMS, type ProgramId } from "@shared/programs";
import { METABOLIC_INTAKE_ALIAS, programIntakePath, programIntakeUrl } from "@shared/programIntake";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CoachClientView } from "@/components/admin/CoachClientView";

const ink = "oklch(0.20 0.015 50)";
const muted = "oklch(0.52 0.015 50)";
const gold = "oklch(0.72 0.12 75)";
const line = "oklch(0.90 0.015 80)";
const paper = "oklch(1 0 0)";

function formatWhen(value: Date | string | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    timeZone: "America/Denver",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Link copied");
  } catch {
    toast.error("Select the link and copy it.");
  }
}

export function AdminProgramsTab({
  onEnroll,
}: {
  onEnroll: (program: ProgramId) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const programParam = searchParams.get("program");
  const program = programParam && isProgramId(programParam) ? programParam : null;
  const [client, setClient] = useState<{
    userId: number;
    email: string;
    name: string;
    shareHabitsWithCoach: boolean;
  } | null>(null);
  const [draftQuestion, setDraftQuestion] = useState("");

  function openProgram(next: ProgramId | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "programs");
    if (next) params.set("program", next);
    else params.delete("program");
    setClient(null);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!program) {
    return (
      <div>
        <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: ink }}>
          Programs
        </h2>
        <p className="text-sm mb-6 max-w-xl" style={{ color: muted }}>
          Open a program to see who is enrolled. Copy that program&apos;s intake link to text a new client.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {PROGRAM_LIST.map((item) => {
            const url = programIntakeUrl(item.id);
            return (
              <article key={item.id} className="rounded-xl p-5" style={{ background: paper, border: `1px solid ${line}` }}>
                <h3 className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: ink }}>
                  {item.label}
                </h3>
                <p className="text-sm mt-1" style={{ color: muted }}>
                  {item.blurb}
                </p>
                <p className="text-xs mt-3 break-all" style={{ color: "oklch(0.42 0.015 50)" }}>
                  {url}
                </p>
                {item.id === "metabolic" && (
                  <p className="text-xs mt-1" style={{ color: muted }}>
                    Also works: {METABOLIC_INTAKE_ALIAS}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyText(url)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{ background: "oklch(0.96 0.025 50)", color: ink, border: `1px solid ${line}` }}
                  >
                    <Copy size={13} /> Copy intake link
                  </button>
                  <button
                    type="button"
                    onClick={() => openProgram(item.id)}
                    className="rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{ background: gold, color: "white" }}
                  >
                    Open roster
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <ProgramRoster
      program={program}
      onBack={() => openProgram(null)}
      onEnroll={() => onEnroll(program)}
      onOpenClient={setClient}
      client={client}
      onCloseClient={() => setClient(null)}
      draftQuestion={draftQuestion}
      setDraftQuestion={setDraftQuestion}
    />
  );
}

function ProgramRoster({
  program,
  onBack,
  onEnroll,
  onOpenClient,
  client,
  onCloseClient,
  draftQuestion,
  setDraftQuestion,
}: {
  program: ProgramId;
  onBack: () => void;
  onEnroll: () => void;
  onOpenClient: (client: { userId: number; email: string; name: string; shareHabitsWithCoach: boolean }) => void;
  client: { userId: number; email: string; name: string; shareHabitsWithCoach: boolean } | null;
  onCloseClient: () => void;
  draftQuestion: string;
  setDraftQuestion: (value: string) => void;
}) {
  const utils = trpc.useUtils();
  const definition = PROGRAMS[program];
  const url = programIntakeUrl(program);
  const roster = trpc.enrollment.adminProgramRoster.useQuery({ program });
  const questions = trpc.programIntake.adminQuestions.useQuery(
    { program },
    { enabled: program !== "metabolic" }
  );
  const addQuestion = trpc.programIntake.addQuestion.useMutation({
    onSuccess: () => {
      setDraftQuestion("");
      utils.programIntake.adminQuestions.invalidate({ program });
      utils.programIntake.questions.invalidate({ program });
    },
    onError: (error) => toast.error(error.message),
  });
  const removeQuestion = trpc.programIntake.removeQuestion.useMutation({
    onSuccess: () => {
      utils.programIntake.adminQuestions.invalidate({ program });
      utils.programIntake.questions.invalidate({ program });
    },
    onError: (error) => toast.error(error.message),
  });
  const unenroll = trpc.enrollment.adminCancel.useMutation({
    onSuccess: () => {
      toast.success("Removed from this program");
      utils.enrollment.adminProgramRoster.invalidate({ program });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div>
      <button type="button" onClick={onBack} className="text-sm font-semibold mb-3" style={{ color: gold }}>
        All programs
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: ink }}>
            {definition.label}
          </h2>
          <p className="text-sm mt-1 max-w-xl break-all" style={{ color: muted }}>
            {url}
          </p>
          {program === "metabolic" && (
            <p className="text-xs mt-1" style={{ color: muted }}>
              This is the full client intake. The older address {programIntakePath("metabolic")} stays the link to copy.
              {` ${METABOLIC_INTAKE_ALIAS} opens the same form.`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyText(url)}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: paper, color: ink, border: `1px solid ${line}` }}
          >
            <Copy size={15} /> Copy intake link
          </button>
          <button
            type="button"
            onClick={onEnroll}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: gold, color: "white" }}
          >
            <UserPlus size={15} /> Enroll someone
          </button>
        </div>
      </div>

      {program !== "metabolic" && (
        <section className="rounded-xl p-5 mb-6" style={{ background: paper, border: `1px solid ${line}` }}>
          <h3 className="font-bold" style={{ color: ink }}>
            Extra questions
          </h3>
          <p className="text-sm mt-1 mb-4" style={{ color: muted }}>
            Name, email, and phone are always on the form. Add anything else you want to ask for {definition.label}.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-2 mb-4"
            onSubmit={(event) => {
              event.preventDefault();
              const prompt = draftQuestion.trim();
              if (prompt.length < 2) {
                toast.error("Write the question.");
                return;
              }
              addQuestion.mutate({ program, prompt });
            }}
          >
            <input
              value={draftQuestion}
              onChange={(event) => setDraftQuestion(event.target.value)}
              placeholder="Add a question"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: line, color: ink }}
            />
            <button
              type="submit"
              disabled={addQuestion.isPending}
              className="rounded-full px-4 py-2 text-sm font-bold disabled:opacity-70"
              style={{ background: gold, color: "white" }}
            >
              Add question
            </button>
          </form>
          {questions.data && questions.data.length > 0 ? (
            <ul className="space-y-2">
              {questions.data.map((question) => (
                <li key={question.id} className="flex items-start justify-between gap-3 text-sm">
                  <span style={{ color: ink }}>{question.prompt}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion.mutate({ id: question.id })}
                    className="text-xs font-semibold shrink-0"
                    style={{ color: "oklch(0.45 0.12 25)" }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: muted }}>
              No extra questions yet.
            </p>
          )}
        </section>
      )}

      {roster.isLoading ? (
        <p className="text-sm" style={{ color: muted }}>
          Loading clients…
        </p>
      ) : roster.error ? (
        <p className="text-sm" style={{ color: "oklch(0.45 0.14 25)" }}>
          {roster.error.message}
        </p>
      ) : roster.data && roster.data.length > 0 ? (
        <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${line}` }}>
          <table className="w-full text-sm" style={{ background: paper }}>
            <thead>
              <tr style={{ color: muted }}>
                {["Name", "Enrolled", "Last activity", "Assignments", "Forms", "Food this week", "Uploads", ""].map(
                  (heading) => (
                    <th key={heading} className="text-left font-semibold px-3 py-2 whitespace-nowrap">
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {roster.data.map((row) => (
                <tr key={row.enrollmentId} style={{ borderTop: `1px solid ${line}` }}>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenClient({
                          userId: row.userId,
                          email: row.email,
                          name: row.name,
                          shareHabitsWithCoach: row.shareHabitsWithCoach,
                        })
                      }
                      className="text-left"
                    >
                      <span className="font-semibold block" style={{ color: ink }}>
                        {row.name}
                      </span>
                      <span className="text-xs" style={{ color: muted }}>
                        {row.email}
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap" style={{ color: ink }}>
                    {formatWhen(row.enrolledAt)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap" style={{ color: ink }}>
                    {formatWhen(row.lastActivityAt)}
                  </td>
                  <td className="px-3 py-3">{row.assignmentsSubmitted}</td>
                  <td className="px-3 py-3">{row.formsSubmitted}</td>
                  <td className="px-3 py-3">{row.foodLogsThisWeek}</td>
                  <td className="px-3 py-3">{row.uploads}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      disabled={unenroll.isPending}
                      onClick={() => {
                        if (confirm(`Remove ${row.name} from ${definition.label}? Their account stays.`)) {
                          unenroll.mutate({ enrollmentId: row.enrollmentId });
                        }
                      }}
                      className="text-xs font-semibold"
                      style={{ color: "oklch(0.45 0.12 25)" }}
                    >
                      Unenroll
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm" style={{ color: muted }}>
          No one is enrolled in {definition.label} yet.
        </p>
      )}

      <Dialog open={!!client} onOpenChange={(open) => !open && onCloseClient()}>
        <DialogContent
          aria-describedby={undefined}
          className="w-[96vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto"
          style={{ background: "oklch(0.96 0.025 50)" }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Cormorant Garamond', serif" }}>Client</DialogTitle>
          </DialogHeader>
          {client && (
            <CoachClientView
              userId={client.userId}
              email={client.email}
              name={client.name}
              program={program}
              shareHabitsWithCoach={client.shareHabitsWithCoach}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
