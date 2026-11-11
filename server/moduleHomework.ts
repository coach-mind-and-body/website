import { eq } from "drizzle-orm";
import { assignments, programModules } from "../drizzle/schema";
import { parseFields } from "../shared/forms";
import {
  MODULE_HOMEWORK_TITLE,
  homeworkPromptFromHtml,
  planModuleHomeworkAssignments,
  type HomeworkAssignmentRow,
} from "../shared/moduleHomework";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type ModuleRow = { id: number; content: string | null };

/** Insert the missing written-answer tasks. Returns true when a row was added. */
export async function ensureModuleHomeworkAssignments(
  db: Db,
  modules: ModuleRow[],
  existing: HomeworkAssignmentRow[]
): Promise<boolean> {
  const inserts = planModuleHomeworkAssignments(modules, existing);
  if (inserts.length === 0) return false;
  await db.insert(assignments).values(
    inserts.map((row) => ({
      moduleId: row.moduleId,
      question: row.question,
      title: MODULE_HOMEWORK_TITLE,
      order: row.order,
      kind: "fillable" as const,
      publishStatus: "published" as const,
    }))
  );
  return true;
}

/** Keep the saved homework question in step with the lesson after Lee Anne edits it. */
export async function syncHomeworkQuestion(db: Db, moduleId: number, content: string | null | undefined): Promise<void> {
  const prompt = homeworkPromptFromHtml(content);
  if (!prompt) return;
  const rows = await db.select().from(assignments).where(eq(assignments.moduleId, moduleId));
  const homework = rows.find((row) => row.title === MODULE_HOMEWORK_TITLE && row.publishStatus !== "draft");
  if (!homework || homework.question.trim() === prompt) return;
  await db.update(assignments).set({ question: prompt }).where(eq(assignments.id, homework.id));
}

export async function setHomeworkAnswerBox(db: Db, moduleId: number, enabled: boolean): Promise<{ enabled: boolean }> {
  const [mod] = await db.select().from(programModules).where(eq(programModules.id, moduleId)).limit(1);
  if (!mod) {
    throw new Error("That module is gone.");
  }
  const prompt = homeworkPromptFromHtml(mod.content);
  const rows = await db.select().from(assignments).where(eq(assignments.moduleId, moduleId));
  const homework =
    rows.find((row) => row.title === MODULE_HOMEWORK_TITLE) ??
    rows.find((row) => prompt != null && row.question.trim() === prompt);

  if (!enabled) {
    if (homework) {
      await db
        .update(assignments)
        .set({ publishStatus: "draft", title: MODULE_HOMEWORK_TITLE })
        .where(eq(assignments.id, homework.id));
    }
    return { enabled: false };
  }

  if (!prompt) {
    throw new Error("Add a Homework heading that asks the client to write, journal, or reflect, then save the module.");
  }

  if (!homework) {
    const order = rows.reduce((max, row) => Math.max(max, row.order), 0) + 1;
    await db.insert(assignments).values({
      moduleId,
      question: prompt,
      title: MODULE_HOMEWORK_TITLE,
      order,
      kind: "fillable",
      publishStatus: "published",
    });
    return { enabled: true };
  }

  const keepsForm = parseFields(homework.fieldsJson).some((field) => field.type !== "info");
  await db
    .update(assignments)
    .set({
      publishStatus: "published",
      kind: "fillable",
      title: MODULE_HOMEWORK_TITLE,
      question: prompt,
      ...(keepsForm ? {} : { fieldsJson: null }),
    })
    .where(eq(assignments.id, homework.id));
  return { enabled: true };
}
