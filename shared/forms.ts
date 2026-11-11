import { isProgramId, type ProgramId } from "./programs";

export type { ProgramId };

export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "number",
  "date",
  "single_choice",
  "multi_choice",
  "checkbox",
  "scale",
  "table",
  "signature",
  "photo",
  "info",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  help: string;
  required: boolean;
  options: string[];
  rows: string[];
  columns: string[];
  content: string;
  allowExtraRows: boolean;
};

export type FormAnswer = {
  text?: string;
  number?: number | null;
  date?: string;
  choices?: string[];
  checked?: boolean;
  scale?: number | null;
  table?: string[][];
  photoKey?: string | null;
};

export type FormAnswers = Record<string, FormAnswer>;

export type FormKind = "fillable" | "handout";
export type PublishStatus = "draft" | "published";
export type SubmissionStatus = "draft" | "submitted" | "reviewed";
export type ClientFormStatus = "not_started" | "draft" | "submitted" | "reviewed";

export type FormTemplate = {
  id: number;
  title: string;
  instructions: string;
  kind: FormKind;
  content: string;
  fields: FormField[];
  programTags: ProgramId[];
  publishStatus: PublishStatus;
  moduleId: number | null;
  sourceFileIds: number[];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function cleanProgramTags(tags: unknown): ProgramId[] {
  if (!Array.isArray(tags)) return [];
  const out: ProgramId[] = [];
  for (const tag of tags) {
    if (typeof tag === "string" && isProgramId(tag) && !out.includes(tag)) out.push(tag);
  }
  return out;
}

export function parseProgramTags(value: unknown): ProgramId[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return cleanProgramTags(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }
  return cleanProgramTags(value);
}

export function parseIdList(value: unknown): number[] {
  let raw = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      raw = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const ids: number[] = [];
  for (const item of raw) {
    const id = typeof item === "number" ? item : Number(item);
    if (Number.isInteger(id) && id > 0 && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

function asStringList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    const text = asString(item, maxLen);
    if (!text || out.includes(text)) continue;
    out.push(text);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function isFieldType(value: string): value is FieldType {
  return (FIELD_TYPES as readonly string[]).includes(value);
}

export function newFieldId(): string {
  return `f-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeField(raw: unknown, index: number): FormField | null {
  const row = asRecord(raw);
  if (!row) return null;
  const typeName = asString(row.type, 40);
  if (!isFieldType(typeName)) return null;
  const label = asString(row.label, 300) || (typeName === "info" ? "Note" : `Question ${index + 1}`);
  const id = asString(row.id, 80).replace(/[^a-zA-Z0-9_-]/g, "") || `f${index + 1}`;
  return {
    id,
    type: typeName,
    label,
    help: asString(row.help, 1000),
    required: row.required === true && typeName !== "info",
    options: typeName === "single_choice" || typeName === "multi_choice" ? asStringList(row.options, 40, 200) : [],
    rows: typeName === "table" ? asStringList(row.rows, 60, 200) : [],
    columns: typeName === "table" ? asStringList(row.columns, 12, 80) : [],
    content: asString(row.content, 20000),
    allowExtraRows: typeName === "table" && row.allowExtraRows !== false,
  };
}

export function normalizeFields(raw: unknown): FormField[] {
  const list = Array.isArray(raw) ? raw : [];
  const fields: FormField[] = [];
  const used = new Set<string>();
  for (const item of list) {
    const field = normalizeField(item, fields.length);
    if (!field) continue;
    let id = field.id;
    let n = 2;
    while (used.has(id)) {
      id = `${field.id}-${n}`;
      n += 1;
    }
    used.add(id);
    fields.push({ ...field, id });
    if (fields.length >= 80) break;
  }
  return fields;
}

export function parseFields(value: unknown): FormField[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return normalizeFields(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }
  return normalizeFields(value);
}

export type DraftModelOutput = {
  title?: unknown;
  kind?: unknown;
  instructions?: unknown;
  content?: unknown;
  fields?: unknown;
};

export type NormalizedDraft = {
  title: string;
  kind: FormKind;
  instructions: string;
  content: string;
  fields: FormField[];
};

function answerable(fields: FormField[]): FormField[] {
  return fields.filter((field) => field.type !== "info");
}

/** Gemini output → a template Lee Anne can edit. Info-only pages stay readable. */
export function normalizeDraft(raw: DraftModelOutput, fallbackTitle: string): NormalizedDraft {
  const fields = normalizeFields(raw.fields);
  const infoText = fields
    .filter((field) => field.type === "info")
    .map((field) => field.content || field.label)
    .filter(Boolean)
    .join("\n\n");
  const content = asString(raw.content, 50000);
  const instructions = asString(raw.instructions, 10000);
  const title = asString(raw.title, 500) || fallbackTitle || "Worksheet";
  const requested: FormKind = raw.kind === "handout" ? "handout" : "fillable";
  const hasBlanks = answerable(fields).length > 0;
  if (!hasBlanks) {
    return {
      title,
      kind: "handout",
      instructions,
      content: content || infoText || instructions,
      fields: fields.filter((field) => field.type === "info"),
    };
  }
  return {
    title,
    kind: requested,
    instructions,
    content,
    fields,
  };
}

export function blankField(type: FieldType = "short_text"): FormField {
  const field = normalizeField(
    {
      id: newFieldId(),
      type,
      label: type === "info" ? "Instructions" : type === "signature" ? "Signature" : "",
      required: false,
      allowExtraRows: type === "table",
      columns: type === "table" ? ["Notes"] : [],
      rows: type === "table" ? ["Day 1"] : [],
    },
    0
  );
  return field!;
}

export type FormVisibilityInput = {
  role: string;
  publishStatus: PublishStatus;
  programTags: readonly string[];
  enrolledPrograms: readonly string[];
  moduleId: number | null;
  /** True when this client has the module unlocked. Ignored for library forms. */
  moduleUnlocked: boolean;
  /** Library forms with no fields and module questions with no fields stay out of the forms list. */
  listedForClients: boolean;
};

/** Program-tagged library forms follow enrollment. Module forms follow the existing unlock. */
export function clientCanSeeForm(input: FormVisibilityInput): boolean {
  if (input.role === "admin") return true;
  if (input.publishStatus !== "published") return false;
  if (!input.listedForClients) return false;
  if (input.moduleId != null) return input.moduleUnlocked;
  return input.programTags.some((tag) => input.enrolledPrograms.includes(tag));
}

export function canReadSubmission(role: string, viewerId: number, ownerId: number): boolean {
  if (role === "admin") return true;
  return viewerId === ownerId;
}

export function canWriteSubmission(input: {
  role: string;
  viewerId: number;
  ownerId: number;
  form: FormVisibilityInput;
  submissionStatus: SubmissionStatus | null;
}): { ok: true } | { ok: false; reason: string } {
  if (input.viewerId !== input.ownerId) {
    return { ok: false, reason: "You can only save your own answers." };
  }
  if (input.submissionStatus === "reviewed") {
    return { ok: false, reason: "This form is already reviewed." };
  }
  const visible = clientCanSeeForm({ ...input.form, role: input.role === "admin" ? "admin" : "user" });
  if (!visible && input.role !== "admin") {
    return { ok: false, reason: "This form is not on your program." };
  }
  if (input.role === "admin") return { ok: true };
  return { ok: true };
}

export function clientFormStatus(status: string | null | undefined): ClientFormStatus {
  if (status === "draft") return "draft";
  if (status === "submitted") return "submitted";
  if (status === "reviewed") return "reviewed";
  return "not_started";
}

export function fieldsForClient(template: Pick<FormTemplate, "kind" | "fields" | "moduleId">, question: string): FormField[] {
  if (template.kind === "handout") return template.fields.filter((field) => field.type === "info");
  if (template.fields.some((field) => field.type !== "info")) return template.fields;
  if (template.moduleId != null && question.trim()) {
    return [
      {
        id: "answer",
        type: "long_text",
        label: question.trim(),
        help: "",
        required: false,
        options: [],
        rows: [],
        columns: [],
        content: "",
        allowExtraRows: false,
      },
    ];
  }
  return template.fields;
}

export function formIsListedForClients(template: Pick<FormTemplate, "kind" | "fields" | "moduleId" | "content">, question: string): boolean {
  if (template.moduleId == null) {
    if (template.kind === "handout") return Boolean(template.content.trim() || template.fields.length);
    return template.fields.some((field) => field.type !== "info");
  }
  return template.fields.some((field) => field.type !== "info") || template.kind === "handout";
}

const FORM_PHOTO_KEY = /^form-photos\/(\d+)\/[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/;

export function formPhotoOwnerId(key: string): number | null {
  const match = FORM_PHOTO_KEY.exec(key.trim());
  if (!match) return null;
  return Number(match[1]);
}

function clampTable(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  const rows: string[][] = [];
  for (const row of value) {
    if (!Array.isArray(row)) continue;
    rows.push(row.slice(0, 12).map((cell) => asString(cell, 500)));
    if (rows.length >= 80) break;
  }
  return rows;
}

/**
 * Keep answers for questions that were removed from a published form.
 * The client only sees fields that are still on the form. A new field has no stored answer.
 */
export function mergeStoredAnswers(fields: FormField[], previous: FormAnswers, incoming: FormAnswers, userId: number): FormAnswers {
  const visible = sanitizeAnswers(fields, incoming, userId);
  const live = new Set(fields.map((field) => field.id));
  const stored: FormAnswers = { ...visible };
  for (const [id, answer] of Object.entries(previous)) {
    if (!live.has(id)) stored[id] = answer;
  }
  return stored;
}

export function sanitizeAnswers(fields: FormField[], raw: FormAnswers, userId: number): FormAnswers {
  const out: FormAnswers = {};
  for (const field of fields) {
    if (field.type === "info") continue;
    const answer = raw[field.id];
    if (!answer) continue;
    if (field.type === "short_text" || field.type === "long_text") {
      out[field.id] = { text: asString(answer.text, field.type === "short_text" ? 500 : 20000) };
    } else if (field.type === "signature") {
      out[field.id] = { text: asString(answer.text, 200) };
    } else if (field.type === "number") {
      const value = typeof answer.number === "number" && Number.isFinite(answer.number) ? answer.number : null;
      out[field.id] = { number: value };
    } else if (field.type === "date") {
      const date = asString(answer.date, 10);
      out[field.id] = { date: DATE_RE.test(date) ? date : "" };
    } else if (field.type === "single_choice") {
      const choice = asString(answer.text, 200);
      const allowed = field.options.length === 0 || field.options.includes(choice);
      out[field.id] = { text: choice && allowed ? choice : "" };
    } else if (field.type === "multi_choice") {
      const choices = asStringList(answer.choices, 40, 200).filter(
        (choice) => field.options.length === 0 || field.options.includes(choice)
      );
      out[field.id] = { choices };
    } else if (field.type === "checkbox") {
      out[field.id] = { checked: answer.checked === true };
    } else if (field.type === "scale") {
      const scale = typeof answer.scale === "number" && answer.scale >= 1 && answer.scale <= 10 ? Math.round(answer.scale) : null;
      out[field.id] = { scale };
    } else if (field.type === "table") {
      out[field.id] = { table: clampTable(answer.table) };
    } else if (field.type === "photo") {
      const key = asString(answer.photoKey, 240);
      out[field.id] = { photoKey: formPhotoOwnerId(key) === userId ? key : null };
    }
  }
  return out;
}

function filled(field: FormField, answer: FormAnswer | undefined): boolean {
  if (!answer) return false;
  if (field.type === "short_text" || field.type === "long_text" || field.type === "signature" || field.type === "single_choice") {
    return Boolean(answer.text && answer.text.trim());
  }
  if (field.type === "number") return typeof answer.number === "number" && Number.isFinite(answer.number);
  if (field.type === "date") return Boolean(answer.date && DATE_RE.test(answer.date));
  if (field.type === "multi_choice") return Boolean(answer.choices && answer.choices.length > 0);
  if (field.type === "checkbox") return answer.checked === true;
  if (field.type === "scale") return typeof answer.scale === "number";
  if (field.type === "table") return Boolean(answer.table?.some((row) => row.some((cell) => cell.trim())));
  if (field.type === "photo") return Boolean(answer.photoKey);
  return true;
}

export function missingRequired(fields: FormField[], answers: FormAnswers): string[] {
  return fields.filter((field) => field.required && field.type !== "info" && !filled(field, answers[field.id])).map((field) => field.label);
}

export function formatAnswer(field: FormField, answer: FormAnswer | undefined): string {
  if (!answer || field.type === "info") return "";
  if (field.type === "checkbox") return answer.checked ? "Yes" : "";
  if (field.type === "scale") return answer.scale == null ? "" : String(answer.scale);
  if (field.type === "number") return answer.number == null ? "" : String(answer.number);
  if (field.type === "date") return answer.date || "";
  if (field.type === "multi_choice") return (answer.choices ?? []).join(", ");
  if (field.type === "table") {
    return (answer.table ?? [])
      .map((row, index) => {
        const label = field.rows[index] || `Row ${index + 1}`;
        const cells = row.map((cell, col) => `${field.columns[col] || `Col ${col + 1}`}: ${cell}`).join("; ");
        return `${label} — ${cells}`;
      })
      .filter((line) => line.trim())
      .join("\n");
  }
  if (field.type === "photo") return answer.photoKey ? "Photo attached" : "";
  return answer.text?.trim() || "";
}

export function summarizeAnswers(fields: FormField[], answers: FormAnswers): string {
  const lines: string[] = [];
  for (const field of fields) {
    const value = formatAnswer(field, answers[field.id]);
    if (!value) continue;
    lines.push(`${field.label}: ${value}`);
  }
  return lines.join("\n").slice(0, 20000);
}

export type HubFormInput = {
  id: number;
  moduleId: number | null;
  /** Program that owns the module, when this form is attached to one. */
  moduleProgram: ProgramId | null;
  question: string;
  title: string | null;
  instructions: string | null;
  fieldsJson: string | null;
  programTags: string | null;
  publishStatus: string | null;
  kind: string | null;
  content: string | null;
  sourceFileIds: string | null;
  order: number;
};

export type HubFormCard = {
  id: number;
  title: string;
  kind: FormKind;
  /** Gold eyebrow on the program list. */
  label: "Form" | "Assignment";
  status: ClientFormStatus;
  moduleId: number | null;
  sourceFileIds: number[];
};

/** Library forms follow programTags plus the source file's common_file_programs tags. Module forms stay on their module. */
export function hubFormPrograms(
  form: {
    moduleId: number | null;
    moduleProgram: ProgramId | null;
    programTags: readonly ProgramId[];
    sourceFileIds: readonly number[];
  },
  filePrograms: ReadonlyMap<number, readonly ProgramId[]>
): ProgramId[] {
  if (form.moduleId != null) return form.moduleProgram ? [form.moduleProgram] : [];
  const tags: ProgramId[] = [];
  for (const tag of form.programTags) {
    if (!tags.includes(tag)) tags.push(tag);
  }
  for (const fileId of form.sourceFileIds) {
    for (const program of filePrograms.get(fileId) ?? []) {
      if (!tags.includes(program)) tags.push(program);
    }
  }
  return tags;
}

/**
 * Published fillable forms and handouts for one program.
 * A draft stays out, so the library PDF remains until Lee Anne hits Publish.
 * Legacy module questions with no fields stay out, so older app builds keep their written-answer tasks.
 * The files array is unchanged; clients hide a PDF when its library id is in sourceFileIds.
 */
export function selectHubForms(input: {
  program: ProgramId;
  visibleModuleIds: ReadonlySet<number>;
  rows: readonly HubFormInput[];
  filePrograms: ReadonlyMap<number, readonly ProgramId[]>;
  statusByFormId: ReadonlyMap<number, string | null | undefined>;
}): HubFormCard[] {
  const cards: HubFormCard[] = [];
  for (const row of input.rows) {
    if (row.publishStatus === "draft") continue;
    const kind: FormKind = row.kind === "handout" ? "handout" : "fillable";
    const publishStatus: PublishStatus = "published";
    const template: FormTemplate = {
      id: row.id,
      title: row.title?.trim() || row.question,
      instructions: row.instructions ?? "",
      kind,
      content: row.content ?? "",
      fields: parseFields(row.fieldsJson),
      programTags: parseProgramTags(row.programTags),
      publishStatus,
      moduleId: row.moduleId,
      sourceFileIds: parseIdList(row.sourceFileIds),
    };
    if (!formIsListedForClients(template, row.question)) continue;
    const programs = hubFormPrograms(
      {
        moduleId: template.moduleId,
        moduleProgram: row.moduleProgram,
        programTags: template.programTags,
        sourceFileIds: template.sourceFileIds,
      },
      input.filePrograms
    );
    if (!programs.includes(input.program)) continue;
    if (template.moduleId != null && !input.visibleModuleIds.has(template.moduleId)) continue;
    cards.push({
      id: template.id,
      title: template.title,
      kind: template.kind,
      label: template.kind === "handout" ? "Assignment" : "Form",
      status: clientFormStatus(input.statusByFormId.get(row.id)),
      moduleId: template.moduleId,
      sourceFileIds: template.sourceFileIds,
    });
  }
  cards.sort((a, b) => {
    const ao = input.rows.find((row) => row.id === a.id)?.order ?? 0;
    const bo = input.rows.find((row) => row.id === b.id)?.order ?? 0;
    return ao - bo || a.id - b.id;
  });
  return cards;
}

/** True when this hub file is the PDF a digitized form replaced. Uploads that share the library id are included. */
export function hubFileIsHiddenByForm(
  file: { id: number; source: "upload" | "library"; libraryFileId: number | null },
  forms: readonly { sourceFileIds: readonly number[] }[]
): boolean {
  const replaced = new Set(forms.flatMap((form) => form.sourceFileIds));
  if (replaced.size === 0) return false;
  if (file.libraryFileId != null && replaced.has(file.libraryFileId)) return true;
  return file.source === "library" && replaced.has(file.id);
}

export function parseAnswers(value: unknown): FormAnswers {
  let raw = value;
  if (typeof value === "string") {
    if (!value.trim()) return {};
    try {
      raw = JSON.parse(value);
    } catch {
      return {};
    }
  }
  const row = asRecord(raw);
  if (!row) return {};
  const out: FormAnswers = {};
  for (const [key, item] of Object.entries(row)) {
    const answer = asRecord(item);
    if (!answer) continue;
    out[key] = {
      text: typeof answer.text === "string" ? answer.text : undefined,
      number: typeof answer.number === "number" ? answer.number : answer.number === null ? null : undefined,
      date: typeof answer.date === "string" ? answer.date : undefined,
      choices: Array.isArray(answer.choices) ? answer.choices.filter((c): c is string => typeof c === "string") : undefined,
      checked: typeof answer.checked === "boolean" ? answer.checked : undefined,
      scale: typeof answer.scale === "number" ? answer.scale : answer.scale === null ? null : undefined,
      table: Array.isArray(answer.table) ? clampTable(answer.table) : undefined,
      photoKey: typeof answer.photoKey === "string" ? answer.photoKey : answer.photoKey === null ? null : undefined,
    };
  }
  return out;
}
