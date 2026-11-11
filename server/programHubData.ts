import { asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { selectHubForms, type HubFormCard, type HubFormInput } from "@shared/forms";
import { PROGRAMS, PROGRAM_IDS, isProgramId, type ProgramId } from "@shared/programs";
import {
  assignmentSubmissions,
  assignments,
  calorieLogs,
  clientFiles,
  coachingSessions,
  commonFilePrograms,
  commonFiles,
  enrollments,
  moduleProgress,
  programModules,
  users,
} from "../drizzle/schema";
import type { getDb } from "./db";
import { clientModuleSession, nextCoachingSession, type ClientModuleSession, type HubNextSession } from "./coachingSessionHub";
import {
  coachMaySeeFoodLogs,
  enrollmentGrantsContent,
  viewProgramForClient,
  type AccessEnrollment,
  type ContentEnrollmentStatus,
  type FoodLogAccess,
} from "./programAccess";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type HubUser = { id: number; role?: string | null };

function asStatus(value: string): ContentEnrollmentStatus {
  if (value === "pending" || value === "active" || value === "completed" || value === "cancelled") {
    return value;
  }
  return "pending";
}

export async function loadClientHub(db: Db, user: HubUser, options?: { programs?: ProgramId[] }) {
  const isAdmin = user.role === "admin";
  const enrollmentRows = await db.select().from(enrollments).where(eq(enrollments.userId, user.id));
  const accessEnrollments: AccessEnrollment[] = [];
  for (const row of enrollmentRows) {
    if (!isProgramId(row.program)) continue;
    accessEnrollments.push({ id: row.id, program: row.program, status: asStatus(row.status) });
  }
  const granting = accessEnrollments.filter((row) => enrollmentGrantsContent(row.status));

  let programs: ProgramId[];
  if (options?.programs) {
    programs = options.programs.filter(
      (program) => isAdmin || granting.some((row) => row.program === program)
    );
  } else if (granting.length > 0) {
    programs = [...new Set(granting.map((row) => row.program))];
  } else if (isAdmin) {
    programs = [...PROGRAM_IDS];
  } else {
    programs = [];
  }

  if (programs.length === 0) return { programs: [] as ClientProgramBundle[] };

  const [modules, progressRows, assignmentRows, submissionRows, sessionRows] = await Promise.all([
    db.select().from(programModules).orderBy(asc(programModules.order)),
    db.select().from(moduleProgress).where(eq(moduleProgress.userId, user.id)),
    db.select().from(assignments).orderBy(asc(assignments.order)),
    db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.userId, user.id)),
    db.select().from(coachingSessions).where(eq(coachingSessions.userId, user.id)),
  ]);

  const enrollmentIds = accessEnrollments.map((row) => row.id);
  const uploads =
    enrollmentIds.length > 0
      ? await db.select().from(clientFiles).where(inArray(clientFiles.enrollmentId, enrollmentIds))
      : [];

  const libraryRows = await db
    .select({
      id: commonFiles.id,
      fileName: commonFiles.fileName,
      fileUrl: commonFiles.fileUrl,
      fileKey: commonFiles.fileKey,
      mimeType: commonFiles.mimeType,
      createdAt: commonFiles.createdAt,
      program: commonFilePrograms.program,
    })
    .from(commonFiles)
    .innerJoin(commonFilePrograms, eq(commonFilePrograms.commonFileId, commonFiles.id))
    .where(isNull(commonFiles.groupId));

  const tagRows = await db
    .select({
      fileId: commonFilePrograms.commonFileId,
      program: commonFilePrograms.program,
    })
    .from(commonFilePrograms);
  const filePrograms = new Map<number, ProgramId[]>();
  for (const row of tagRows) {
    if (!isProgramId(row.program)) continue;
    const list = filePrograms.get(row.fileId) ?? [];
    if (!list.includes(row.program)) list.push(row.program);
    filePrograms.set(row.fileId, list);
  }

  const libraryById = new Map<
    number,
    {
      id: number;
      fileName: string;
      fileUrl: string;
      fileKey: string;
      mimeType: string | null;
      createdAt: Date;
      programs: ProgramId[];
    }
  >();
  for (const row of libraryRows) {
    if (!isProgramId(row.program)) continue;
    const existing = libraryById.get(row.id);
    if (existing) existing.programs.push(row.program);
    else {
      libraryById.set(row.id, {
        id: row.id,
        fileName: row.fileName,
        fileUrl: row.fileUrl,
        fileKey: row.fileKey,
        mimeType: row.mimeType,
        createdAt: row.createdAt,
        programs: [row.program],
      });
    }
  }
  const libraryFiles = [...libraryById.values()];
  const libraryIdByKey = new Map(libraryFiles.map((file) => [file.fileKey, file.id]));
  const libraryIdByUrl = new Map(libraryFiles.map((file) => [file.fileUrl, file.id]));
  const moduleProgramById = new Map<number, ProgramId>();
  for (const mod of modules) {
    if (isProgramId(mod.program)) moduleProgramById.set(mod.id, mod.program);
  }
  const statusByFormId = new Map<number, { status: string; at: number }>();
  for (const row of submissionRows) {
    const at = row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
    const prev = statusByFormId.get(row.assignmentId);
    if (!prev || at >= prev.at) statusByFormId.set(row.assignmentId, { status: row.status, at });
  }
  const hubFormRows: HubFormInput[] = assignmentRows.map((row) => ({
    id: row.id,
    moduleId: row.moduleId,
    moduleProgram: row.moduleId == null ? null : moduleProgramById.get(row.moduleId) ?? null,
    question: row.question,
    title: row.title,
    instructions: row.instructions,
    fieldsJson: row.fieldsJson,
    programTags: row.programTags,
    publishStatus: row.publishStatus,
    kind: row.kind,
    content: row.content,
    sourceFileIds: row.sourceFileIds,
    order: row.order,
  }));

  const accessModules = modules
    .filter((mod) => isProgramId(mod.program))
    .map((mod) => ({
      id: mod.id,
      program: mod.program,
      isPublished: mod.isPublished,
      order: mod.order,
    }));

  const bundles: ClientProgramBundle[] = [];
  for (const program of programs) {
    const view = viewProgramForClient({
      program,
      isAdmin,
      enrollments: accessEnrollments,
      modules: accessModules,
      progress: progressRows,
      assignments: assignmentRows.flatMap((row) =>
        row.moduleId == null ? [] : [{ id: row.id, moduleId: row.moduleId }]
      ),
      submissions: submissionRows,
      clientFiles: uploads,
      libraryFiles,
    });
    if (!view.allowed) continue;

    const moduleIds = new Set(view.moduleIds);
    const assignmentIds = new Set(view.assignmentIds);
    const submissionIds = new Set(view.submissionIds);
    const uploadIds = new Set(view.uploadFileIds);
    const libraryIds = new Set(view.libraryFileIds);
    const enrollment = enrollmentRows.find((row) => row.id === view.enrollmentId) ?? null;

    const visibleModules = modules
      .filter((mod) => moduleIds.has(mod.id))
      .sort((a, b) => a.order - b.order || a.id - b.id)
      .map((mod) => {
        const progress = progressRows.find((row) => row.moduleId === mod.id) ?? null;
        const sessionRow =
          program === "reclaim" && enrollment
            ? sessionRows.find(
                (row) => row.enrollmentId === enrollment.id && row.sessionNumber === mod.order
              ) ?? null
            : null;
        return {
          ...mod,
          isUnlocked: isAdmin || progress?.unlockedAt != null,
          progress,
          session: sessionRow ? clientModuleSession(sessionRow) : null,
        };
      });

    const seenUrls = new Set<string>();
    const files: HubFile[] = [];
    for (const file of uploads) {
      if (!uploadIds.has(file.id) || seenUrls.has(file.fileUrl)) continue;
      seenUrls.add(file.fileUrl);
      files.push({
        id: file.id,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        mimeType: file.mimeType,
        createdAt: file.createdAt,
        source: "upload",
        uploadedByRole: file.uploadedByRole,
        libraryFileId: libraryIdByKey.get(file.fileKey) ?? libraryIdByUrl.get(file.fileUrl) ?? null,
      });
    }
    for (const file of libraryFiles) {
      if (!libraryIds.has(file.id) || seenUrls.has(file.fileUrl)) continue;
      seenUrls.add(file.fileUrl);
      files.push({
        id: file.id,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        mimeType: file.mimeType,
        createdAt: file.createdAt,
        source: "library",
        uploadedByRole: "library",
        libraryFileId: file.id,
      });
    }

    const forms = selectHubForms({
      program,
      visibleModuleIds: moduleIds,
      rows: hubFormRows,
      filePrograms,
      statusByFormId: new Map([...statusByFormId].map(([id, value]) => [id, value.status])),
    });

    bundles.push({
      program,
      label: PROGRAMS[program].label,
      enrollment,
      modules: visibleModules,
      // The next session's module is often still locked. It unlocks when the
      // session is marked complete, so the card cannot depend on visible modules.
      nextSession: enrollment ? nextCoachingSession(sessionRows, enrollment.id) : null,
      assignments: assignmentRows.filter((row) => assignmentIds.has(row.id)),
      submissions: submissionRows.filter((row) => submissionIds.has(row.id)),
      files,
      forms,
    });
  }

  return { programs: bundles };
}

export type HubFile = {
  id: number;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  createdAt: Date;
  source: "upload" | "library";
  uploadedByRole: "client" | "admin" | "library";
  /** Common-file id when this row is, or was copied from, a library file. Older apps ignore it. */
  libraryFileId: number | null;
};

export type ClientProgramBundle = {
  program: ProgramId;
  label: string;
  enrollment: typeof enrollments.$inferSelect | null;
  modules: Array<
    typeof programModules.$inferSelect & {
      isUnlocked: boolean;
      progress: typeof moduleProgress.$inferSelect | null;
      /** Public session fields only. Missing or null on older responses. */
      session: ClientModuleSession | null;
    }
  >;
  /**
   * Soonest joinable coaching session for this program.
   * Null when there isn't one. Older apps ignore it.
   */
  nextSession: HubNextSession | null;
  assignments: (typeof assignments.$inferSelect)[];
  submissions: (typeof assignmentSubmissions.$inferSelect)[];
  files: HubFile[];
  /** Digitized forms for this program. Missing on older responses; files stay in `files` either way. */
  forms: HubFormCard[];
};

export async function loadCoachClientWorkspace(db: Db, lookup: { userId?: number; email?: string }) {
  let user: typeof users.$inferSelect | undefined;
  if (lookup.userId) {
    const [row] = await db.select().from(users).where(eq(users.id, lookup.userId)).limit(1);
    user = row;
  } else if (lookup.email) {
    const email = lookup.email.trim().toLowerCase();
    const matches = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);
    user = matches[0];
  }
  if (!user) {
    return {
      found: false as const,
      foodLogAccess: { allowed: false, reason: "hidden" } satisfies FoodLogAccess,
    };
  }

  const enrollmentRows = await db.select().from(enrollments).where(eq(enrollments.userId, user.id));
  const foodLogAccess = coachMaySeeFoodLogs({
    shareHabitsWithCoach: user.shareHabitsWithCoach,
    enrollmentStatuses: enrollmentRows.map((row) => asStatus(row.status)),
  });
  const foodLogs = foodLogAccess.allowed
    ? await db
        .select()
        .from(calorieLogs)
        .where(eq(calorieLogs.userId, user.id))
        .orderBy(desc(calorieLogs.createdAt))
        .limit(60)
    : [];

  const progressRows = await db.select().from(moduleProgress).where(eq(moduleProgress.userId, user.id));
  const moduleRows = await db.select().from(programModules).orderBy(asc(programModules.order));
  const enrolledPrograms = new Set(
    enrollmentRows.filter((row) => isProgramId(row.program)).map((row) => row.program)
  );

  const submissionRows = await db
    .select({
      submission: assignmentSubmissions,
      assignment: assignments,
      module: programModules,
    })
    .from(assignmentSubmissions)
    .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
    .innerJoin(programModules, eq(assignments.moduleId, programModules.id))
    .where(eq(assignmentSubmissions.userId, user.id))
    .orderBy(desc(assignmentSubmissions.submittedAt));

  const enrollmentIds = enrollmentRows.map((row) => row.id);
  const uploads =
    enrollmentIds.length > 0
      ? await db.select().from(clientFiles).where(inArray(clientFiles.enrollmentId, enrollmentIds))
      : [];
  const enrollmentProgram = new Map(
    enrollmentRows.filter((row) => isProgramId(row.program)).map((row) => [row.id, row.program])
  );

  return {
    found: true as const,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      shareHabitsWithCoach: user.shareHabitsWithCoach,
    },
    foodLogAccess,
    foodLogs,
    programs: enrollmentRows
      .filter((row) => isProgramId(row.program))
      .map((row) => ({
        enrollmentId: row.id,
        program: row.program,
        label: PROGRAMS[row.program].label,
        status: row.status,
        enrolledAt: row.enrolledAt,
      })),
    modules: moduleRows
      .filter((mod) => isProgramId(mod.program) && enrolledPrograms.has(mod.program))
      .map((mod) => {
        const progress = progressRows.find((row) => row.moduleId === mod.id) ?? null;
        return {
          id: mod.id,
          program: mod.program,
          title: mod.title,
          order: mod.order,
          isPublished: mod.isPublished,
          unlocked: progress?.unlockedAt != null,
        };
      }),
    submissions: submissionRows
      .filter((row) => isProgramId(row.module.program))
      .map((row) => ({
        id: row.submission.id,
        program: row.module.program,
        programLabel: PROGRAMS[row.module.program].label,
        moduleTitle: row.module.title,
        question: row.assignment.question,
        answer: row.submission.answer,
        fileUrl: row.submission.fileUrl,
        feedback: row.submission.feedback,
        submittedAt: row.submission.submittedAt,
      })),
    files: uploads.map((file) => ({
      id: file.id,
      program: enrollmentProgram.get(file.enrollmentId) ?? null,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      mimeType: file.mimeType,
      uploadedByRole: file.uploadedByRole,
      createdAt: file.createdAt,
    })),
  };
}
