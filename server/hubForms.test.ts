import { describe, expect, it } from "vitest";
import { hubFileIsHiddenByForm, selectHubForms, type HubFormInput } from "@shared/forms";
import type { ProgramId } from "@shared/programs";

const nameField = JSON.stringify([
  { id: "name", type: "short_text", label: "Name", help: "", required: true, options: [], rows: [], columns: [], content: "", allowExtraRows: false },
]);

function row(partial: Partial<HubFormInput> & Pick<HubFormInput, "id">): HubFormInput {
  return {
    moduleId: null,
    moduleProgram: null,
    question: "Worksheet",
    title: "Worksheet",
    instructions: "",
    fieldsJson: nameField,
    programTags: null,
    publishStatus: "published",
    kind: "fillable",
    content: "",
    sourceFileIds: null,
    order: partial.id,
    ...partial,
  };
}

describe("hub forms for a program", () => {
  const filePrograms = new Map<number, ProgramId[]>([
    [7, ["metabolic"]],
    [8, ["reclaim"]],
  ]);

  it("includes a form tagged only through the source file's program", () => {
    const cards = selectHubForms({
      program: "metabolic",
      visibleModuleIds: new Set(),
      rows: [row({ id: 3, title: "Fasting calendar", sourceFileIds: "[7]", programTags: null })],
      filePrograms,
      statusByFormId: new Map([[3, "submitted"]]),
    });
    expect(cards).toEqual([
      {
        id: 3,
        title: "Fasting calendar",
        kind: "fillable",
        label: "Form",
        status: "submitted",
        moduleId: null,
        sourceFileIds: [7],
      },
    ]);
  });

  it("does not show that form on a program the file is not tagged to", () => {
    const cards = selectHubForms({
      program: "reclaim",
      visibleModuleIds: new Set(),
      rows: [row({ id: 3, sourceFileIds: "[7]" })],
      filePrograms,
      statusByFormId: new Map(),
    });
    expect(cards).toEqual([]);
  });

  it("shows a form on every program it is tagged to", () => {
    const rows = [row({ id: 4, programTags: JSON.stringify(["metabolic", "holiday"]), sourceFileIds: "[7]" })];
    const metabolic = selectHubForms({
      program: "metabolic",
      visibleModuleIds: new Set(),
      rows,
      filePrograms,
      statusByFormId: new Map(),
    });
    const holiday = selectHubForms({
      program: "holiday",
      visibleModuleIds: new Set(),
      rows,
      filePrograms,
      statusByFormId: new Map(),
    });
    expect(metabolic.map((card) => card.id)).toEqual([4]);
    expect(holiday.map((card) => card.id)).toEqual([4]);
  });

  it("keeps the Metabolic PDF until the form made from that file is published", () => {
    const pdf = { id: 42, source: "library" as const, libraryFileId: 42 };
    const programs = new Map<number, ProgramId[]>([[42, ["metabolic"]]]);
    const madeFromThatFile = row({
      id: 90,
      title: "Metabolic check-in",
      sourceFileIds: "[42]",
      programTags: null,
    });

    const published = selectHubForms({
      program: "metabolic",
      visibleModuleIds: new Set(),
      rows: [{ ...madeFromThatFile, publishStatus: "published" }],
      filePrograms: programs,
      statusByFormId: new Map(),
    });
    expect(published.map((card) => card.id)).toEqual([90]);
    expect(published[0]).toMatchObject({ title: "Metabolic check-in", sourceFileIds: [42], label: "Form" });
    expect(hubFileIsHiddenByForm(pdf, published)).toBe(true);
    expect(
      selectHubForms({
        program: "reclaim",
        visibleModuleIds: new Set(),
        rows: [{ ...madeFromThatFile, publishStatus: "published" }],
        filePrograms: programs,
        statusByFormId: new Map(),
      })
    ).toEqual([]);

    const draft = selectHubForms({
      program: "metabolic",
      visibleModuleIds: new Set(),
      rows: [{ ...madeFromThatFile, publishStatus: "draft" }],
      filePrograms: programs,
      statusByFormId: new Map(),
    });
    expect(draft).toEqual([]);
    expect(hubFileIsHiddenByForm(pdf, draft)).toBe(false);
  });

  it("leaves a legacy module question out of the forms list", () => {
    const cards = selectHubForms({
      program: "reclaim",
      visibleModuleIds: new Set([1]),
      rows: [
        row({
          id: 11,
          moduleId: 1,
          moduleProgram: "reclaim",
          question: "What did you notice?",
          title: null,
          fieldsJson: null,
          kind: "fillable",
        }),
      ],
      filePrograms,
      statusByFormId: new Map(),
    });
    expect(cards).toEqual([]);
  });

  it("includes a module form only while that module is visible, and labels a handout as an assignment", () => {
    const rows = [
      row({
        id: 12,
        moduleId: 2,
        moduleProgram: "reclaim",
        kind: "handout",
        title: "Week 2 reading",
        fieldsJson: null,
        content: "Read this.",
        order: 2,
      }),
    ];
    const locked = selectHubForms({
      program: "reclaim",
      visibleModuleIds: new Set([1]),
      rows,
      filePrograms,
      statusByFormId: new Map(),
    });
    const open = selectHubForms({
      program: "reclaim",
      visibleModuleIds: new Set([2]),
      rows,
      filePrograms,
      statusByFormId: new Map([[12, "reviewed"]]),
    });
    expect(locked).toEqual([]);
    expect(open[0]).toMatchObject({ id: 12, label: "Assignment", status: "reviewed", kind: "handout" });
  });

  it("hides the library pdf a form replaced and keeps unrelated files", () => {
    const forms = [{ sourceFileIds: [7] }];
    expect(hubFileIsHiddenByForm({ id: 7, source: "library", libraryFileId: 7 }, forms)).toBe(true);
    expect(hubFileIsHiddenByForm({ id: 99, source: "upload", libraryFileId: 7 }, forms)).toBe(true);
    expect(hubFileIsHiddenByForm({ id: 8, source: "library", libraryFileId: 8 }, forms)).toBe(false);
    expect(hubFileIsHiddenByForm({ id: 5, source: "upload", libraryFileId: null }, forms)).toBe(false);
  });
});
