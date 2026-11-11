import { cleanProgramTags, type ProgramId } from "./forms";

export type LibraryFile = {
  id: number;
  fileName: string;
  mimeType: string | null;
  fileUrl: string;
  fileKey: string;
  groupId: number | null;
  pageOrder: number;
  programTags: ProgramId[];
};

export type LibraryGroup = {
  id: number;
  title: string;
  programTags: ProgramId[];
};

export type LibraryItem =
  | { kind: "file"; file: LibraryFile }
  | { kind: "group"; group: LibraryGroup; pages: LibraryFile[] };

function byPage(a: LibraryFile, b: LibraryFile): number {
  return a.pageOrder - b.pageOrder || a.id - b.id;
}

function itemId(item: LibraryItem): number {
  return item.kind === "group" ? item.group.id : item.file.id;
}

/** One card per group. Member files stay in `pages` and are not listed again. */
export function collapseLibrary(files: LibraryFile[], groups: LibraryGroup[]): LibraryItem[] {
  const members = new Map<number, LibraryFile[]>();
  const loose: LibraryFile[] = [];
  for (const file of files) {
    if (file.groupId == null) {
      loose.push(file);
      continue;
    }
    const list = members.get(file.groupId) ?? [];
    list.push(file);
    members.set(file.groupId, list);
  }

  const items: LibraryItem[] = [];
  const known = new Set(groups.map((group) => group.id));
  for (const group of groups) {
    const pages = (members.get(group.id) ?? []).slice().sort(byPage);
    items.push({ kind: "group", group, pages });
  }
  for (const [groupId, pages] of members) {
    if (known.has(groupId)) continue;
    for (const file of pages) loose.push({ ...file, groupId: null, pageOrder: 0 });
  }
  for (const file of loose) items.push({ kind: "file", file });
  return items.sort((a, b) => itemId(b) - itemId(a));
}

export function planGroup(
  files: LibraryFile[],
  fileIds: number[]
): { ok: true; orderedIds: number[] } | { ok: false; reason: string } {
  const unique: number[] = [];
  for (const id of fileIds) {
    if (!unique.includes(id)) unique.push(id);
  }
  if (unique.length < 2) return { ok: false, reason: "Select at least two pages." };
  const known = new Set(files.map((file) => file.id));
  if (unique.some((id) => !known.has(id))) {
    return { ok: false, reason: "A selected page is no longer in the library." };
  }
  return { ok: true, orderedIds: unique };
}

/** Point the selected files at the group, in the given order. Every original file remains. */
export function applyGroup(files: LibraryFile[], orderedIds: number[], groupId: number): LibraryFile[] {
  const order = new Map(orderedIds.map((id, index) => [id, index]));
  return files.map((file) => {
    const pageOrder = order.get(file.id);
    if (pageOrder == null) return file;
    return { ...file, groupId, pageOrder };
  });
}

/** Clear the group pointer. Files, keys, and urls stay. */
export function applyUngroup(files: LibraryFile[], groupId: number): LibraryFile[] {
  return files.map((file) => (file.groupId === groupId ? { ...file, groupId: null, pageOrder: 0 } : file));
}

export function tagsForItem(item: LibraryItem): ProgramId[] {
  return item.kind === "group" ? item.group.programTags : item.file.programTags;
}

export function libraryItemVisible(item: LibraryItem, enrolledPrograms: readonly string[]): boolean {
  return tagsForItem(item).some((tag) => enrolledPrograms.includes(tag));
}

export function sameFileIdentities(before: LibraryFile[], after: LibraryFile[]): boolean {
  if (before.length !== after.length) return false;
  const afterById = new Map(after.map((file) => [file.id, file]));
  return before.every((file) => {
    const next = afterById.get(file.id);
    return Boolean(next && next.fileKey === file.fileKey && next.fileUrl === file.fileUrl && next.fileName === file.fileName);
  });
}

export function cleanTags(tags: unknown): ProgramId[] {
  return cleanProgramTags(tags);
}
