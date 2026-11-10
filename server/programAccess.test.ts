import { describe, expect, it } from "vitest";
import { buildAssignmentFeedbackMessage } from "./assignmentFeedback";
import {
  coachMaySeeFoodLogs,
  viewProgramForClient,
  type AccessAssignment,
  type AccessClientFile,
  type AccessEnrollment,
  type AccessLibraryFile,
  type AccessModule,
  type AccessProgress,
  type AccessSubmission,
} from "./programAccess";

const modules: AccessModule[] = [
  { id: 1, program: "reclaim", isPublished: true, order: 1 },
  { id: 2, program: "reclaim", isPublished: true, order: 2 },
  { id: 3, program: "reclaim", isPublished: false, order: 3 },
  { id: 4, program: "fpu", isPublished: true, order: 1 },
  { id: 5, program: "holiday", isPublished: true, order: 1 },
];

const assignments: AccessAssignment[] = [
  { id: 11, moduleId: 1 },
  { id: 12, moduleId: 2 },
  { id: 13, moduleId: 3 },
  { id: 14, moduleId: 4 },
  { id: 15, moduleId: 5 },
];

const progress: AccessProgress[] = [
  { moduleId: 1, unlockedAt: new Date("2026-01-01") },
  { moduleId: 3, unlockedAt: new Date("2026-01-02") },
  { moduleId: 4, unlockedAt: new Date("2026-01-03") },
];

const submissions: AccessSubmission[] = [
  { id: 21, assignmentId: 11 },
  { id: 22, assignmentId: 12 },
  { id: 24, assignmentId: 14 },
];

const clientFiles: AccessClientFile[] = [
  { id: 31, enrollmentId: 100 },
  { id: 32, enrollmentId: 200 },
];

const libraryFiles: AccessLibraryFile[] = [
  { id: 41, programs: ["reclaim"] },
  { id: 42, programs: ["fpu"] },
  { id: 43, programs: ["reclaim", "holiday"] },
  { id: 44, programs: [] },
];

const reclaimOnly: AccessEnrollment[] = [{ id: 100, program: "reclaim", status: "active" }];

describe("per-program content gating", () => {
  it("shows a Reclaim client only published, unlocked Reclaim modules, tasks, and files", () => {
    const view = viewProgramForClient({
      program: "reclaim",
      isAdmin: false,
      enrollments: reclaimOnly,
      modules,
      progress,
      assignments,
      submissions,
      clientFiles,
      libraryFiles,
    });

    expect(view.allowed).toBe(true);
    expect(view.moduleIds).toEqual([1]);
    expect(view.assignmentIds).toEqual([11]);
    expect(view.submissionIds).toEqual([21]);
    expect(view.uploadFileIds).toEqual([31]);
    expect(view.libraryFileIds).toEqual([41, 43]);
  });

  it("hides another program's modules, tasks, uploads, and library files", () => {
    const fpu = viewProgramForClient({
      program: "fpu",
      isAdmin: false,
      enrollments: reclaimOnly,
      modules,
      progress,
      assignments,
      submissions,
      clientFiles,
      libraryFiles,
    });
    const holiday = viewProgramForClient({
      program: "holiday",
      isAdmin: false,
      enrollments: reclaimOnly,
      modules,
      progress,
      assignments,
      submissions,
      clientFiles,
      libraryFiles,
    });

    expect(fpu.allowed).toBe(false);
    expect(fpu.moduleIds).toEqual([]);
    expect(fpu.assignmentIds).toEqual([]);
    expect(fpu.uploadFileIds).toEqual([]);
    expect(fpu.libraryFileIds).toEqual([]);
    expect(holiday.libraryFileIds).toEqual([]);
    expect(holiday.moduleIds).toEqual([]);
  });

  it("opens each program on its own when someone is in both", () => {
    const enrollments: AccessEnrollment[] = [
      { id: 100, program: "reclaim", status: "active" },
      { id: 200, program: "fpu", status: "completed" },
    ];
    const reclaim = viewProgramForClient({
      program: "reclaim",
      isAdmin: false,
      enrollments,
      modules,
      progress,
      assignments,
      submissions,
      clientFiles,
      libraryFiles,
    });
    const fpu = viewProgramForClient({
      program: "fpu",
      isAdmin: false,
      enrollments,
      modules,
      progress,
      assignments,
      submissions,
      clientFiles,
      libraryFiles,
    });

    expect(reclaim.uploadFileIds).toEqual([31]);
    expect(reclaim.libraryFileIds).not.toContain(42);
    expect(fpu.moduleIds).toEqual([4]);
    expect(fpu.assignmentIds).toEqual([14]);
    expect(fpu.uploadFileIds).toEqual([32]);
    expect(fpu.libraryFileIds).toEqual([42]);
    expect(fpu.libraryFileIds).not.toContain(41);
  });

  it("does not treat a pending enrollment as access", () => {
    const view = viewProgramForClient({
      program: "reclaim",
      isAdmin: false,
      enrollments: [{ id: 100, program: "reclaim", status: "pending" }],
      modules,
      progress,
      assignments,
      submissions,
      clientFiles,
      libraryFiles,
    });
    expect(view.allowed).toBe(false);
    expect(view.moduleIds).toEqual([]);
  });
});

describe("library checkbox visibility", () => {
  it("shows a checked library file to every client enrolled in that program", () => {
    const reclaim = viewProgramForClient({
      program: "reclaim",
      isAdmin: false,
      enrollments: reclaimOnly,
      modules,
      progress,
      assignments,
      submissions,
      clientFiles,
      libraryFiles,
    });
    const alsoReclaim = viewProgramForClient({
      program: "reclaim",
      isAdmin: false,
      enrollments: [{ id: 300, program: "reclaim", status: "active" }],
      modules,
      progress,
      assignments,
      submissions,
      clientFiles: [],
      libraryFiles,
    });

    expect(reclaim.libraryFileIds).toContain(41);
    expect(alsoReclaim.libraryFileIds).toContain(41);
    expect(alsoReclaim.libraryFileIds).toContain(43);
  });

  it("keeps an unchecked library file hidden, and a file checked for another program hidden", () => {
    const view = viewProgramForClient({
      program: "reclaim",
      isAdmin: false,
      enrollments: reclaimOnly,
      modules,
      progress,
      assignments,
      submissions,
      clientFiles,
      libraryFiles,
    });
    expect(view.libraryFileIds).not.toContain(44);
    expect(view.libraryFileIds).not.toContain(42);
  });
});

describe("coach food log access", () => {
  it("stays hidden when habits are private and the person is not in a program", () => {
    expect(
      coachMaySeeFoodLogs({ shareHabitsWithCoach: false, enrollmentStatuses: [] })
    ).toEqual({ allowed: false, reason: "hidden" });
    expect(
      coachMaySeeFoodLogs({
        shareHabitsWithCoach: false,
        enrollmentStatuses: ["pending", "cancelled"],
      })
    ).toEqual({ allowed: false, reason: "hidden" });
  });

  it("opens food logs for a program client even when habit sharing is off", () => {
    expect(
      coachMaySeeFoodLogs({ shareHabitsWithCoach: false, enrollmentStatuses: ["active"] })
    ).toEqual({ allowed: true, reason: "enrolled" });
    expect(
      coachMaySeeFoodLogs({ shareHabitsWithCoach: false, enrollmentStatuses: ["completed"] })
    ).toEqual({ allowed: true, reason: "enrolled" });
  });

  it("still opens food logs when the client chose to share habits", () => {
    expect(
      coachMaySeeFoodLogs({ shareHabitsWithCoach: true, enrollmentStatuses: [] })
    ).toEqual({ allowed: true, reason: "shared" });
  });
});

describe("assignment feedback email", () => {
  it("includes the note and does not treat the answer as markup", () => {
    const message = buildAssignmentFeedbackMessage({
      clientName: "Ava",
      programLabel: "FPU class",
      moduleTitle: "Week 1",
      question: "What did you notice?",
      feedback: "Lovely work <script>alert(1)</script>",
    });
    expect(message.subject).toContain("Week 1");
    expect(message.textBody).toContain("Lovely work <script>alert(1)</script>");
    expect(message.htmlBody).toContain("Lovely work &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(message.htmlBody).not.toContain("<script>");
  });
});
