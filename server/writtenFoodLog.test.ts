import { describe, expect, it, beforeEach } from "vitest";
import {
  assertWrittenLogScanAllowance,
  buildCalorieInsertRows,
  buildWrittenFoodLogPrompt,
  composeFoodName,
  normalizeWrittenLogEntries,
  prepareWrittenLogImages,
  resetWrittenLogScanAllowanceForTests,
  WRITTEN_LOG_DAILY_LIMIT,
  WrittenLogError,
} from "./writtenFoodLog";

function jpegBuffer(size = 64): Buffer {
  const buffer = Buffer.alloc(size, 0x11);
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  buffer[3] = 0xe0;
  return buffer;
}

function pngBuffer(): Buffer {
  const buffer = Buffer.alloc(48, 0x22);
  buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  return buffer;
}

describe("written food log prompt", () => {
  it("tells the model not to invent foods and to flag unreadable lines", () => {
    const prompt = buildWrittenFoodLogPrompt(2);
    expect(prompt).toContain("2 pages");
    expect(prompt).toContain("Do not invent");
    expect(prompt).toContain("Unreadable item");
    expect(prompt).toContain("unclear");
    expect(buildWrittenFoodLogPrompt(1)).toContain("1 page");
  });
});

describe("prepareWrittenLogImages", () => {
  it("accepts a jpeg data url and a png that was mislabeled as jpeg", () => {
    const jpeg = `data:image/jpg;base64,${jpegBuffer().toString("base64")}`;
    const png = `data:image/jpeg;base64,${pngBuffer().toString("base64")}`;
    const prepared = prepareWrittenLogImages([{ imageBase64: jpeg }, { imageBase64: png }]);
    expect(prepared.map((image) => image.mimeType)).toEqual(["image/jpeg", "image/png"]);
    expect(prepared[0].index).toBe(0);
    expect(prepared[1].base64).toBe(pngBuffer().toString("base64"));
  });

  it("accepts heic and webp from their file headers", () => {
    const heic = Buffer.alloc(40, 0);
    heic.write("ftyp", 4, "ascii");
    heic.write("heic", 8, "ascii");
    const webp = Buffer.alloc(40, 0);
    webp.write("RIFF", 0, "ascii");
    webp.write("WEBP", 8, "ascii");
    const prepared = prepareWrittenLogImages([
      { imageBase64: heic.toString("base64") },
      { imageBase64: webp.toString("base64") },
    ]);
    expect(prepared.map((image) => image.mimeType)).toEqual(["image/heic", "image/webp"]);
  });

  it("rejects a text file, an empty photo, too many pages, and oversized pages", () => {
    expect(() =>
      prepareWrittenLogImages([
        { imageBase64: Buffer.from("this is definitely not a photo of a log").toString("base64") },
      ])
    ).toThrow(/photo/i);

    expect(() => prepareWrittenLogImages([{ imageBase64: jpegBuffer(8).toString("base64") }])).toThrow(
      /empty/i
    );

    expect(() =>
      prepareWrittenLogImages(
        Array.from({ length: 5 }, () => ({ imageBase64: jpegBuffer().toString("base64") }))
      )
    ).toThrow(/4 pages/);

    const huge = jpegBuffer(4 * 1024 * 1024 + 50);
    expect(() => prepareWrittenLogImages([{ imageBase64: huge.toString("base64") }])).toThrow(
      WrittenLogError
    );
    try {
      prepareWrittenLogImages([{ imageBase64: huge.toString("base64") }]);
    } catch (error) {
      expect(error).toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    }
  });
});

describe("normalizeWrittenLogEntries", () => {
  const readable = {
    mealType: "supper",
    time: "7:30pm",
    foodName: "chiken",
    portion: "1 breast",
    calories: 280.4,
    protein: 35,
    carbs: 0,
    fat: 8,
    fiber: 0,
    confidence: "high",
    unclear: true,
    note: "Spelling was messy",
    imageIndex: 0,
  };

  it("keeps a readable misspelling, maps supper to dinner, and flags it instead of inventing a new food", () => {
    const [entry] = normalizeWrittenLogEntries({ entries: [readable] }, 1);
    expect(entry).toMatchObject({
      mealType: "dinner",
      time: "7:30pm",
      foodName: "chiken",
      portion: "1 breast",
      calories: 280,
      protein: 35,
      confidence: "low",
      unclear: true,
      imageIndex: 0,
    });
    expect(entry.note).toContain("Spelling was messy");
  });

  it("zeros macros for an unreadable line even if the model invented numbers", () => {
    const [entry] = normalizeWrittenLogEntries(
      [
        {
          mealType: "lunch",
          foodName: "???",
          calories: 640,
          protein: 40,
          carbs: 50,
          fat: 20,
          fiber: 4,
          confidence: "high",
          unclear: false,
          imageIndex: 9,
        },
      ],
      2
    );
    expect(entry).toMatchObject({
      mealType: "lunch",
      foodName: "Unreadable item",
      portion: null,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      confidence: "low",
      unclear: true,
      imageIndex: 1,
    });
  });

  it("drops blank lines and daily totals, flags an unknown meal, and keeps a second identical food", () => {
    const entries = normalizeWrittenLogEntries(
      {
        entries: [
          { foodName: "   ", mealType: "snack" },
          { foodName: "Daily total", mealType: "snack", calories: 1800 },
          { foodName: "Greek yogurt", mealType: "xyz", portion: "n/a", time: "later", calories: 120, protein: "17g" },
          { foodName: "Greek yogurt", mealType: "snack", calories: 120, protein: 17 },
        ],
      },
      1
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      mealType: "snack",
      foodName: "Greek yogurt",
      portion: null,
      time: null,
      calories: 120,
      protein: 17,
      unclear: true,
    });
    expect(entries[0].note).toContain("Meal was not written");
    expect(entries[1].foodName).toBe("Greek yogurt");
    expect(entries[1].unclear).toBe(false);
  });

  it("caps a wild calorie guess and stops at 40 entries", () => {
    const [high] = normalizeWrittenLogEntries(
      [{ foodName: "pasta", mealType: "dinner", calories: 90000, protein: 20 }],
      1
    );
    expect(high.calories).toBe(5000);
    expect(high.unclear).toBe(true);
    expect(high.note).toContain("too high");

    const many = Array.from({ length: 50 }, (_, index) => ({
      foodName: `item ${index}`,
      mealType: "snack",
      calories: 10,
    }));
    expect(normalizeWrittenLogEntries(many, 1)).toHaveLength(40);
  });

  it("rejects a payload that is not a list", () => {
    expect(() => normalizeWrittenLogEntries({ nope: true }, 1)).toThrow(/list of foods/);
  });
});

describe("batch calorie rows", () => {
  it("folds time and portion into the saved name and keeps the private photo key", () => {
    const rows = buildCalorieInsertRows(7, [
      {
        dateStr: "2026-01-15",
        mealType: "breakfast",
        foodName: "eggs",
        portion: "2",
        time: "7:30am",
        calories: 140.2,
        protein: 12,
        carbs: 1,
        fat: 10,
        imageUrl: " food-logs/7/page.jpg ",
      },
    ]);
    expect(rows[0]).toEqual({
      userId: 7,
      dateStr: "2026-01-15",
      mealType: "breakfast",
      foodName: "7:30am · eggs (2)",
      calories: 140,
      protein: 12,
      carbs: 1,
      fat: 10,
      fiber: 0,
      imageUrl: "food-logs/7/page.jpg",
    });
  });

  it("does not repeat a portion or time already written in the name", () => {
    expect(composeFoodName("2 eggs", "2 eggs", "8am")).toBe("8am · 2 eggs");
    expect(composeFoodName("8am · oatmeal", null, "8am")).toBe("8am · oatmeal");
  });

  it("rejects a public photo address and another person's key, and ignores a blank one", () => {
    expect(() =>
      buildCalorieInsertRows(1, [
        {
          dateStr: "2026-01-15",
          mealType: "snack",
          foodName: "apple",
          calories: 80,
          protein: 0,
          carbs: 20,
          fat: 0,
          imageUrl: "https://cdn.example/food-logs/1/page.jpg",
        },
      ])
    ).toThrow(/Photo link/);

    expect(() =>
      buildCalorieInsertRows(1, [
        {
          dateStr: "2026-01-15",
          mealType: "snack",
          foodName: "apple",
          calories: 80,
          protein: 0,
          carbs: 20,
          fat: 0,
          imageUrl: "food-logs/7/page.jpg",
        },
      ])
    ).toThrow(/Photo link/);

    const [row] = buildCalorieInsertRows(1, [
      {
        dateStr: "2026-01-15",
        mealType: "snack",
        foodName: "apple",
        calories: 80,
        protein: 0,
        carbs: 20,
        fat: 0,
        imageUrl: "  ",
      },
    ]);
    expect(row.imageUrl).toBeNull();
  });

  it("keeps the saved name inside the database limit", () => {
    const name = composeFoodName("a".repeat(480), "with a very long portion note", "7:00am");
    expect(name.length).toBeLessThanOrEqual(500);
    expect(name.startsWith("7:00am · ")).toBe(true);
  });
});

describe("scan allowance", () => {
  beforeEach(() => {
    resetWrittenLogScanAllowanceForTests();
  });

  it("allows a day's worth of scans and then stops", () => {
    for (let i = 0; i < WRITTEN_LOG_DAILY_LIMIT; i += 1) {
      assertWrittenLogScanAllowance(4, new Date("2026-11-10T12:00:00Z"));
    }
    expect(() => assertWrittenLogScanAllowance(4, new Date("2026-11-10T18:00:00Z"))).toThrow(
      /Daily scan limit/
    );
    expect(() => assertWrittenLogScanAllowance(4, new Date("2026-11-11T00:10:00Z"))).not.toThrow();
  });
});
