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
};

export type ProgramContentRow = {
  key: string;
  type: "file" | "form";
  title: string;
  /** Group title when the pages were grouped. Loose files have none. */
  pageGroup: string | null;
  href: string | null;
  linkLabel: "Open" | "Edit";
  /** What adminSetTags expects. Forms untag the library item they came from. */
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

/** Library files on this program, then the digital form made from those pages. */
export function listProgramContent(items: readonly ProgramLibraryItem[], program: ProgramId): ProgramContentRow[] {
  const rows: ProgramContentRow[] = [];
  const seenForms = new Set<number>();
  for (const item of items) {
    if (!item.programTags.includes(program)) continue;
    const pageGroup = item.kind === "group" ? item.title : null;
    rows.push({
      key: `file-${item.kind}-${item.refId}`,
      type: "file",
      title: item.title,
      pageGroup,
      href: item.pages[0]?.fileUrl ?? null,
      linkLabel: "Open",
      tagKind: item.kind,
      tagId: item.refId,
      programTags: [...item.programTags],
    });
    if (item.linkedFormId != null && !seenForms.has(item.linkedFormId)) {
      seenForms.add(item.linkedFormId);
      rows.push({
        key: `form-${item.linkedFormId}`,
        type: "form",
        title: item.linkedFormTitle?.trim() || item.title,
        pageGroup,
        href: `/admin/forms/${item.linkedFormId}`,
        linkLabel: "Edit",
        tagKind: item.kind,
        tagId: item.refId,
        programTags: [...item.programTags],
      });
    }
  }
  return rows;
}

/** Library items that can be tagged onto this program. Already-tagged items stay out of the picker. */
export function libraryItemsAvailableToAdd(
  items: readonly ProgramLibraryItem[],
  program: ProgramId
): ProgramLibraryItem[] {
  return items.filter((item) => !item.programTags.includes(program));
}
