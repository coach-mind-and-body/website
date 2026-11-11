import { describe, expect, it } from "vitest";
import {
  libraryItemsAvailableToAdd,
  listProgramContent,
  programTagUpdate,
  type ProgramLibraryItem,
} from "@shared/programContentLibrary";

const metabolicGroup: ProgramLibraryItem = {
  kind: "group",
  refId: 10,
  title: "Men's fasting calendar",
  programTags: ["metabolic"],
  pages: [
    { id: 3, fileName: "page-1.png", fileUrl: "https://cdn.example/3.png" },
    { id: 4, fileName: "page-2.png", fileUrl: "https://cdn.example/4.png" },
  ],
  linkedFormId: 21,
  linkedFormTitle: "Fasting check-in",
};

const reclaimFile: ProgramLibraryItem = {
  kind: "file",
  refId: 8,
  title: "Muai Quote.pdf",
  programTags: ["reclaim", "holiday"],
  pages: [{ id: 8, fileName: "Muai Quote.pdf", fileUrl: "https://cdn.example/muai.pdf" }],
  linkedFormId: null,
  linkedFormTitle: null,
};

const untagged: ProgramLibraryItem = {
  kind: "file",
  refId: 9,
  title: "Grocery list.pdf",
  programTags: [],
  pages: [{ id: 9, fileName: "Grocery list.pdf", fileUrl: "https://cdn.example/grocery.pdf" }],
  linkedFormId: null,
  linkedFormTitle: null,
};

describe("program content library", () => {
  it("lists the file and its form for the tagged program, with the page group", () => {
    const rows = listProgramContent([metabolicGroup, reclaimFile, untagged], "metabolic");
    expect(rows.map((row) => row.type)).toEqual(["file", "form"]);
    expect(rows[0]).toMatchObject({
      title: "Men's fasting calendar",
      pageGroup: "Men's fasting calendar",
      linkLabel: "Open",
      href: "https://cdn.example/3.png",
      tagKind: "group",
      tagId: 10,
    });
    expect(rows[1]).toMatchObject({
      type: "form",
      title: "Fasting check-in",
      pageGroup: "Men's fasting calendar",
      href: "/admin/forms/21",
      linkLabel: "Edit",
      tagKind: "group",
      tagId: 10,
    });
  });

  it("lists a loose file without a page group and keeps it on every tagged program", () => {
    const metabolic = listProgramContent([reclaimFile], "metabolic");
    const holiday = listProgramContent([reclaimFile], "holiday");
    expect(metabolic).toEqual([]);
    expect(holiday).toEqual([
      expect.objectContaining({
        type: "file",
        title: "Muai Quote.pdf",
        pageGroup: null,
        href: "https://cdn.example/muai.pdf",
        tagKind: "file",
        tagId: 8,
      }),
    ]);
  });

  it("offers only library items that are not already on this program", () => {
    const available = libraryItemsAvailableToAdd([metabolicGroup, reclaimFile, untagged], "metabolic");
    expect(available.map((item) => item.refId)).toEqual([8, 9]);
  });

  it("tags a file by adding the program and leaving the other tags in place", () => {
    const original = [...reclaimFile.programTags];
    const update = programTagUpdate(reclaimFile, "metabolic", "add");
    expect(update).toEqual({
      kind: "file",
      id: 8,
      programTags: ["reclaim", "holiday", "metabolic"],
    });
    expect(reclaimFile.programTags).toEqual(original);
    expect(update).not.toHaveProperty("delete");
  });

  it("untags a program without deleting the file or dropping its other programs", () => {
    const original = [...reclaimFile.programTags];
    const update = programTagUpdate(reclaimFile, "holiday", "remove");
    expect(update).toEqual({
      kind: "file",
      id: 8,
      programTags: ["reclaim"],
    });
    expect(reclaimFile.programTags).toEqual(original);
    const again = programTagUpdate({ kind: "file", refId: 8, programTags: update.programTags }, "holiday", "remove");
    expect(again.programTags).toEqual(["reclaim"]);
  });

  it("untags a form by the same group tag call the library uses", () => {
    const [form] = listProgramContent([metabolicGroup], "metabolic").filter((row) => row.type === "form");
    const update = programTagUpdate(
      { kind: form.tagKind, refId: form.tagId, programTags: form.programTags },
      "metabolic",
      "remove"
    );
    expect(update).toEqual({ kind: "group", id: 10, programTags: [] });
  });
});
