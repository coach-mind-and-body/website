import { generateObject, type ImagePart, type TextPart } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "drink"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const MAX_WRITTEN_LOG_IMAGES = 4;
export const MAX_WRITTEN_LOG_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_WRITTEN_LOG_TOTAL_BYTES = 10 * 1024 * 1024;
export const WRITTEN_LOG_DAILY_LIMIT = 24;
export const MAX_WRITTEN_LOG_ENTRIES = 40;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export class WrittenLogError extends Error {
  readonly code: "BAD_REQUEST" | "PAYLOAD_TOO_LARGE" | "TOO_MANY_REQUESTS";

  constructor(
    message: string,
    code: WrittenLogError["code"] = "BAD_REQUEST"
  ) {
    super(message);
    this.name = "WrittenLogError";
    this.code = code;
  }
}

export const writtenLogEntrySchema = z.object({
  mealType: z.enum(MEAL_TYPES),
  time: z.string().max(40).nullable(),
  foodName: z.string().min(1).max(300),
  portion: z.string().max(120).nullable(),
  calories: z.number().int().min(0).max(5000),
  protein: z.number().int().min(0).max(500),
  carbs: z.number().int().min(0).max(500),
  fat: z.number().int().min(0).max(500),
  fiber: z.number().int().min(0).max(150),
  confidence: z.enum(CONFIDENCE_LEVELS),
  unclear: z.boolean(),
  note: z.string().max(200).nullable(),
  imageIndex: z.number().int().min(0).max(MAX_WRITTEN_LOG_IMAGES - 1),
});

export type WrittenLogEntry = z.infer<typeof writtenLogEntrySchema>;

export const writtenLogModelSchema = z.object({
  entries: z
    .array(
      z.object({
        mealType: z
          .enum(MEAL_TYPES)
          .describe("Meal heading on the page. Use snack only when no meal is written."),
        time: z.string().nullable().describe("Clock time written beside the entry, or null."),
        foodName: z
          .string()
          .describe("Words actually read. Use Unreadable item when the food cannot be read. Do not invent a food."),
        portion: z.string().nullable().describe("Amount written on the page, or null. Do not invent a portion."),
        calories: z.number().describe("Number written on the page, or a typical estimate. 0 if the food cannot be read."),
        protein: z.number().describe("Protein grams. 0 if the food cannot be read."),
        carbs: z.number().describe("Carb grams. 0 if the food cannot be read."),
        fat: z.number().describe("Fat grams. 0 if the food cannot be read."),
        fiber: z.number().describe("Fiber grams. 0 if the food cannot be read."),
        confidence: z.enum(CONFIDENCE_LEVELS),
        unclear: z.boolean().describe("True when the person should check this line."),
        note: z.string().nullable().describe("Short reason when unclear, otherwise null."),
        imageIndex: z.number().describe("0-based index of the photo this line came from."),
      })
    )
    .max(MAX_WRITTEN_LOG_ENTRIES),
});

export const analyzeWrittenFoodLogInput = z.object({
  images: z
    .array(
      z.object({
        imageBase64: z.string().min(16).max(7_500_000),
      })
    )
    .min(1)
    .max(MAX_WRITTEN_LOG_IMAGES),
});

export const batchCalorieLogsSchema = z.object({
  logs: z
    .array(
      z.object({
        dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        mealType: z.enum(MEAL_TYPES),
        foodName: z.string().min(1).max(500),
        portion: z.string().max(120).nullish(),
        time: z.string().max(40).nullish(),
        calories: z.number().min(0).max(20000),
        protein: z.number().min(0).max(2000),
        carbs: z.number().min(0).max(2000),
        fat: z.number().min(0).max(2000),
        fiber: z.number().min(0).max(1000).optional(),
        imageUrl: z.string().max(1000).nullish(),
      })
    )
    .min(1)
    .max(MAX_WRITTEN_LOG_ENTRIES),
});

export type PreparedFoodLogImage = {
  index: number;
  mimeType: string;
  buffer: Buffer;
  base64: string;
};

const scanUsage = new Map<number, { day: string; count: number }>();

export function resetWrittenLogScanAllowanceForTests() {
  scanUsage.clear();
}

export function assertWrittenLogScanAllowance(userId: number, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const current = scanUsage.get(userId);
  if (!current || current.day !== day) {
    scanUsage.set(userId, { day, count: 1 });
    return;
  }
  if (current.count >= WRITTEN_LOG_DAILY_LIMIT) {
    throw new WrittenLogError(
      `Daily scan limit reached (${WRITTEN_LOG_DAILY_LIMIT}). Try again tomorrow.`,
      "TOO_MANY_REQUESTS"
    );
  }
  current.count += 1;
}

export function buildWrittenFoodLogPrompt(imageCount: number): string {
  const pages = imageCount === 1 ? "1 page" : `${imageCount} pages`;
  return `You read handwritten and typed food logs for a nutrition coach. The client photographed ${pages}. A page may be one meal or a whole day with several meals.

Extract every food or drink you can actually see written.

Rules:
- Do not invent foods, portions, or times that are not on the page.
- Copy the words you can read, including misspellings.
- If a food cannot be read, set foodName to "Unreadable item", unclear to true, confidence to "low", and calories, protein, carbs, fat, and fiber to 0. Do not guess a food to fill the gap.
- If only part of a line is readable, put the readable words in foodName, set unclear to true, and explain briefly in note.
- Meal type comes from a heading on the page. If the only clue is a clock time, morning is breakfast, midday is lunch, and evening is dinner. If there is no heading and no time, use snack and set unclear to true.
- time is the clock time written beside that entry, or null.
- portion is the amount written on the page, or null.
- If the page already lists calories or macros, use those numbers. Otherwise estimate a typical amount only when the food is readable.
- confidence is "high" only when the handwriting is clear, "medium" when you are fairly sure, and "low" when the person should check it.
- imageIndex is the 0-based photo the entry came from.
- Skip titles, doodles, and lines that are only a daily total.
- If a photo is not a food log, return no entries for it.
- One written line is one entry.`;
}

export function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}

export function prepareWrittenLogImages(
  images: { imageBase64: string }[]
): PreparedFoodLogImage[] {
  if (!Array.isArray(images) || images.length < 1) {
    throw new WrittenLogError("Add at least one photo of your food log.");
  }
  if (images.length > MAX_WRITTEN_LOG_IMAGES) {
    throw new WrittenLogError(`You can scan up to ${MAX_WRITTEN_LOG_IMAGES} pages at a time.`);
  }

  let total = 0;
  return images.map((image, index) => {
    const { base64 } = splitDataUrl(image?.imageBase64 ?? "");
    const maxChars = Math.ceil((MAX_WRITTEN_LOG_IMAGE_BYTES * 4) / 3) + 32;
    if (base64.length > maxChars) {
      throw new WrittenLogError("Each photo needs to be under 4MB.", "PAYLOAD_TOO_LARGE");
    }
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length < 32) {
      throw new WrittenLogError("That photo looks empty. Try again closer to the page.");
    }
    if (buffer.length > MAX_WRITTEN_LOG_IMAGE_BYTES) {
      throw new WrittenLogError("Each photo needs to be under 4MB.", "PAYLOAD_TOO_LARGE");
    }
    total += buffer.length;
    if (total > MAX_WRITTEN_LOG_TOTAL_BYTES) {
      throw new WrittenLogError(
        "Those photos together are too large. Try fewer pages.",
        "PAYLOAD_TOO_LARGE"
      );
    }
    const mimeType = detectMime(buffer);
    if (!mimeType || !ALLOWED_MIME.has(mimeType)) {
      throw new WrittenLogError("Use a photo of the page (JPEG, PNG, or HEIC).");
    }
    return {
      index,
      mimeType,
      buffer,
      base64: buffer.toString("base64"),
    };
  });
}

export function normalizeWrittenLogEntries(raw: unknown, imageCount: number): WrittenLogEntry[] {
  const list = extractEntryList(raw);
  if (!list) {
    throw new WrittenLogError("The scan did not come back as a list of foods. Try a clearer photo.");
  }

  const entries: WrittenLogEntry[] = [];
  for (const item of list.slice(0, 80)) {
    const entry = normalizeOne(item, imageCount);
    if (entry) entries.push(entry);
    if (entries.length >= MAX_WRITTEN_LOG_ENTRIES) break;
  }
  return entries;
}

export function composeFoodName(
  name: string,
  portion?: string | null,
  time?: string | null
): string {
  let food = name.replace(/\s+/g, " ").trim();
  const part = portion?.replace(/\s+/g, " ").trim() ?? "";
  if (part && !food.toLowerCase().includes(part.toLowerCase())) {
    food = `${food} (${part})`;
  }
  const clock = time?.replace(/\s+/g, " ").trim() ?? "";
  if (clock && !food.toLowerCase().includes(clock.toLowerCase())) {
    food = `${clock} · ${food}`;
  }
  return food.slice(0, 500);
}

export function buildCalorieInsertRows(
  userId: number,
  logs: z.infer<typeof batchCalorieLogsSchema>["logs"]
) {
  return logs.map((log) => {
    const foodName = composeFoodName(log.foodName, log.portion, log.time);
    if (!foodName) {
      throw new WrittenLogError("Each entry needs a food name.");
    }
    return {
      userId,
      dateStr: log.dateStr,
      mealType: log.mealType,
      foodName,
      calories: Math.round(log.calories),
      protein: Math.round(log.protein),
      carbs: Math.round(log.carbs),
      fat: Math.round(log.fat),
      fiber: Math.round(log.fiber ?? 0),
      imageUrl: sanitizeImageUrl(log.imageUrl),
    };
  });
}

export async function readWrittenFoodLog(images: PreparedFoodLogImage[]): Promise<unknown> {
  const content: Array<TextPart | ImagePart> = [
    { type: "text", text: buildWrittenFoodLogPrompt(images.length) },
  ];
  for (const image of images) {
    content.push({
      type: "text",
      text: `Photo ${image.index + 1} of ${images.length}. Use imageIndex ${image.index} for entries from this photo.`,
    });
    content.push({
      type: "image",
      image: image.base64,
      mediaType: image.mimeType,
    });
  }

  const result = await generateObject({
    model: google("gemini-3.5-flash"),
    schema: writtenLogModelSchema,
    temperature: 0,
    messages: [{ role: "user", content }],
  });
  return result.object;
}

function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.length > 1000 || !/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    throw new WrittenLogError("Photo link is invalid.");
  }
  return trimmed;
}

function splitDataUrl(input: string): { declared: string | null; base64: string } {
  const trimmed = input.trim();
  const match = /^data:([^;,]+);base64,([\s\S]+)$/i.exec(trimmed);
  if (!match) {
    return { declared: null, base64: trimmed.replace(/\s/g, "") };
  }
  return { declared: match[1].toLowerCase(), base64: match[2].replace(/\s/g, "") };
}

function detectMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (["heic", "heix", "hevc", "hevx", "heim", "heis"].includes(brand)) return "image/heic";
    if (["heif", "mif1", "msf1"].includes(brand)) return "image/heif";
  }
  return null;
}

function extractEntryList(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { entries?: unknown }).entries)) {
    return (raw as { entries: unknown[] }).entries;
  }
  return null;
}

function normalizeOne(item: unknown, imageCount: number): WrittenLogEntry | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  let name = cleanText(row.foodName);
  if (!name || isTotalLine(name)) return null;

  const meal = mealTypeOf(row.mealType);
  const imageIndex = clampImageIndex(row.imageIndex, imageCount);
  const time = cleanTime(row.time);

  if (isUnreadableName(name)) {
    return acceptEntry({
      mealType: meal.meal,
      time,
      foodName: "Unreadable item",
      portion: null,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      confidence: "low",
      unclear: true,
      note: clip(cleanText(row.note) || "Could not read this item.", 200),
      imageIndex,
    });
  }

  let unclear = row.unclear === true || row.unclear === "true";
  const notes: string[] = [];
  const modelNote = cleanText(row.note);
  if (modelNote) notes.push(modelNote);
  if (meal.guessed) {
    unclear = true;
    notes.push("Meal was not written on the page.");
  }
  if (hasUnreadableMark(name)) {
    unclear = true;
    notes.push("Part of this line was hard to read.");
  }
  if (name.length > 300) {
    name = name.slice(0, 300).trim();
    unclear = true;
    notes.push("This line was shortened.");
  }

  const calories = readMacro(row.calories, 5000);
  const protein = readMacro(row.protein, 500);
  const carbs = readMacro(row.carbs, 500);
  const fat = readMacro(row.fat, 500);
  const fiber = readMacro(row.fiber, 150);

  let calorieValue = calories.value;
  if (calories.flag === "missing" || calories.flag === "invalid") {
    calorieValue = 0;
    unclear = true;
    notes.push("Calories need a check.");
  } else if (calories.flag === "high") {
    unclear = true;
    notes.push("Calorie estimate looked too high.");
  }

  const proteinValue = flaggedMacro(protein, "Protein needs a check.", notes, () => {
    unclear = true;
  });
  const carbValue = flaggedMacro(carbs, "Carbs need a check.", notes, () => {
    unclear = true;
  });
  const fatValue = flaggedMacro(fat, "Fat needs a check.", notes, () => {
    unclear = true;
  });
  let fiberValue = fiber.flag === "missing" || fiber.flag === "invalid" ? 0 : fiber.value;
  if (fiber.flag === "invalid" || fiber.flag === "high") {
    unclear = true;
    notes.push("Fiber needs a check.");
    if (fiber.flag === "invalid") fiberValue = 0;
  }

  return acceptEntry({
    mealType: meal.meal,
    time,
    foodName: name,
    portion: cleanPortion(row.portion),
    calories: calorieValue,
    protein: proteinValue,
    carbs: carbValue,
    fat: fatValue,
    fiber: fiberValue,
    confidence: confidenceOf(row.confidence, unclear),
    unclear,
    note: notes.length ? clip(notes.join(" "), 200) : null,
    imageIndex,
  });
}

function acceptEntry(entry: WrittenLogEntry): WrittenLogEntry | null {
  const parsed = writtenLogEntrySchema.safeParse(entry);
  return parsed.success ? parsed.data : null;
}

function flaggedMacro(
  macro: MacroRead,
  message: string,
  notes: string[],
  flag: () => void
): number {
  if (macro.flag === "missing") return 0;
  if (macro.flag === "invalid") {
    flag();
    notes.push(message);
    return 0;
  }
  if (macro.flag === "high") {
    flag();
    notes.push(message);
  }
  return macro.value;
}

type MacroFlag = "ok" | "missing" | "invalid" | "high";
type MacroRead = { value: number; flag: MacroFlag };

function readMacro(value: unknown, cap: number): MacroRead {
  if (value == null || value === "") return { value: 0, flag: "missing" };
  const parsed = parseLooseNumber(value);
  if (parsed == null || parsed < 0) return { value: 0, flag: "invalid" };
  const rounded = Math.round(parsed);
  if (rounded > cap) return { value: cap, flag: "high" };
  return { value: rounded, flag: "ok" };
}

function parseLooseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function mealTypeOf(value: unknown): { meal: MealType; guessed: boolean } {
  const token = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!token) return { meal: "snack", guessed: true };
  if (
    token.includes("breakfast") ||
    token === "bfast" ||
    token === "brekky" ||
    token === "brunch" ||
    token === "morning"
  ) {
    return { meal: "breakfast", guessed: false };
  }
  if (token.includes("lunch") || token === "midday" || token === "noon") {
    return { meal: "lunch", guessed: false };
  }
  if (token.includes("dinner") || token.includes("supper") || token === "evening") {
    return { meal: "dinner", guessed: false };
  }
  if (token.includes("snack")) return { meal: "snack", guessed: false };
  if (token.includes("drink") || token.includes("beverage")) {
    return { meal: "drink", guessed: false };
  }
  return { meal: "snack", guessed: true };
}

function confidenceOf(value: unknown, unclear: boolean): Confidence {
  const token = String(value ?? "").toLowerCase();
  let confidence: Confidence = token.startsWith("high")
    ? "high"
    : token.startsWith("med")
      ? "medium"
      : token.startsWith("low")
        ? "low"
        : "medium";
  if (unclear) confidence = "low";
  return confidence;
}

function clampImageIndex(value: unknown, imageCount: number): number {
  const max = Math.max(0, Math.min(MAX_WRITTEN_LOG_IMAGES, imageCount) - 1);
  const parsed = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
  if (parsed < 0) return 0;
  if (parsed > max) return max;
  return parsed;
}

function cleanTime(value: unknown): string | null {
  const raw = cleanText(value).replace(/\./g, "");
  if (!raw) return null;
  if (!/^(noon|midnight|\d{1,2}:\d{2}(?:\s*[ap]m)?|\d{1,2}\s*[ap]m)$/i.test(raw)) return null;
  return clip(raw, 40);
}

function cleanPortion(value: unknown): string | null {
  const raw = cleanText(value);
  if (!raw || /^(n\/a|na|none|unknown|unclear|\?+|-+)$/i.test(raw)) return null;
  return clip(raw, 120);
}

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max).trim() : value;
}

function isTotalLine(name: string): boolean {
  return /^(total|totals|daily total|grand total|day total|calories|kcal|protein|carbs|fat|fiber|macros|summary)$/i.test(
    name
  );
}

function isUnreadableName(name: string): boolean {
  return /^(unreadable( item)?|illegible( item)?|unknown( item)?|cannot read|can't read|not readable|\?+|n\/a|na|—|-|\.{2,})$/i.test(
    name
  );
}

function hasUnreadableMark(name: string): boolean {
  return /\?{2,}|\[illegible\]|\[unreadable\]/i.test(name);
}
