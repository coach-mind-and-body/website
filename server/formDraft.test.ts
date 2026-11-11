import { beforeEach, describe, expect, it, vi } from "vitest";

const generateObject = vi.hoisted(() => vi.fn());

vi.mock("ai", () => ({
  generateObject,
}));

vi.mock("@ai-sdk/google", () => ({
  google: () => "mock-gemini",
}));

import { draftFormFromDocuments } from "./formDraft";

describe("draftFormFromDocuments", () => {
  beforeEach(() => {
    generateObject.mockReset();
  });

  it("sends the worksheet pages to Gemini and returns editable fields", async () => {
    generateObject.mockResolvedValue({
      object: {
        title: "Men's fasting calendar",
        kind: "fillable",
        instructions: "Mark each day.",
        content: "",
        fields: [
          {
            type: "info",
            label: "How to use this",
            help: "",
            required: false,
            options: [],
            rows: [],
            columns: [],
            content: "Circle the days you fast.",
          },
          {
            type: "table",
            label: "Fasting days",
            help: "",
            required: false,
            options: [],
            rows: ["Monday", "Tuesday"],
            columns: ["Fasted", "Notes"],
            content: "",
          },
          {
            type: "signature",
            label: "Your name",
            help: "",
            required: true,
            options: [],
            rows: [],
            columns: [],
            content: "",
          },
        ],
      },
    });

    const draft = await draftFormFromDocuments(
      [
        { fileName: "page-1.png", mimeType: "image/png", base64: "aaa" },
        { fileName: "page-2.pdf", mimeType: "application/pdf", base64: "bbb" },
      ],
      "Calendar"
    );

    expect(generateObject).toHaveBeenCalledTimes(1);
    const call = generateObject.mock.calls[0][0];
    expect(call.model).toBe("mock-gemini");
    const parts = call.messages[0].content as { type: string; mediaType?: string }[];
    expect(parts.some((part) => part.type === "image" && part.mediaType === "image/png")).toBe(true);
    expect(parts.some((part) => part.type === "file" && part.mediaType === "application/pdf")).toBe(true);
    expect(draft.title).toBe("Men's fasting calendar");
    expect(draft.kind).toBe("fillable");
    expect(draft.fields.map((field) => field.type)).toEqual(["info", "table", "signature"]);
    expect(draft.fields[1]?.rows).toEqual(["Monday", "Tuesday"]);
    expect(draft.fields.every((field) => field.id)).toBe(true);
  });

  it("turns a no-blank Gemini draft into readable content", async () => {
    generateObject.mockResolvedValue({
      object: {
        title: "Carb and fat guide",
        kind: "fillable",
        instructions: "",
        content: "Read this before the fast.",
        fields: [
          {
            type: "info",
            label: "Carbs",
            help: "",
            required: false,
            options: [],
            rows: [],
            columns: [],
            content: "Carbs come back in later.",
          },
        ],
      },
    });

    const draft = await draftFormFromDocuments(
      [{ fileName: "carbs.png", mimeType: "image/png", base64: "ccc" }],
      "Guide"
    );
    expect(draft.kind).toBe("handout");
    expect(draft.content).toContain("Read this before the fast.");
    expect(draft.fields.every((field) => field.type === "info")).toBe(true);
  });
});
