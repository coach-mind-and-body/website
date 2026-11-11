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
import { AdminPillNav } from "@/components/admin/AdminPillNav";
import { AdminFpuCoachingTab } from "@/components/admin/tabs/AdminFpuCoachingTab";
import { AdminFpuGroupTab } from "@/components/admin/tabs/AdminFpuGroupTab";
import { AdminRealFoodResetTab } from "@/components/admin/tabs/AdminRealFoodResetTab";
import PageEditorTab from "@/components/PageEditorTab";
import ProgramBuilderTab from "@/components/ProgramBuilderTab";
import {
  normalizeProgramSection,
  PROGRAM_SECTION_LABELS,
  programSectionIds,
  resolvedAdminParams,
  type ProgramSectionId,
} from "@/lib/adminNav";

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
  const params = resolvedAdminParams(searchParams.toString());
  const programParam = params.get("program");
  const program = programParam && isProgramId(programParam) ? programParam : null;
  const section = program ? normalizeProgramSection(program, params.get("section")) : "roster";
  const preview = process.env.NODE_ENV !== "production" && searchParams.get("preview") === "1";
  const [client, setClient] = useState<{
    userId: number;
    email: string;
    name: string;
    shareHabitsWithCoach: boolean;
  } | null>(null);
  const [draftQuestion, setDraftQuestion] = useState("");

  function openProgram(next: ProgramId | null) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", "programs");
    if (next) {
      nextParams.set("program", next);
      nextParams.set("section", "roster");
    } else {
      nextParams.delete("program");
      nextParams.delete("section");
    }
    setClient(null);
    router.push(`${pathname}?${nextParams.toString()}`);
  }

  function openSection(next: ProgramSectionId) {
    if (!program) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", "programs");
    nextParams.set("program", program);
    nextParams.set("section", next);
    router.push(`${pathname}?${nextParams.toString()}`);
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
                    Open
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
      section={section}
      onSection={openSection}
      preview={preview}
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
  section,
  onSection,
  preview,
  onBack,
  onEnroll,
  onOpenClient,
  client,
  onCloseClient,
  draftQuestion,
  setDraftQuestion,
}: {
  program: ProgramId;
  section: ProgramSectionId;
  onSection: (section: ProgramSectionId) => void;
  preview: boolean;
  onBack: () => void;
  onEnroll: () => void;
  onOpenClient: (client: { userId: number; email: string; name: string; shareHabitsWithCoach: boolean }) => void;
  client: { userId: number; email: string; name: string; shareHabitsWithCoach: boolean } | null;
  onCloseClient: () => void;
  draftQuestion: string;
  setDraftQuestion: (value: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const utils = trpc.useUtils();
  const definition = PROGRAMS[program];
  const url = programIntakeUrl(program);
  const roster = trpc.enrollment.adminProgramRoster.useQuery({ program }, { enabled: !preview && section === "roster" });
  const questions = trpc.programIntake.adminQuestions.useQuery(
    { program },
    { enabled: !preview && program !== "metabolic" && section === "settings" }
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
  const rows = section === "roster" ? (preview ? previewRoster(program) : (roster.data ?? [])) : [];

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

      <div className="mb-6">
        <AdminPillNav
          size="sm"
          label={`${definition.label} sections`}
          activeId={section}
          onSelect={(id) => onSection(id as ProgramSectionId)}
          items={programSectionIds(program).map((id) => ({ id, label: PROGRAM_SECTION_LABELS[id] }))}
        />
      </div>

      {section === "signups" && <ProgramSignups program={program} onEnroll={onEnroll} />}
      {section === "content" && <ProgramContent program={program} />}
      {section === "coaching" && program === "fpu" && <AdminFpuCoachingTab />}
      {section === "page" && program === "fpu" && <PageEditorTab />}

      {section === "settings" && program === "metabolic" && (
        <section className="rounded-xl p-5" style={{ background: paper, border: `1px solid ${line}` }}>
          <h3 className="font-bold" style={{ color: ink }}>
            Intake questions
          </h3>
          <p className="text-sm mt-1" style={{ color: muted }}>
            Metabolic Coaching uses the full client intake. Read answers, or fill one out, from People.
          </p>
          <button
            type="button"
            onClick={() => router.push(`${pathname}?tab=people&source=intakes&screen=intakes`)}
            className="mt-4 rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: gold, color: "white" }}
          >
            Open intakes
          </button>
        </section>
      )}

      {section === "settings" && program !== "metabolic" && (
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

      {section === "roster" && rows.length > 0 ? (
        <RosterTable
          rows={rows}
          definitionLabel={definition.label}
          unenrollPending={unenroll.isPending}
          onOpenClient={onOpenClient}
          onUnenroll={(row) => unenroll.mutate({ enrollmentId: row.enrollmentId })}
        />
      ) : section === "roster" && !preview && roster.isLoading ? (
        <p className="text-sm" style={{ color: muted }}>
          Loading clients…
        </p>
      ) : section === "roster" && roster.error ? (
        <p className="text-sm" style={{ color: "oklch(0.45 0.14 25)" }}>
          {roster.error.message}
        </p>
      ) : section === "roster" ? (
        <p className="text-sm" style={{ color: muted }}>
          No one is enrolled in {definition.label} yet.
        </p>
      ) : null}

      {section === "roster" && (
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
      )}
    </div>
  );
}

type RosterRow = {
  enrollmentId: number;
  userId: number;
  name: string;
  email: string;
  shareHabitsWithCoach: boolean;
  enrolledAt: Date | string;
  lastActivityAt: Date | string | null;
  assignmentsSubmitted: number;
  formsSubmitted: number;
  foodLogsThisWeek: number;
  uploads: number;
};

function previewRoster(program: ProgramId): RosterRow[] {
  const samples: Record<ProgramId, RosterRow> = {
    reclaim: sample("Ava Collins", "ava@example.com"),
    fpu: sample("Elena Park", "elena@example.com"),
    challenge: sample("Gina Moss", "gina@example.com"),
    holiday: sample("Holly Grant", "holly@example.com"),
    metabolic: sample("Camila Ortiz", "camila@example.com"),
  };
  return [samples[program]];
}

function sample(name: string, email: string): RosterRow {
  return {
    enrollmentId: 1,
    userId: 1,
    name,
    email,
    shareHabitsWithCoach: true,
    enrolledAt: new Date("2026-10-02T18:00:00Z"),
    lastActivityAt: new Date("2026-11-08T18:00:00Z"),
    assignmentsSubmitted: 2,
    formsSubmitted: 1,
    foodLogsThisWeek: 4,
    uploads: 1,
  };
}

function RosterTable({
  rows,
  definitionLabel,
  unenrollPending,
  onOpenClient,
  onUnenroll,
}: {
  rows: RosterRow[];
  definitionLabel: string;
  unenrollPending: boolean;
  onOpenClient: (client: { userId: number; email: string; name: string; shareHabitsWithCoach: boolean }) => void;
  onUnenroll: (row: RosterRow) => void;
}) {
  return (
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
          {rows.map((row) => (
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
                  disabled={unenrollPending}
                  onClick={() => {
                    if (confirm(`Remove ${row.name} from ${definitionLabel}? Their account stays.`)) {
                      onUnenroll(row);
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
  );
}

function ProgramSignups({ program, onEnroll }: { program: ProgramId; onEnroll: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  if (program === "fpu") return <AdminFpuGroupTab />;
  if (program === "challenge") return <AdminRealFoodResetTab />;
  const peopleSource = program === "metabolic" ? "intakes" : "contacts";
  return (
    <section className="rounded-xl p-5" style={{ background: paper, border: `1px solid ${line}` }}>
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: ink }}>
        Sign-ups
      </h3>
      <p className="text-sm mt-2 max-w-xl" style={{ color: muted }}>
        {PROGRAMS[program].label} does not have its own sign-up list. New people land in People, and you can enroll
        them from here.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEnroll}
          className="rounded-full px-4 py-2 text-sm font-bold"
          style={{ background: gold, color: "white" }}
        >
          Enroll someone
        </button>
        <button
          type="button"
          onClick={() => router.push(`${pathname}?tab=people&source=${peopleSource}`)}
          className="rounded-full px-4 py-2 text-sm font-bold"
          style={{ background: paper, color: ink, border: `1px solid ${line}` }}
        >
          Open People
        </button>
      </div>
    </section>
  );
}

function ProgramContent({ program }: { program: ProgramId }) {
  return <ProgramBuilderTab program={program} />;
}
