import type { ProgramId } from "@shared/programs";

/** Enrollment rows that should open program content. Pending and cancelled do not. */
export type ContentEnrollmentStatus = "pending" | "active" | "completed" | "cancelled";

export function enrollmentGrantsContent(status: ContentEnrollmentStatus): boolean {
  return status === "active" || status === "completed";
}

export type AccessEnrollment = {
  id: number;
  program: ProgramId;
  status: ContentEnrollmentStatus;
};

export type AccessModule = {
  id: number;
  program: ProgramId;
  isPublished: boolean;
  order: number;
};

export type AccessProgress = {
  moduleId: number;
  unlockedAt: Date | string | null;
};

export type AccessAssignment = {
  id: number;
  moduleId: number;
};

export type AccessSubmission = {
  id: number;
  assignmentId: number;
};

export type AccessClientFile = {
  id: number;
  enrollmentId: number;
};

export type AccessLibraryFile = {
  id: number;
  programs: ProgramId[];
};

export type ProgramAccessView = {
  allowed: boolean;
  enrollmentId: number | null;
  moduleIds: number[];
  assignmentIds: number[];
  submissionIds: number[];
  uploadFileIds: number[];
  libraryFileIds: number[];
};

const emptyView = (): ProgramAccessView => ({
  allowed: false,
  enrollmentId: null,
  moduleIds: [],
  assignmentIds: [],
  submissionIds: [],
  uploadFileIds: [],
  libraryFileIds: [],
});

/**
 * What one client may see inside one program.
 * Published + unlocked modules only, and files that belong to that program.
 * An admin preview sees published modules, and library files checked for the program,
 * but not another person's uploads.
 */
export function viewProgramForClient(input: {
  program: ProgramId;
  isAdmin: boolean;
  enrollments: AccessEnrollment[];
  modules: AccessModule[];
  progress: AccessProgress[];
  assignments: AccessAssignment[];
  submissions: AccessSubmission[];
  clientFiles: AccessClientFile[];
  libraryFiles: AccessLibraryFile[];
}): ProgramAccessView {
  const enrollment =
    input.enrollments.find(
      (row) => row.program === input.program && enrollmentGrantsContent(row.status)
    ) ?? null;
  const allowed = input.isAdmin || enrollment != null;
  if (!allowed) return emptyView();

  const unlocked = new Set(
    input.progress.filter((row) => row.unlockedAt != null).map((row) => row.moduleId)
  );
  const moduleIds = input.modules
    .filter((mod) => mod.program === input.program && mod.isPublished)
    .filter((mod) => input.isAdmin || unlocked.has(mod.id))
    .sort((a, b) => a.order - b.order || a.id - b.id)
    .map((mod) => mod.id);

  const visibleModules = new Set(moduleIds);
  const assignmentIds = input.assignments
    .filter((row) => visibleModules.has(row.moduleId))
    .map((row) => row.id);
  const visibleAssignments = new Set(assignmentIds);

  return {
    allowed: true,
    enrollmentId: enrollment?.id ?? null,
    moduleIds,
    assignmentIds,
    submissionIds: input.submissions
      .filter((row) => visibleAssignments.has(row.assignmentId))
      .map((row) => row.id),
    uploadFileIds: enrollment
      ? input.clientFiles.filter((row) => row.enrollmentId === enrollment.id).map((row) => row.id)
      : [],
    libraryFileIds: input.libraryFiles
      .filter((row) => row.programs.includes(input.program))
      .map((row) => row.id),
  };
}

export type FoodLogAccess = {
  allowed: boolean;
  /** Why the coach can see food logs, or why they stay hidden. */
  reason: "shared" | "enrolled" | "hidden";
};

/**
 * Food logs (calorie_logs, including photos) are visible when the client
 * turned on habit sharing, or when they are in a program.
 * Pending and cancelled enrollments do not open the log.
 */
export function coachMaySeeFoodLogs(input: {
  shareHabitsWithCoach: boolean;
  enrollmentStatuses: ContentEnrollmentStatus[];
}): FoodLogAccess {
  if (input.shareHabitsWithCoach) return { allowed: true, reason: "shared" };
  if (input.enrollmentStatuses.some((status) => enrollmentGrantsContent(status))) {
    return { allowed: true, reason: "enrolled" };
  }
  return { allowed: false, reason: "hidden" };
}
