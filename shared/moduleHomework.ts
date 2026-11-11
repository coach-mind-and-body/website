/** Lesson homework that asks for a written answer, and the task row that stores it. */

export const MODULE_HOMEWORK_TITLE = "Homework";

const WRITTEN_RE =
  /\b(write|type|typed|typing|journal|reflect|reflection|answer|describe|list|track|letter|explain)\b/i;

export function stripHtml(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ");
  return text.replace(/\s+/g, " ").trim();
}

export type HomeworkSection = {
  prompt: string;
  html: string;
};

/** The Homework heading's body, when it asks the client to write something. */
export function homeworkSection(html: string | null | undefined): HomeworkSection | null {
  if (!html) return null;
  const match = html.match(/<h([1-3])[^>]*>\s*Homework\s*<\/h\1>([\s\S]*?)(?=<h[1-3][^>]*>|$)/i);
  if (!match) return null;
  const prompt = stripHtml(match[2] ?? "").slice(0, 2000);
  if (!prompt || !WRITTEN_RE.test(prompt)) return null;
  return { prompt, html: match[0] };
}

export function homeworkPromptFromHtml(html: string | null | undefined): string | null {
  return homeworkSection(html)?.prompt ?? null;
}

export type SplitHomework = {
  before: string;
  homeworkHtml: string;
  after: string;
  prompt: string | null;
};

/** Pull a written Homework block out of a lesson (or one carousel slide) so an answer box can sit under it. */
export function splitHomeworkSection(html: string): SplitHomework {
  const match = html.match(/<h([1-3])[^>]*>\s*Homework\s*<\/h\1>[\s\S]*?(?=<h[1-3][^>]*>|$)/i);
  if (!match || match.index == null) {
    return { before: html, homeworkHtml: "", after: "", prompt: null };
  }
  const section = homeworkSection(match[0]);
  if (!section) {
    return { before: html, homeworkHtml: "", after: "", prompt: null };
  }
  const start = match.index;
  const end = start + match[0].length;
  return {
    before: html.slice(0, start),
    homeworkHtml: match[0],
    after: html.slice(end),
    prompt: section.prompt,
  };
}

export type HomeworkAssignmentRow = {
  moduleId: number | null;
  title: string | null;
  question: string;
  order: number;
};

export type HomeworkInsert = {
  moduleId: number;
  question: string;
  order: number;
};

/**
 * One published text-answer task per module whose lesson asks for writing.
 * A row titled Homework — including a draft Lee Anne turned off — is left alone.
 */
export function planModuleHomeworkAssignments(
  modules: { id: number; content: string | null }[],
  existing: HomeworkAssignmentRow[]
): HomeworkInsert[] {
  const inserts: HomeworkInsert[] = [];
  for (const mod of modules) {
    const prompt = homeworkPromptFromHtml(mod.content);
    if (!prompt) continue;
    const mine = existing.filter((row) => row.moduleId === mod.id);
    const already = mine.some(
      (row) => row.title === MODULE_HOMEWORK_TITLE || row.question.trim() === prompt
    );
    if (already) continue;
    const order = mine.reduce((max, row) => Math.max(max, row.order), 0) + 1;
    inserts.push({ moduleId: mod.id, question: prompt, order });
  }
  return inserts;
}
