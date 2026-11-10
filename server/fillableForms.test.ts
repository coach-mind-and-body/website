import { describe, expect, it } from "vitest";
import {
  canReadSubmission,
  canWriteSubmission,
  clientCanSeeForm,
  clientFormStatus,
  mergeStoredAnswers,
  missingRequired,
  normalizeDraft,
  sanitizeAnswers,
  type FormField,
  type FormVisibilityInput,
} from "@shared/forms";
import {
  applyGroup,
  applyUngroup,
  collapseLibrary,
  libraryItemVisible,
  planGroup,
  sameFileIdentities,
  type LibraryFile,
  type LibraryGroup,
} from "@shared/libraryGroups";

function file(partial: Partial<LibraryFile> & Pick<LibraryFile, "id" | "fileName">): LibraryFile {
  return {
    mimeType: "image/png",
    fileUrl: `https://cdn.example/${partial.id}.png`,
    fileKey: `common-files/${partial.id}.png`,
    groupId: null,
    pageOrder: 0,
    programTags: [],
    ...partial,
  };
}

function visibility(partial: Partial<FormVisibilityInput> = {}): FormVisibilityInput {
  return {
    role: "user",
    publishStatus: "published",
    programTags: ["metabolic"],
    enrolledPrograms: ["metabolic"],
    moduleId: null,
    moduleUnlocked: false,
    listedForClients: true,
    ...partial,
  };
}

const nameField: FormField = {
  id: "name",
  type: "short_text",
  label: "Name",
  help: "",
  required: true,
  options: [],
  rows: [],
  columns: [],
  content: "",
  allowExtraRows: false,
};

describe("form visibility and submissions", () => {
  it("shows a program form to an enrolled client", () => {
    expect(clientCanSeeForm(visibility())).toBe(true);
  });

  it("shows one form to a client in any of its programs", () => {
    const both = visibility({ programTags: ["metabolic", "reclaim"] });
    expect(clientCanSeeForm({ ...both, enrolledPrograms: ["reclaim"] })).toBe(true);
    expect(clientCanSeeForm({ ...both, enrolledPrograms: ["metabolic"] })).toBe(true);
    expect(clientCanSeeForm({ ...both, enrolledPrograms: ["holiday", "reclaim"] })).toBe(true);
    expect(clientCanSeeForm({ ...both, enrolledPrograms: ["fpu"] })).toBe(false);
  });

  it("hides a program form from a client who is not enrolled", () => {
    expect(clientCanSeeForm(visibility({ enrolledPrograms: ["reclaim"] }))).toBe(false);
    expect(clientCanSeeForm(visibility({ enrolledPrograms: [] }))).toBe(false);
  });

  it("hides drafts and untagged library forms from clients", () => {
    expect(clientCanSeeForm(visibility({ publishStatus: "draft" }))).toBe(false);
    expect(clientCanSeeForm(visibility({ programTags: [] }))).toBe(false);
  });

  it("lets an admin see every form, including drafts", () => {
    expect(clientCanSeeForm(visibility({ role: "admin", publishStatus: "draft", programTags: [] }))).toBe(true);
  });

  it("lets a client read and write only their own submission", () => {
    expect(canReadSubmission("user", 7, 7)).toBe(true);
    expect(canReadSubmission("user", 7, 8)).toBe(false);
    const own = canWriteSubmission({
      role: "user",
      viewerId: 7,
      ownerId: 7,
      form: visibility(),
      submissionStatus: null,
    });
    expect(own.ok).toBe(true);
    const other = canWriteSubmission({
      role: "user",
      viewerId: 7,
      ownerId: 8,
      form: visibility(),
      submissionStatus: "draft",
    });
    expect(other.ok).toBe(false);
  });

  it("lets an admin read every submission", () => {
    expect(canReadSubmission("admin", 1, 7)).toBe(true);
    expect(canReadSubmission("admin", 1, 99)).toBe(true);
  });

  it("refuses a client who cannot see the form, and locks a reviewed submission", () => {
    const hidden = canWriteSubmission({
      role: "user",
      viewerId: 7,
      ownerId: 7,
      form: visibility({ enrolledPrograms: [] }),
      submissionStatus: null,
    });
    expect(hidden.ok).toBe(false);
    const reviewed = canWriteSubmission({
      role: "user",
      viewerId: 7,
      ownerId: 7,
      form: visibility(),
      submissionStatus: "reviewed",
    });
    expect(reviewed.ok).toBe(false);
  });

  it("maps stored status onto the client labels", () => {
    expect(clientFormStatus(null)).toBe("not_started");
    expect(clientFormStatus("draft")).toBe("draft");
    expect(clientFormStatus("submitted")).toBe("submitted");
    expect(clientFormStatus("reviewed")).toBe("reviewed");
  });

  it("keeps a photo key only when it belongs to that client", () => {
    const answers = sanitizeAnswers(
      [{ ...nameField, id: "shot", type: "photo", required: false }],
      { shot: { photoKey: "form-photos/7/page.jpg" } },
      4
    );
    expect(answers.shot?.photoKey).toBeNull();
    const own = sanitizeAnswers(
      [{ ...nameField, id: "shot", type: "photo", required: false }],
      { shot: { photoKey: "form-photos/4/page.jpg" } },
      4
    );
    expect(own.shot?.photoKey).toBe("form-photos/4/page.jpg");
  });

  it("requires an answer before submit", () => {
    expect(missingRequired([nameField], {})).toEqual(["Name"]);
    expect(missingRequired([nameField], { name: { text: "Lee" } })).toEqual([]);
  });
});

describe("library grouping", () => {
  const pages = [
    file({ id: 1, fileName: "mens-fasting-1.png" }),
    file({ id: 2, fileName: "mens-fasting-2.png" }),
    file({ id: 3, fileName: "womens-cycle.png", programTags: ["metabolic"] }),
  ];

  it("groups selected pages into one item and keeps every original file", () => {
    const plan = planGroup(pages, [2, 1]);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const grouped = applyGroup(pages, plan.orderedIds, 10);
    expect(sameFileIdentities(pages, grouped)).toBe(true);
    const group: LibraryGroup = { id: 10, title: "Men's fasting calendar", programTags: ["metabolic"] };
    const items = collapseLibrary(grouped, [group]);
    const card = items.find((item) => item.kind === "group");
    expect(card && card.kind === "group" && card.pages.map((page) => page.id)).toEqual([2, 1]);
    expect(items.filter((item) => item.kind === "file")).toHaveLength(1);
  });

  it("refuses a one-page group", () => {
    expect(planGroup(pages, [1]).ok).toBe(false);
  });

  it("ungroups without deleting the pages", () => {
    const grouped = applyGroup(pages, [1, 2], 10);
    const restored = applyUngroup(grouped, 10);
    expect(sameFileIdentities(pages, restored)).toBe(true);
    expect(restored.find((page) => page.id === 1)?.groupId).toBeNull();
    expect(restored.find((page) => page.id === 2)?.groupId).toBeNull();
    expect(restored.find((page) => page.id === 3)?.programTags).toEqual(["metabolic"]);
    const items = collapseLibrary(restored, []);
    expect(items.every((item) => item.kind === "file")).toBe(true);
    expect(items).toHaveLength(3);
  });

  it("shows a grouped item to an enrolled client and hides it from everyone else", () => {
    const group: LibraryGroup = { id: 10, title: "Men's fasting calendar", programTags: ["metabolic"] };
    const item = collapseLibrary(applyGroup(pages, [1, 2], 10), [group]).find((entry) => entry.kind === "group");
    expect(item && libraryItemVisible(item, ["metabolic"])).toBe(true);
    expect(item && libraryItemVisible(item, ["reclaim"])).toBe(false);
    expect(item && libraryItemVisible(item, [])).toBe(false);
  });
});

describe("template drafting normalizer", () => {
  it("keeps teaching text as info and blanks as fields", () => {
    const draft = normalizeDraft(
      {
        title: "Carb guide",
        kind: "fillable",
        instructions: "Fill the blanks.",
        content: "",
        fields: [
          { type: "info", label: "How carbs work", content: "Carbs are a tool, not the enemy." },
          { type: "number", label: "Target carbs", required: true },
        ],
      },
      "Worksheet"
    );
    expect(draft.kind).toBe("fillable");
    expect(draft.fields.map((field) => field.type)).toEqual(["info", "number"]);
    expect(draft.fields[0]?.content).toContain("Carbs are a tool");
  });

  it("keeps a handout with no blanks as readable content", () => {
    const draft = normalizeDraft(
      {
        title: "Fasting notes",
        kind: "fillable",
        instructions: "",
        content: "",
        fields: [{ type: "info", label: "Page 2", content: "Eat protein first." }],
      },
      "Worksheet"
    );
    expect(draft.kind).toBe("handout");
    expect(draft.content).toContain("Eat protein first.");
    expect(draft.fields.every((field) => field.type === "info")).toBe(true);
  });
});

function question(partial: Partial<FormField> & Pick<FormField, "id" | "type" | "label">): FormField {
  return {
    help: "",
    required: false,
    options: [],
    rows: [],
    columns: [],
    content: "",
    allowExtraRows: false,
    ...partial,
  };
}

describe("editing a published form that already has answers", () => {
  const name = question({ id: "name", type: "short_text", label: "Name", required: true });
  const energy = question({ id: "energy", type: "scale", label: "Energy" });
  const when = question({ id: "when", type: "date", label: "Date" });
  const stored = {
    name: { text: "Ada" },
    energy: { scale: 4 },
  };

  it("reorders fields without moving the saved answers", () => {
    const reordered = [energy, name];
    const next = mergeStoredAnswers(reordered, stored, stored, 7);
    expect(reordered.map((field) => field.id)).toEqual(["energy", "name"]);
    expect(next.name?.text).toBe("Ada");
    expect(next.energy?.scale).toBe(4);
    expect(sanitizeAnswers(reordered, next, 7)).toEqual(next);
  });

  it("adds a field that is empty on the old submission", () => {
    const withDate = [name, energy, when];
    const next = mergeStoredAnswers(withDate, stored, stored, 7);
    expect(next.when).toBeUndefined();
    expect(next.name?.text).toBe("Ada");
    expect(next.energy?.scale).toBe(4);
    expect(sanitizeAnswers(withDate, next, 7).when).toBeUndefined();
  });

  it("hides a removed field and keeps its answer stored", () => {
    const withoutEnergy = [name];
    const incoming = { name: { text: "Ada" } };
    const next = mergeStoredAnswers(withoutEnergy, stored, incoming, 7);
    expect(next.energy?.scale).toBe(4);
    expect(next.name?.text).toBe("Ada");
    const shown = sanitizeAnswers(withoutEnergy, next, 7);
    expect(shown.energy).toBeUndefined();
    expect(shown.name?.text).toBe("Ada");
  });

  it("keeps the form published and still lets an enrolled client open it", () => {
    const edited = [when, name];
    const next = mergeStoredAnswers(edited, stored, { name: { text: "Ada Lee" } }, 7);
    expect(next.name?.text).toBe("Ada Lee");
    expect(next.energy?.scale).toBe(4);
    expect(
      clientCanSeeForm(
        visibility({
          publishStatus: "published",
          programTags: ["metabolic", "holiday"],
          enrolledPrograms: ["holiday"],
        })
      )
    ).toBe(true);
    expect(edited.map((field) => field.label)).toEqual(["Date", "Name"]);
  });
});
