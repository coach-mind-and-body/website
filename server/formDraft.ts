import { generateObject, type FilePart, type ImagePart, type TextPart } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { normalizeDraft, type NormalizedDraft } from "@shared/forms";

const fieldSchema = z.object({
  type: z.enum([
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
  ]),
  label: z.string(),
  help: z.string(),
  required: z.boolean(),
  options: z.array(z.string()),
  rows: z.array(z.string()),
  columns: z.array(z.string()),
  content: z.string(),
});

const draftSchema = z.object({
  title: z.string(),
  kind: z.enum(["fillable", "handout"]),
  instructions: z.string(),
  content: z.string(),
  fields: z.array(fieldSchema),
});

export type DraftPage = {
  fileName: string;
  mimeType: string;
  base64: string;
};

const CONVERTIBLE = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export function convertibleMime(mimeType: string | null | undefined, fileName: string): string | null {
  const mime = (mimeType || "").toLowerCase().split(";")[0].trim();
  if (CONVERTIBLE.has(mime)) return mime === "image/jpg" ? "image/jpeg" : mime;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return null;
}

function promptFor(pages: DraftPage[]): string {
  return [
    "You turn coaching worksheets into a digital form.",
    "Read every page. Keep the coach's wording.",
    "Paragraphs, headings, and teaching text with no blank become info fields: put the text in content and a short label in label.",
    "A line or box the client is meant to fill becomes a field. Use short_text, long_text, number, date, single_choice, multi_choice, checkbox, scale (1 to 10), table, signature (a typed name), or photo.",
    "Calendars, logs, and grids become one table. Put row labels (days or meals) in rows and column labels in columns.",
    "Choice lists go in options. Do not invent questions that are not on the page.",
    "If the pages are only teaching text and have no blanks, set kind to handout, put the readable text in content, and use info fields for sections.",
    "If there are blanks, set kind to fillable.",
    "help is a short hint or an empty string. required is true only when the page marks the blank as required.",
    `Pages: ${pages.map((page, index) => `${index + 1}. ${page.fileName}`).join(" ")}`,
  ].join("\n");
}

export async function draftFormFromDocuments(pages: DraftPage[], fallbackTitle: string): Promise<NormalizedDraft> {
  if (pages.length === 0) {
    throw new Error("Add a PDF or image first.");
  }
  const content: Array<TextPart | ImagePart | FilePart> = [{ type: "text", text: promptFor(pages) }];
  for (const page of pages) {
    const mime = convertibleMime(page.mimeType, page.fileName);
    if (!mime) throw new Error(`"${page.fileName}" needs to be a PDF, PNG, or JPG.`);
    content.push({ type: "text", text: `Page file: ${page.fileName}` });
    if (mime === "application/pdf") {
      content.push({ type: "file", data: page.base64, mediaType: mime });
    } else {
      content.push({ type: "image", image: page.base64, mediaType: mime });
    }
  }

  const result = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: draftSchema,
    temperature: 0,
    messages: [{ role: "user", content }],
  });
  return normalizeDraft(result.object, fallbackTitle);
}
