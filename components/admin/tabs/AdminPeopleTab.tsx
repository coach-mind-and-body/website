"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatPhoneDisplay } from "@/lib/phone";
import { PROGRAM_LIST, type ProgramId } from "@shared/programs";
import {
  clientIntakeAnswerLines,
  formatClientIntakeText,
  type ClientIntakeAnswers,
  type MenopauseStatus,
} from "@shared/clientIntake";
import { filterPeople, mergePeople, type MergePeopleInput, type MergedPerson } from "@/lib/mergePeople";
import { peopleProgram, peopleScreen, peopleSource, resolvedAdminParams } from "@/lib/adminNav";
import { AdminPillNav } from "@/components/admin/AdminPillNav";
import { AdminContactsTab } from "@/components/admin/AdminContactsTab";
import { AdminApplicantsTab } from "@/components/admin/tabs/AdminApplicantsTab";
import { AdminClientIntakeTab } from "@/components/admin/tabs/AdminClientIntakeTab";
import { AdminSnackHackTab } from "@/components/admin/tabs/AdminSnackHackTab";
import type { EnrollModalSeed } from "@/components/admin/tabs/AdminManualEnrollModal";

const ink = "oklch(0.20 0.015 50)";
const muted = "oklch(0.52 0.015 50)";
const gold = "oklch(0.72 0.12 75)";
const line = "oklch(0.90 0.015 80)";
const paper = "oklch(1 0 0)";

const SOURCE_LABEL: Record<MergedPerson["sources"][number], string> = {
  contacts: "Contact",
  applicants: "Applicant",
  intakes: "Intake",
  snackhack: "Snack Hack",
};

const PROGRAM_LABEL: Record<string, string> = {
  ...Object.fromEntries(PROGRAM_LIST.map((item) => [item.id, item.label])),
  habit: "Habit Tracker",
};

const DEMO_INPUT: MergePeopleInput = {
  contacts: [
    { email: "ava@example.com", name: "Ava Collins", phone: "4355550101", highestStatus: "reclaim" },
    { email: "fran@example.com", name: "Fran Doyle", highestStatus: "habit-only", hasActiveHabits: true },
    { email: "elena@example.com", name: "Elena Park", phone: "4355550105", highestStatus: "fpu", tags: ["fpu_interest"] },
  ],
  leads: [
    { email: "camila@example.com", name: "Camila Ortiz", phone: "4355550103", needsProgram: true, status: "new" },
  ],
  applicants: [
    {
      id: 4,
      fullName: "Brooke Hale",
      email: "brooke@example.com",
      phone: "4355550102",
      status: "pending",
      whyCoaching: "Evenings are the hard part.",
      hopes: "A calmer week.",
      flags: ["Mood medication"],
    },
  ],
  intakes: [{ id: 9, name: "Camila Ortiz", email: "camila@example.com", phone: "4355550103" }],
  snackHacks: [{ id: 3, email: "dana@example.com", firstName: "Dana" }],
  rosters: [
    { program: "reclaim", email: "ava@example.com", name: "Ava Collins" },
    { program: "fpu", email: "elena@example.com", name: "Elena Park" },
    { program: "challenge", email: "gina@example.com", name: "Gina Moss" },
  ],
};

function showPhone(phone: string | null) {
  if (!phone) return null;
  return formatPhoneDisplay(phone);
}

export function AdminPeopleTab({
  gcalConnected,
  onEnroll,
  preview = false,
}: {
  gcalConnected: boolean;
  onEnroll: (seed: EnrollModalSeed | null, programs?: ProgramId[] | null) => void;
  preview?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = resolvedAdminParams(searchParams.toString());
  const source = peopleSource(params.get("source"));
  const program = peopleProgram(params.get("program"));
  const screen = peopleScreen(params.get("screen"));
  const openEmail = params.get("open");
  const [search, setSearch] = useState("");
  const [openEmailDetails, setOpenEmailDetails] = useState<string | null>(null);

  const contactsPage1 = trpc.leads.unifiedContacts.useQuery(
    { page: 1, pageSize: 100, filter: "all" },
    { enabled: !preview }
  );
  const totalPages = contactsPage1.data?.totalPages ?? 1;
  const contactsPage2 = trpc.leads.unifiedContacts.useQuery(
    { page: 2, pageSize: 100, filter: "all" },
    { enabled: !preview && totalPages >= 2 }
  );
  const contactsPage3 = trpc.leads.unifiedContacts.useQuery(
    { page: 3, pageSize: 100, filter: "all" },
    { enabled: !preview && totalPages >= 3 }
  );
  const contactsPage4 = trpc.leads.unifiedContacts.useQuery(
    { page: 4, pageSize: 100, filter: "all" },
    { enabled: !preview && totalPages >= 4 }
  );
  const leads = trpc.leads.list.useQuery(undefined, { enabled: !preview });
  const applicants = trpc.enrollment.adminListHolidayApplications.useQuery(undefined, { enabled: !preview });
  const intakes = trpc.clientIntake.list.useQuery(undefined, { enabled: !preview });
  const snackHacks = trpc.leadgen.adminListSnackHack.useQuery(undefined, { enabled: !preview });
  const reclaimRoster = trpc.enrollment.adminProgramRoster.useQuery({ program: "reclaim" }, { enabled: !preview });
  const fpuRoster = trpc.enrollment.adminProgramRoster.useQuery({ program: "fpu" }, { enabled: !preview });
  const challengeRoster = trpc.enrollment.adminProgramRoster.useQuery({ program: "challenge" }, { enabled: !preview });
  const holidayRoster = trpc.enrollment.adminProgramRoster.useQuery({ program: "holiday" }, { enabled: !preview });
  const metabolicRoster = trpc.enrollment.adminProgramRoster.useQuery({ program: "metabolic" }, { enabled: !preview });

  const utils = trpc.useUtils();
  const removeIntake = trpc.clientIntake.remove.useMutation({
    onSuccess: () => {
      toast.success("Intake removed");
      utils.clientIntake.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const removeSnack = trpc.leadgen.adminDeleteSnackHack.useMutation({
    onSuccess: () => {
      toast.success("Snack Hack lead removed");
      utils.leadgen.adminListSnackHack.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  function pushPeople(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "people");
    mutate(next);
    router.push(`${pathname}?${next.toString()}`);
  }

  const contactItems = [
    ...(contactsPage1.data?.items ?? []),
    ...(contactsPage2.data?.items ?? []),
    ...(contactsPage3.data?.items ?? []),
    ...(contactsPage4.data?.items ?? []),
  ];
  const rosterRows = [
    ...(reclaimRoster.data ?? []).map((row) => ({ ...row, program: "reclaim" as const })),
    ...(fpuRoster.data ?? []).map((row) => ({ ...row, program: "fpu" as const })),
    ...(challengeRoster.data ?? []).map((row) => ({ ...row, program: "challenge" as const })),
    ...(holidayRoster.data ?? []).map((row) => ({ ...row, program: "holiday" as const })),
    ...(metabolicRoster.data ?? []).map((row) => ({ ...row, program: "metabolic" as const })),
  ];

  const people = filterPeople(
    mergePeople(
      preview
        ? DEMO_INPUT
        : {
            contacts: contactItems,
            leads: leads.data ?? [],
            applicants: applicants.data ?? [],
            intakes: (intakes.data ?? []).map((intake) => ({
              id: intake.id,
              name: intake.name,
              email: intake.email,
              phone: intake.phone,
            })),
            snackHacks: snackHacks.data ?? [],
            rosters: rosterRows,
          }
    ),
    { source, program, search }
  );

  const loading =
    !preview &&
    (contactsPage1.isLoading || leads.isLoading || applicants.isLoading || intakes.isLoading || snackHacks.isLoading);
  const truncated = !preview && totalPages > 4;

  const screenLabel =
    screen === "contacts"
      ? "contact workspace"
      : screen === "applicants"
        ? "applicant list"
        : screen === "intakes"
          ? "intake form"
          : screen === "snackhack"
            ? "Snack Hack list"
            : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: ink }}>
            People
          </h2>
          <p className="text-sm mt-1 max-w-xl" style={{ color: muted }}>
            Contacts, applicants, client intakes, and Snack Hack sign-ups in one list. Filter by where they came from
            or which program they belong to.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEnroll(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full"
          style={{ background: gold, color: "white" }}
        >
          <UserPlus size={16} />
          Enroll someone
        </button>
      </div>

      <div className="space-y-3 mb-5">
        <AdminPillNav
          size="sm"
          label="Source"
          activeId={source}
          onSelect={(id) =>
            pushPeople((next) => {
              next.delete("screen");
              next.delete("open");
              if (id === "all") next.delete("source");
              else next.set("source", id);
            })
          }
          items={[
            { id: "all", label: "All" },
            { id: "contacts", label: "Contacts" },
            { id: "applicants", label: "Applicants" },
            { id: "intakes", label: "Intakes" },
            { id: "snackhack", label: "Snack Hack" },
            { id: "needs", label: "Needs program" },
          ]}
        />
        <AdminPillNav
          size="sm"
          label="Program"
          activeId={program ?? "all"}
          onSelect={(id) =>
            pushPeople((next) => {
              if (id === "all") next.delete("program");
              else next.set("program", id);
            })
          }
          items={[
            { id: "all", label: "All programs" },
            ...PROGRAM_LIST.map((item) => ({ id: item.id, label: item.label })),
            { id: "habit", label: "Habit Tracker" },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email, or phone"
          className="w-full sm:w-72 rounded-full border px-4 py-2 text-sm"
          style={{ background: paper, borderColor: line, color: ink }}
        />
        {screen ? (
          <button
            type="button"
            onClick={() =>
              pushPeople((next) => {
                next.delete("screen");
                next.delete("open");
              })
            }
            className="text-sm font-semibold"
            style={{ color: gold }}
          >
            Back to the combined list
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              pushPeople((next) => {
                const target =
                  source === "applicants" || source === "intakes" || source === "snackhack" ? source : "contacts";
                next.set("screen", target);
              })
            }
            className="text-sm font-semibold"
            style={{ color: gold }}
          >
            Open the full {source === "applicants" ? "applicant" : source === "intakes" ? "intake" : source === "snackhack" ? "Snack Hack" : "contact"} screen
          </button>
        )}
      </div>

      {screen ? (
        <div>
          <p className="text-sm mb-4" style={{ color: muted }}>
            This is the full {screenLabel}. Everything that used to live on its own tab is here.
          </p>
          {screen === "contacts" && (
            <AdminContactsTab gcalConnected={gcalConnected} initialSearch={openEmail ?? ""} />
          )}
          {screen === "applicants" && (
            <AdminApplicantsTab
              onEnroll={(person) =>
                onEnroll(
                  person
                    ? {
                        name: person.name,
                        email: person.email,
                        phone: person.phone,
                        programs: ["metabolic"],
                        applicationId: person.applicationId,
                      }
                    : null,
                  person ? ["metabolic"] : null
                )
              }
            />
          )}
          {screen === "intakes" && <AdminClientIntakeTab />}
          {screen === "snackhack" && <AdminSnackHackTab />}
        </div>
      ) : (
        <div>
          {loading ? (
            <p className="text-sm" style={{ color: muted }}>
              Loading people…
            </p>
          ) : people.length === 0 ? (
            <p className="text-sm" style={{ color: muted }}>
              No one matches this filter.
            </p>
          ) : (
            <div className="space-y-3">
              {people.map((person) => {
                const pendingApplicant = person.applicationStatus === "pending" && person.applicationId != null;
                const detailsOpen = openEmailDetails === person.email;
                const intake = (intakes.data ?? []).find((row) => row.id === person.intakeId);
                return (
                  <article key={person.email} className="rounded-xl p-4" style={{ background: paper, border: `1px solid ${line}` }}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold flex flex-wrap items-center gap-2" style={{ color: ink }}>
                          {person.name}
                          {person.needsProgram && (
                            <span
                              className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "oklch(0.95 0.06 55)", color: "oklch(0.42 0.12 55)" }}
                            >
                              Needs program
                            </span>
                          )}
                        </p>
                        <p className="text-xs mt-1" style={{ color: muted }}>
                          {person.email}
                          {person.phone ? ` · ${showPhone(person.phone)}` : ""}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {person.sources.map((item) => (
                            <span
                              key={item}
                              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.42 0.015 50)" }}
                            >
                              {SOURCE_LABEL[item]}
                            </span>
                          ))}
                          {person.programs.map((item) => (
                            <span
                              key={item}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "oklch(0.93 0.04 75)", color: "oklch(0.40 0.08 55)" }}
                            >
                              {PROGRAM_LABEL[item] ?? item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onEnroll(
                              {
                                name: person.name,
                                email: person.email,
                                phone: person.phone,
                                programs: pendingApplicant ? ["metabolic"] : undefined,
                                applicationId: pendingApplicant ? person.applicationId ?? undefined : undefined,
                              },
                              pendingApplicant ? ["metabolic"] : null
                            )
                          }
                          className="text-xs font-semibold px-3 py-1.5 rounded-full"
                          style={{ background: gold, color: "white" }}
                        >
                          {pendingApplicant ? "Accept" : person.needsProgram ? "Enroll" : "Enroll in program"}
                        </button>
                        {person.sources.includes("contacts") && (
                          <button
                            type="button"
                            onClick={() =>
                              pushPeople((next) => {
                                next.set("source", "contacts");
                                next.set("screen", "contacts");
                                next.set("open", person.email);
                              })
                            }
                            className="text-xs font-semibold px-3 py-1.5 rounded-full"
                            style={{ background: "oklch(0.96 0.025 50)", color: ink, border: `1px solid ${line}` }}
                          >
                            Contact record
                          </button>
                        )}
                        {(person.intakeId || person.applicationWhy || person.snackHackId) && (
                          <button
                            type="button"
                            onClick={() => setOpenEmailDetails(detailsOpen ? null : person.email)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full"
                            style={{ background: "oklch(0.96 0.025 50)", color: ink, border: `1px solid ${line}` }}
                          >
                            {detailsOpen ? "Hide" : "Details"}
                          </button>
                        )}
                      </div>
                    </div>
                    {detailsOpen && (
                      <div className="mt-4 border-t pt-4 space-y-3" style={{ borderColor: line }}>
                        {person.applicationWhy && (
                          <div>
                            <p className="text-xs font-bold uppercase" style={{ color: muted }}>
                              Application
                            </p>
                            <p className="text-sm mt-1" style={{ color: ink }}>
                              {person.applicationWhy}
                            </p>
                            {person.applicationHopes && (
                              <p className="text-sm mt-1" style={{ color: muted }}>
                                Hopes: {person.applicationHopes}
                              </p>
                            )}
                            {person.applicationFlags.map((flag) => (
                              <p key={flag} className="text-xs mt-1" style={{ color: "oklch(0.45 0.12 50)" }}>
                                Worth a look: {flag}
                              </p>
                            ))}
                          </div>
                        )}
                        {intake && (
                          <IntakeAnswers
                            intake={{
                              ...intake,
                              menopause: intake.menopause as MenopauseStatus,
                              phone: formatPhoneDisplay(intake.phone),
                            }}
                          />
                        )}
                        {person.snackHackId != null && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Remove this Snack Hack lead? This cannot be undone.")) {
                                removeSnack.mutate({ id: person.snackHackId! });
                              }
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full"
                            style={{ background: "oklch(0.95 0.06 10)", color: "oklch(0.45 0.12 10)" }}
                          >
                            {removeSnack.isPending ? "Removing..." : "Remove Snack Hack signup"}
                          </button>
                        )}
                        {intake && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove ${person.name}'s intake? This cannot be undone.`)) {
                                removeIntake.mutate({ id: intake.id });
                              }
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full ml-2"
                            style={{ background: "oklch(0.95 0.06 10)", color: "oklch(0.45 0.12 10)" }}
                          >
                            Remove intake
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {truncated && (
            <p className="text-xs mt-4" style={{ color: muted }}>
              The combined list includes the first 400 contacts. Open the contact screen to search the rest.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function IntakeAnswers({ intake }: { intake: ClientIntakeAnswers }) {
  const lines = clientIntakeAnswerLines(intake);
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(formatClientIntakeText(intake)).then(
            () => toast.success("Answers copied"),
            () => toast.error("Couldn't copy the answers.")
          );
        }}
        className="text-xs font-semibold underline mb-3"
        style={{ color: gold }}
      >
        Copy answers
      </button>
      <dl className="space-y-3">
        {lines.map((lineItem) => (
          <div key={lineItem.label}>
            <dt className="text-xs" style={{ color: muted }}>
              {lineItem.label}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold" style={{ color: ink }}>
              {lineItem.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
