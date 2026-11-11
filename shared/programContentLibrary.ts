import type { ProgramId } from "./programs";

/** A library card, already collapsed the same way Library > Files shows it. */
export type ProgramLibraryItem = {
  kind: "file" | "group";
  refId: number;
  title: string;
  /** Tags stored in common_file_programs. */
  programTags: ProgramId[];
  pages: { id: number; fileName: string; fileUrl: string }[];
  linkedFormId: number | null;
  linkedFormTitle: string | null;
  /** Null when this file has no form. Drafts do not replace the file for clients. */
  linkedPublishStatus: "draft" | "published" | null;
};

export type ProgramContentRow = {
  key: string;
  type: "file" | "form";
  title: string;
  /** Group title when the pages were grouped. Loose files have none. */
  pageGroup: string | null;
  /** Edit the published form. Null when clients still see the file. */
  formHref: string | null;
  /** The original file or the first original page. */
  fileHref: string | null;
  fileLinkLabel: "Open the original file" | "Open the original pages";
  /** A form that is not published yet. Clients still see the file. */
  draftFormHref: string | null;
  /** What adminSetTags expects. Removing a program untags the original file. */
  tagKind: "file" | "group";
  tagId: number;
  programTags: ProgramId[];
};

export function tagsWithProgram(tags: readonly ProgramId[], program: ProgramId): ProgramId[] {
  if (tags.includes(program)) return [...tags];
  return [...tags, program];
}

export function tagsWithoutProgram(tags: readonly ProgramId[], program: ProgramId): ProgramId[] {
  return tags.filter((tag) => tag !== program);
}

/**
 * The payload Library > Files already sends to forms.adminSetTags.
 * Adding or removing a program only changes the tag list. The file stays in the library.
 */
export function programTagUpdate(
  item: { kind: "file" | "group"; refId: number; programTags: readonly ProgramId[] },
  program: ProgramId,
  action: "add" | "remove"
): { kind: "file" | "group"; id: number; programTags: ProgramId[] } {
  return {
    kind: item.kind,
    id: item.refId,
    programTags: action === "add" ? tagsWithProgram(item.programTags, program) : tagsWithoutProgram(item.programTags, program),
  };
}

/** One row per library item. A published form replaces the file. A draft does not. */
export function listProgramContent(items: readonly ProgramLibraryItem[], program: ProgramId): ProgramContentRow[] {
  const rows: ProgramContentRow[] = [];
  const seenForms = new Set<number>();
  for (const item of items) {
    if (!item.programTags.includes(program)) continue;
    const published = item.linkedPublishStatus === "published" && item.linkedFormId != null;
    if (published && seenForms.has(item.linkedFormId!)) continue;
    if (published) seenForms.add(item.linkedFormId!);
    const pageGroup = item.kind === "group" ? item.title : null;
    const fileLinkLabel = item.kind === "group" ? "Open the original pages" : "Open the original file";
    const fileHref = item.pages[0]?.fileUrl ?? null;
    rows.push({
      key: published ? `form-${item.linkedFormId}` : `file-${item.kind}-${item.refId}`,
      type: published ? "form" : "file",
      title: published ? item.linkedFormTitle?.trim() || item.title : item.title,
      pageGroup,
      formHref: published ? `/admin/forms/${item.linkedFormId}` : null,
      fileHref,
      fileLinkLabel,
      draftFormHref:
        !published && item.linkedFormId != null ? `/admin/forms/${item.linkedFormId}` : null,
      tagKind: item.kind,
      tagId: item.refId,
      programTags: [...item.programTags],
    });
  }
  return rows;
}

/** Page ids of library files a published form already replaces. */
export function sourceFileIdsCoveredByForms(
  forms: readonly { sourceFileIds?: readonly number[] | null }[]
): Set<number> {
  const ids = new Set<number>();
  for (const form of forms) {
    for (const id of form.sourceFileIds ?? []) ids.add(id);
  }
  return ids;
}

/** Library items that can be tagged onto this program. Already-tagged items stay out of the picker. */
export function libraryItemsAvailableToAdd(
  items: readonly ProgramLibraryItem[],
  program: ProgramId
): ProgramLibraryItem[] {
  return items.filter((item) => !item.programTags.includes(program));
}
