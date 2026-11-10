import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  assignmentSubmissions,
  assignments,
  commonFiles,
  enrollments,
  libraryGroups,
  moduleProgress,
  users,
} from "../../drizzle/schema";
import { storageRead, privateStoragePut } from "../storage";
import { convertibleMime, draftFormFromDocuments } from "../formDraft";
import {
  canReadSubmission,
  canWriteSubmission,
  clientCanSeeForm,
  clientFormStatus,
  fieldsForClient,
  formIsListedForClients,
  formatAnswer,
  missingRequired,
  parseAnswers,
  parseFields,
  parseIdList,
  parseProgramTags,
  sanitizeAnswers,
  summarizeAnswers,
  type FormAnswers,
  type FormField,
  type FormTemplate,
  type ProgramId,
} from "@shared/forms";
import {
  applyGroup,
  applyUngroup,
  cleanTags,
  collapseLibrary,
  libraryItemVisible,
  planGroup,
  type LibraryFile,
  type LibraryGroup,
  type LibraryItem,
} from "@shared/libraryGroups";
import { PROGRAM_IDS } from "@shared/programs";

const programTagSchema = z.array(z.enum(PROGRAM_IDS)).max(PROGRAM_IDS.length);

const answerSchema = z.object({
  text: z.string().optional(),
  number: z.number().nullable().optional(),
  date: z.string().optional(),
  choices: z.array(z.string()).optional(),
  checked: z.boolean().optional(),
  scale: z.number().nullable().optional(),
  table: z.array(z.array(z.string())).optional(),
  photoKey: z.string().nullable().optional(),
});

const fieldInput = z.object({
  id: z.string().optional(),
  type: z.string(),
  label: z.string().optional(),
  help: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  rows: z.array(z.string()).optional(),
  columns: z.array(z.string()).optional(),
  content: z.string().optional(),
  allowExtraRows: z.boolean().optional(),
});

function toLibraryFile(row: typeof commonFiles.$inferSelect): LibraryFile {
  return {
    id: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileUrl: row.fileUrl,
    fileKey: row.fileKey,
    groupId: row.groupId ?? null,
    pageOrder: row.pageOrder ?? 0,
    programTags: parseProgramTags(row.programTags),
  };
}

function toGroup(row: typeof libraryGroups.$inferSelect): LibraryGroup {
  return { id: row.id, title: row.title, programTags: parseProgramTags(row.programTags) };
}

function toTemplate(row: typeof assignments.$inferSelect): FormTemplate {
  return {
    id: row.id,
    title: row.title?.trim() || row.question,
    instructions: row.instructions ?? "",
    kind: row.kind === "handout" ? "handout" : "fillable",
    content: row.content ?? "",
    fields: parseFields(row.fieldsJson),
    programTags: parseProgramTags(row.programTags),
    publishStatus: row.publishStatus === "draft" ? "draft" : "published",
    moduleId: row.moduleId,
    sourceFileIds: parseIdList(row.sourceFileIds),
  };
}

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
  return db;
}

async function enrolledPrograms(userId: number): Promise<ProgramId[]> {
  const db = await dbOrThrow();
  const rows = await db
    .select({ program: enrollments.program, status: enrollments.status })
    .from(enrollments)
    .where(eq(enrollments.userId, userId));
  return rows.filter((row) => row.status === "active" || row.status === "completed").map((row) => row.program);
}

async function unlockedModules(userId: number): Promise<Set<number>> {
  const db = await dbOrThrow();
  const rows = await db.select().from(moduleProgress).where(eq(moduleProgress.userId, userId));
  return new Set(rows.filter((row) => row.unlockedAt).map((row) => row.moduleId));
}

function visibilityFor(
  template: FormTemplate,
  question: string,
  role: string,
  programs: ProgramId[],
  unlocked: Set<number>
) {
  return {
    role,
    publishStatus: template.publishStatus,
    programTags: template.programTags,
    enrolledPrograms: programs,
    moduleId: template.moduleId,
    moduleUnlocked: template.moduleId != null && unlocked.has(template.moduleId),
    listedForClients: formIsListedForClients(template, question),
  };
}

async function loadTemplate(id: number) {
  const db = await dbOrThrow();
  const [row] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
  return { row, template: toTemplate(row) };
}

async function ownSubmission(formId: number, userId: number) {
  const db = await dbOrThrow();
  const rows = await db
    .select()
    .from(assignmentSubmissions)
    .where(and(eq(assignmentSubmissions.assignmentId, formId), eq(assignmentSubmissions.userId, userId)))
    .orderBy(desc(assignmentSubmissions.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

function publicTemplate(template: FormTemplate, question: string) {
  const fields = fieldsForClient(template, question);
  return {
    id: template.id,
    title: template.title,
    instructions: template.instructions,
    kind: template.kind,
    content: template.content,
    fields,
    programTags: template.programTags,
    publishStatus: template.publishStatus,
    moduleId: template.moduleId,
  };
}

function publicSubmission(row: typeof assignmentSubmissions.$inferSelect | null, fields: FormField[]) {
  if (!row) return null;
  const answers = sanitizeAnswers(fields, parseAnswers(row.answersJson), row.userId);
  return {
    id: row.id,
    status: clientFormStatus(row.status),
    answers,
    feedback: row.feedback,
    submittedAt: row.submittedAt ? new Date(row.submittedAt).toISOString() : null,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
  };
}

async function pagesFor(ids: number[]) {
  if (ids.length === 0) return [];
  const db = await dbOrThrow();
  const rows = await db.select().from(commonFiles).where(inArray(commonFiles.id, ids));
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    return [{ id: row.id, fileName: row.fileName, fileUrl: row.fileUrl, mimeType: row.mimeType }];
  });
}

async function libraryState() {
  const db = await dbOrThrow();
  const [fileRows, groupRows] = await Promise.all([
    db.select().from(commonFiles).orderBy(desc(commonFiles.id)),
    db.select().from(libraryGroups).orderBy(desc(libraryGroups.id)),
  ]);
  const files = fileRows.map(toLibraryFile);
  const groups = groupRows.map(toGroup);
  return { files, groups, items: collapseLibrary(files, groups) };
}

function itemPayload(item: LibraryItem) {
  if (item.kind === "file") {
    return {
      id: `file-${item.file.id}`,
      kind: "file" as const,
      refId: item.file.id,
      title: item.file.fileName,
      programTags: item.file.programTags,
      pages: [
        {
          id: item.file.id,
          fileName: item.file.fileName,
          fileUrl: item.file.fileUrl,
          mimeType: item.file.mimeType,
        },
      ],
    };
  }
  return {
    id: `group-${item.group.id}`,
    kind: "group" as const,
    refId: item.group.id,
    title: item.group.title,
    programTags: item.group.programTags,
    pages: item.pages.map((page) => ({
      id: page.id,
      fileName: page.fileName,
      fileUrl: page.fileUrl,
      mimeType: page.mimeType,
    })),
  };
}

export const formsRouter = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    const role = ctx.user.role;
    const programs = role === "admin" ? [] : await enrolledPrograms(ctx.user.id);
    const unlocked = role === "admin" ? new Set<number>() : await unlockedModules(ctx.user.id);
    const rows = await db.select().from(assignments).orderBy(desc(assignments.updatedAt));
    const subs = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.userId, ctx.user.id));
    const byForm = new Map<number, (typeof subs)[number]>();
    for (const sub of subs) {
      const prev = byForm.get(sub.assignmentId);
      if (!prev || new Date(sub.updatedAt).getTime() > new Date(prev.updatedAt).getTime()) {
        byForm.set(sub.assignmentId, sub);
      }
    }
    return rows.flatMap((row) => {
      const template = toTemplate(row);
      const visible = clientCanSeeForm(visibilityFor(template, row.question, role, programs, unlocked));
      if (!visible || !formIsListedForClients(template, row.question)) return [];
      if (role !== "admin" && template.publishStatus !== "published") return [];
      const sub = byForm.get(row.id);
      return [
        {
          id: row.id,
          title: template.title,
          kind: template.kind,
          programTags: template.programTags,
          status: clientFormStatus(sub?.status),
        },
      ];
    });
  }),

  myLibrary: protectedProcedure.query(async ({ ctx }) => {
    const { items } = await libraryState();
    if (ctx.user.role === "admin") return items.map(itemPayload);
    const programs = await enrolledPrograms(ctx.user.id);
    return items.filter((item) => libraryItemVisible(item, programs)).map(itemPayload);
  }),

  getLibraryItem: protectedProcedure
    .input(z.object({ kind: z.enum(["file", "group"]), id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { items } = await libraryState();
      const item = items.find((entry) =>
        input.kind === "group"
          ? entry.kind === "group" && entry.group.id === input.id
          : entry.kind === "file" && entry.file.id === input.id
      );
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Those pages are not in the library." });
      if (ctx.user.role !== "admin") {
        const programs = await enrolledPrograms(ctx.user.id);
        if (!libraryItemVisible(item, programs)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This is not on your program." });
        }
      }
      return itemPayload(item);
    }),

  get: protectedProcedure
    .input(z.object({ formId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { row, template } = await loadTemplate(input.formId);
      const programs = ctx.user.role === "admin" ? [] : await enrolledPrograms(ctx.user.id);
      const unlocked = ctx.user.role === "admin" ? new Set<number>() : await unlockedModules(ctx.user.id);
      const visible = clientCanSeeForm(visibilityFor(template, row.question, ctx.user.role, programs, unlocked));
      if (!visible) throw new TRPCError({ code: "FORBIDDEN", message: "This form is not on your program." });
      const fields = fieldsForClient(template, row.question);
      const submission = await ownSubmission(template.id, ctx.user.id);
      if (submission && !canReadSubmission(ctx.user.role, ctx.user.id, submission.userId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return {
        form: { ...publicTemplate(template, row.question), fields },
        submission: publicSubmission(submission, fields),
        pages: await pagesFor(template.sourceFileIds),
      };
    }),

  saveDraft: protectedProcedure
    .input(z.object({ formId: z.number().int().positive(), answers: z.record(z.string(), answerSchema) }))
    .mutation(async ({ ctx, input }) => {
      return saveAnswers(ctx.user, input.formId, input.answers as FormAnswers, "draft");
    }),

  submit: protectedProcedure
    .input(z.object({ formId: z.number().int().positive(), answers: z.record(z.string(), answerSchema) }))
    .mutation(async ({ ctx, input }) => {
      return saveAnswers(ctx.user, input.formId, input.answers as FormAnswers, "submitted");
    }),

  uploadPhoto: protectedProcedure
    .input(
      z.object({
        formId: z.number().int().positive(),
        fieldId: z.string().min(1).max(80),
        mimeType: z.string().min(1).max(80),
        base64Data: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { row, template } = await loadTemplate(input.formId);
      const programs = ctx.user.role === "admin" ? [] : await enrolledPrograms(ctx.user.id);
      const unlocked = ctx.user.role === "admin" ? new Set<number>() : await unlockedModules(ctx.user.id);
      const existing = await ownSubmission(template.id, ctx.user.id);
      const gate = canWriteSubmission({
        role: ctx.user.role,
        viewerId: ctx.user.id,
        ownerId: ctx.user.id,
        form: visibilityFor(template, row.question, ctx.user.role, programs, unlocked),
        submissionStatus: existing?.status === "draft" || existing?.status === "submitted" || existing?.status === "reviewed" ? existing.status : null,
      });
      if (!gate.ok) throw new TRPCError({ code: "FORBIDDEN", message: gate.reason });
      const mime = input.mimeType.toLowerCase();
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Use a JPG, PNG, or WEBP photo." });
      }
      const buffer = Buffer.from(input.base64Data, "base64");
      if (buffer.length > 8 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Photo must be under 8 MB." });
      }
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const suffix = Math.random().toString(36).slice(2, 10);
      const key = `form-photos/${ctx.user.id}/${Date.now()}-${suffix}.${ext}`;
      await privateStoragePut(key, buffer, mime);
      return { key };
    }),

  adminLibrary: adminProcedure.query(async () => {
    const db = await dbOrThrow();
    const { items } = await libraryState();
    const forms = await db.select().from(assignments);
    return items.map((item) => {
      const pageIds = item.kind === "group" ? item.pages.map((page) => page.id) : [item.file.id];
      const linked = forms
        .filter((form) => {
          const ids = parseIdList(form.sourceFileIds);
          return pageIds.some((id) => ids.includes(id));
        })
        .sort((a, b) => b.id - a.id)[0];
      return {
        ...itemPayload(item),
        linkedFormId: linked?.id ?? null,
        linkedPublishStatus: linked?.publishStatus ?? null,
        convertible: (item.kind === "group" ? item.pages : [item.file]).some((page) =>
          Boolean(convertibleMime(page.mimeType, page.fileName))
        ),
      };
    });
  }),

  adminGroup: adminProcedure
    .input(
      z.object({
        fileIds: z.array(z.number().int().positive()).min(2).max(30),
        title: z.string().min(1).max(500),
        programTags: programTagSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const { files } = await libraryState();
      const plan = planGroup(files, input.fileIds);
      if (!plan.ok) throw new TRPCError({ code: "BAD_REQUEST", message: plan.reason });
      const tags = cleanTags(input.programTags);
      const [inserted] = await db
        .insert(libraryGroups)
        .values({
          title: input.title.trim(),
          programTags: JSON.stringify(tags),
          createdByUserId: ctx.user.id,
        })
        .$returningId();
      const grouped = applyGroup(files, plan.orderedIds, inserted.id);
      for (const file of grouped) {
        if (!plan.orderedIds.includes(file.id)) continue;
        await db
          .update(commonFiles)
          .set({ groupId: inserted.id, pageOrder: file.pageOrder })
          .where(eq(commonFiles.id, file.id));
      }
      const previous = new Set(
        files.filter((file) => plan.orderedIds.includes(file.id) && file.groupId && file.groupId !== inserted.id).map((file) => file.groupId!)
      );
      for (const groupId of previous) {
        const left = grouped.filter((file) => file.groupId === groupId);
        if (left.length === 0) await db.delete(libraryGroups).where(eq(libraryGroups.id, groupId));
      }
      return { groupId: inserted.id };
    }),

  adminUngroup: adminProcedure
    .input(z.object({ groupId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const { files } = await libraryState();
      const next = applyUngroup(files, input.groupId);
      await db
        .update(commonFiles)
        .set({ groupId: null, pageOrder: 0 })
        .where(eq(commonFiles.groupId, input.groupId));
      await db.delete(libraryGroups).where(eq(libraryGroups.id, input.groupId));
      return { fileIds: next.filter((file) => files.find((before) => before.id === file.id && before.groupId === input.groupId)).map((file) => file.id) };
    }),

  adminReorderGroup: adminProcedure
    .input(z.object({ groupId: z.number().int().positive(), fileIds: z.array(z.number().int().positive()).min(1) }))
    .mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const rows = await db.select().from(commonFiles).where(eq(commonFiles.groupId, input.groupId));
      const ids = new Set(rows.map((row) => row.id));
      if (input.fileIds.length !== ids.size || input.fileIds.some((id) => !ids.has(id))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reorder the pages that are already in this group." });
      }
      for (let index = 0; index < input.fileIds.length; index += 1) {
        await db.update(commonFiles).set({ pageOrder: index }).where(eq(commonFiles.id, input.fileIds[index]));
      }
      return { success: true };
    }),

  adminSetTags: adminProcedure
    .input(
      z.object({
        kind: z.enum(["file", "group"]),
        id: z.number().int().positive(),
        programTags: programTagSchema,
      })
    )
    .mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const tags = JSON.stringify(cleanTags(input.programTags));
      if (input.kind === "group") {
        await db.update(libraryGroups).set({ programTags: tags }).where(eq(libraryGroups.id, input.id));
      } else {
        await db.update(commonFiles).set({ programTags: tags }).where(eq(commonFiles.id, input.id));
      }
      return { success: true };
    }),

  adminDraftFromFiles: adminProcedure
    .input(z.object({ fileIds: z.array(z.number().int().positive()).min(1).max(12) }))
    .mutation(async ({ input }) => {
      const db = await dbOrThrow();
      const rows = await db.select().from(commonFiles).where(inArray(commonFiles.id, input.fileIds));
      const byId = new Map(rows.map((row) => [row.id, row]));
      const ordered = input.fileIds.flatMap((id) => {
        const row = byId.get(id);
        return row ? [row] : [];
      });
      if (ordered.length !== input.fileIds.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "A selected page is no longer in the library." });
      }
      const pages = [];
      for (const row of ordered) {
        const mime = convertibleMime(row.mimeType, row.fileName);
        if (!mime) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `"${row.fileName}" needs to be a PDF, PNG, or JPG.` });
        }
        const object = await storageRead(row.fileKey);
        if (!object) throw new TRPCError({ code: "NOT_FOUND", message: `Could not read ${row.fileName}.` });
        if (object.body.length > 10 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${row.fileName} is over 10 MB.` });
        }
        pages.push({ fileName: row.fileName, mimeType: mime, base64: object.body.toString("base64") });
      }
      let draft;
      try {
        draft = await draftFormFromDocuments(pages, ordered[0].fileName.replace(/\.[^.]+$/, ""));
      } catch (error) {
        console.error("[form-draft]", error);
        const message = error instanceof Error ? error.message : "Could not read that worksheet.";
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
      const groupIds = [...new Set(ordered.map((row) => row.groupId).filter((id): id is number => id != null))];
      let tags = cleanTags(ordered.flatMap((row) => parseProgramTags(row.programTags)));
      if (groupIds.length === 1) {
        const [group] = await db.select().from(libraryGroups).where(eq(libraryGroups.id, groupIds[0])).limit(1);
        if (group) tags = parseProgramTags(group.programTags);
      }
      const [inserted] = await db
        .insert(assignments)
        .values({
          moduleId: null,
          question: draft.title,
          title: draft.title,
          order: 0,
          instructions: draft.instructions,
          fieldsJson: JSON.stringify(draft.fields),
          programTags: JSON.stringify(tags),
          publishStatus: "draft",
          kind: draft.kind,
          content: draft.content,
          sourceFileIds: JSON.stringify(ordered.map((row) => row.id)),
        })
        .$returningId();
      return { id: inserted.id, kind: draft.kind, title: draft.title };
    }),

  adminGet: adminProcedure
    .input(z.object({ formId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const { row, template } = await loadTemplate(input.formId);
      return {
        ...publicTemplate(template, row.question),
        fields: template.fields,
        sourceFileIds: template.sourceFileIds,
        pages: await pagesFor(template.sourceFileIds),
      };
    }),

  adminSave: adminProcedure
    .input(
      z.object({
        formId: z.number().int().positive(),
        title: z.string().min(1).max(500),
        instructions: z.string().max(10000),
        kind: z.enum(["fillable", "handout"]),
        content: z.string().max(50000),
        programTags: programTagSchema,
        fields: z.array(fieldInput).max(80),
      })
    )
    .mutation(async ({ input }) => {
      const { template } = await loadTemplate(input.formId);
      const fields = parseFields(input.fields);
      const tags = cleanTags(input.programTags);
      const db = await dbOrThrow();
      await db
        .update(assignments)
        .set({
          title: input.title.trim(),
          question: input.title.trim(),
          instructions: input.instructions.trim(),
          kind: input.kind,
          content: input.content,
          programTags: JSON.stringify(tags),
          fieldsJson: JSON.stringify(fields),
          publishStatus: template.publishStatus,
        })
        .where(eq(assignments.id, input.formId));
      return { id: input.formId };
    }),

  adminPublish: adminProcedure
    .input(z.object({ formId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const { template } = await loadTemplate(input.formId);
      const answerable = template.fields.some((field) => field.type !== "info");
      if (template.kind === "fillable" && !answerable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add a question, or switch this to a readable handout.",
        });
      }
      if (template.kind === "handout" && !template.content.trim() && template.fields.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Add the handout text before publishing." });
      }
      if (template.moduleId == null && template.programTags.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose at least one program so the right clients can see it.",
        });
      }
      const db = await dbOrThrow();
      await db.update(assignments).set({ publishStatus: "published" }).where(eq(assignments.id, input.formId));
      return { id: input.formId, publishStatus: "published" as const };
    }),

  adminSubmissions: adminProcedure
    .input(
      z
        .object({
          formId: z.number().int().positive().optional(),
          userId: z.number().int().positive().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await dbOrThrow();
      const filters = [];
      if (input?.formId) filters.push(eq(assignmentSubmissions.assignmentId, input.formId));
      if (input?.userId) filters.push(eq(assignmentSubmissions.userId, input.userId));
      const selection = db
        .select({
          submission: assignmentSubmissions,
          assignment: assignments,
          user: { id: users.id, name: users.name, email: users.email },
        })
        .from(assignmentSubmissions)
        .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
        .innerJoin(users, eq(assignmentSubmissions.userId, users.id));
      const filtered = filters.length === 0 ? selection : selection.where(and(...filters));
      const rows = await filtered.orderBy(desc(assignmentSubmissions.updatedAt)).limit(200);
      return rows.map((row) => {
        const template = toTemplate(row.assignment);
        const fields = fieldsForClient(template, row.assignment.question);
        const answers = sanitizeAnswers(fields, parseAnswers(row.submission.answersJson), row.submission.userId);
        return {
          submissionId: row.submission.id,
          formId: row.assignment.id,
          formTitle: template.title,
          userId: row.user.id,
          clientName: row.user.name,
          clientEmail: row.user.email,
          status: clientFormStatus(row.submission.status),
          feedback: row.submission.feedback,
          submittedAt: row.submission.submittedAt ? new Date(row.submission.submittedAt).toISOString() : null,
          reviewedAt: row.submission.reviewedAt ? new Date(row.submission.reviewedAt).toISOString() : null,
          legacyAnswer: row.submission.answer,
          answers: fields
            .filter((field) => field.type !== "info")
            .map((field) => ({
              fieldId: field.id,
              label: field.label,
              type: field.type,
              text: formatAnswer(field, answers[field.id]),
              photoKey: field.type === "photo" ? answers[field.id]?.photoKey ?? null : null,
            })),
        };
      });
    }),

  adminMarkReviewed: adminProcedure
    .input(
      z.object({
        submissionId: z.number().int().positive(),
        feedback: z.string().max(20000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const [existing] = await db
        .select()
        .from(assignmentSubmissions)
        .where(eq(assignmentSubmissions.id, input.submissionId))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
      if (!canReadSubmission("admin", ctx.user.id, existing.userId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db
        .update(assignmentSubmissions)
        .set({
          status: "reviewed",
          reviewedAt: new Date(),
          reviewedByUserId: ctx.user.id,
          feedback: input.feedback !== undefined ? input.feedback : existing.feedback,
        })
        .where(eq(assignmentSubmissions.id, input.submissionId));
      return { success: true };
    }),
});

async function saveAnswers(
  user: { id: number; role: string },
  formId: number,
  rawAnswers: FormAnswers,
  mode: "draft" | "submitted"
) {
  const { row, template } = await loadTemplate(formId);
  const programs = user.role === "admin" ? [] : await enrolledPrograms(user.id);
  const unlocked = user.role === "admin" ? new Set<number>() : await unlockedModules(user.id);
  const fields = fieldsForClient(template, row.question);
  const existing = await ownSubmission(formId, user.id);
  const status = existing?.status === "draft" || existing?.status === "submitted" || existing?.status === "reviewed" ? existing.status : null;
  const gate = canWriteSubmission({
    role: user.role,
    viewerId: user.id,
    ownerId: user.id,
    form: visibilityFor(template, row.question, user.role, programs, unlocked),
    submissionStatus: status,
  });
  if (!gate.ok) throw new TRPCError({ code: "FORBIDDEN", message: gate.reason });
  if (template.kind === "handout") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This handout is for reading." });
  }
  const answers = sanitizeAnswers(fields, rawAnswers, user.id);
  if (mode === "submitted") {
    const missing = missingRequired(fields, answers);
    if (missing.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Still needed: ${missing.join(", ")}` });
    }
  }
  const summary = summarizeAnswers(fields, answers);
  const db = await dbOrThrow();
  const nextStatus = mode === "submitted" ? "submitted" : existing?.status === "submitted" ? "submitted" : "draft";
  if (existing) {
    await db
      .update(assignmentSubmissions)
      .set({
        answersJson: JSON.stringify(answers),
        answer: summary || existing.answer,
        status: nextStatus,
        submittedAt: mode === "submitted" ? new Date() : existing.submittedAt,
      })
      .where(eq(assignmentSubmissions.id, existing.id));
    return { id: existing.id, status: clientFormStatus(nextStatus) };
  }
  const [inserted] = await db
    .insert(assignmentSubmissions)
    .values({
      assignmentId: formId,
      userId: user.id,
      answersJson: JSON.stringify(answers),
      answer: summary || null,
      status: mode === "submitted" ? "submitted" : "draft",
      submittedAt: new Date(),
    })
    .$returningId();
  return { id: inserted.id, status: clientFormStatus(mode) };
}
