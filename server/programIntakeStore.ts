import { and, asc, eq } from "drizzle-orm";
import { programIntakeQuestions, programIntakeSubmissions } from "../drizzle/schema";
import type { ProgramId } from "@shared/programs";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type StoredIntakeAnswer = { questionId: number; prompt: string; answer: string };

export async function listProgramQuestions(db: Db, program: ProgramId) {
  return db
    .select({
      id: programIntakeQuestions.id,
      prompt: programIntakeQuestions.prompt,
      sortOrder: programIntakeQuestions.sortOrder,
    })
    .from(programIntakeQuestions)
    .where(eq(programIntakeQuestions.program, program))
    .orderBy(asc(programIntakeQuestions.sortOrder), asc(programIntakeQuestions.id));
}

export async function addProgramQuestion(db: Db, program: ProgramId, prompt: string) {
  const existing = await listProgramQuestions(db, program);
  const sortOrder = existing.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1;
  const inserted = await db
    .insert(programIntakeQuestions)
    .values({ program, prompt, sortOrder })
    .$returningId();
  return { id: inserted[0]?.id ?? 0, prompt, sortOrder };
}

export async function removeProgramQuestion(db: Db, id: number) {
  await db.delete(programIntakeQuestions).where(eq(programIntakeQuestions.id, id));
}

export async function saveProgramIntakeSubmission(
  db: Db,
  input: {
    program: ProgramId;
    name: string;
    email: string;
    phone: string;
    answers: StoredIntakeAnswer[];
  }
): Promise<{ created: boolean }> {
  const answersJson = JSON.stringify(input.answers);
  const [existing] = await db
    .select({ id: programIntakeSubmissions.id })
    .from(programIntakeSubmissions)
    .where(
      and(eq(programIntakeSubmissions.email, input.email), eq(programIntakeSubmissions.program, input.program))
    )
    .limit(1);

  if (existing) {
    await db
      .update(programIntakeSubmissions)
      .set({
        name: input.name,
        phone: input.phone,
        answersJson,
      })
      .where(eq(programIntakeSubmissions.id, existing.id));
    return { created: false };
  }

  await db.insert(programIntakeSubmissions).values({
    program: input.program,
    name: input.name,
    email: input.email,
    phone: input.phone,
    answersJson,
  });
  return { created: true };
}

export async function getProgramIntakeSubmission(db: Db, program: ProgramId, email: string) {
  const [row] = await db
    .select()
    .from(programIntakeSubmissions)
    .where(and(eq(programIntakeSubmissions.email, email), eq(programIntakeSubmissions.program, program)))
    .limit(1);
  if (!row) return null;
  let answers: StoredIntakeAnswer[] = [];
  try {
    const parsed = JSON.parse(row.answersJson || "[]") as StoredIntakeAnswer[];
    if (Array.isArray(parsed)) answers = parsed;
  } catch {
    answers = [];
  }
  return { ...row, answers };
}

export async function snapshotAnswers(
  db: Db,
  program: ProgramId,
  submitted: { questionId: number; answer: string }[] | undefined
): Promise<StoredIntakeAnswer[]> {
  const questions = await listProgramQuestions(db, program);
  const prompts = new Map(questions.map((row) => [row.id, row.prompt]));
  const answers: StoredIntakeAnswer[] = [];
  for (const item of submitted ?? []) {
    const prompt = prompts.get(item.questionId);
    const answer = item.answer.trim();
    if (!prompt || !answer) continue;
    answers.push({ questionId: item.questionId, prompt, answer });
  }
  return answers;
}
