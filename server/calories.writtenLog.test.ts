import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

const state = vi.hoisted(() => ({
  inserted: [] as unknown[],
  db: null as {
    insert: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  } | null,
}));

vi.mock("./db", () => ({
  getDb: vi.fn(async () => state.db),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({
    key,
    url: `https://cdn.example/${key}`,
  })),
}));

vi.mock("./writtenFoodLog", async () => {
  const actual = await vi.importActual<typeof import("./writtenFoodLog")>("./writtenFoodLog");
  return {
    ...actual,
    readWrittenFoodLog: vi.fn(),
  };
});

import { caloriesRouter } from "./routers/calories";
import { storagePut } from "./storage";
import {
  readWrittenFoodLog,
  resetWrittenLogScanAllowanceForTests,
} from "./writtenFoodLog";

function jpegDataUrl(size = 64): string {
  const buffer = Buffer.alloc(size, 0x11);
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  buffer[3] = 0xe0;
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

function authContext(): TrpcContext {
  return {
    req: new Request("https://example.com/api/trpc"),
    user: { id: 42, email: "client@example.com", role: "user" } as User,
  };
}

describe("calories written log endpoints", () => {
  beforeEach(() => {
    state.inserted = [];
    state.db = {
      insert: vi.fn(() => ({
        values: vi.fn(async (rows: unknown) => {
          state.inserted.push(rows);
        }),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => []),
        })),
      })),
    };
    resetWrittenLogScanAllowanceForTests();
    vi.mocked(storagePut).mockClear();
    vi.mocked(readWrittenFoodLog).mockReset();
  });

  it("requires a signed-in client", async () => {
    const caller = caloriesRouter.createCaller({
      req: new Request("https://example.com/api/trpc"),
      user: null,
    });
    await expect(
      caller.analyzeWrittenFoodLog({ images: [{ imageBase64: jpegDataUrl() }] })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.addLogs({
        logs: [
          {
            dateStr: "2026-01-15",
            mealType: "lunch",
            foodName: "salad",
            calories: 100,
            protein: 5,
            carbs: 8,
            fat: 4,
          },
        ],
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(readWrittenFoodLog).not.toHaveBeenCalled();
  });

  it("stores the page and returns a review list without inventing an unreadable line", async () => {
    vi.mocked(readWrittenFoodLog).mockResolvedValue({
      entries: [
        {
          mealType: "breakfast",
          time: "8:00am",
          foodName: "oatmeal",
          portion: "1 cup",
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 3,
          fiber: 4,
          confidence: "high",
          unclear: false,
          note: null,
          imageIndex: 0,
        },
        {
          mealType: "breakfast",
          foodName: "???",
          calories: 400,
          protein: 20,
          confidence: "high",
          imageIndex: 0,
        },
      ],
    });

    const caller = caloriesRouter.createCaller(authContext());
    const result = await caller.analyzeWrittenFoodLog({
      images: [{ imageBase64: jpegDataUrl() }],
    });

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      foodName: "oatmeal",
      mealType: "breakfast",
      time: "8:00am",
      portion: "1 cup",
      calories: 150,
      confidence: "high",
      unclear: false,
    });
    expect(result.entries[1]).toMatchObject({
      foodName: "Unreadable item",
      calories: 0,
      protein: 0,
      unclear: true,
      confidence: "low",
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toContain("https://cdn.example/food-logs/42/");
    expect(storagePut).toHaveBeenCalledOnce();
  });

  it("does not store a photo when nothing on the page can be read", async () => {
    vi.mocked(readWrittenFoodLog).mockResolvedValue({ entries: [] });
    const caller = caloriesRouter.createCaller(authContext());
    const result = await caller.analyzeWrittenFoodLog({
      images: [{ imageBase64: jpegDataUrl() }],
    });
    expect(result).toEqual({ entries: [], images: [] });
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("rejects a file that is not a photo before calling the model", async () => {
    const caller = caloriesRouter.createCaller(authContext());
    await expect(
      caller.analyzeWrittenFoodLog({
        images: [
          {
            imageBase64: Buffer.from("hello this is a note not a photo!!").toString("base64"),
          },
        ],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(readWrittenFoodLog).not.toHaveBeenCalled();
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("turns a model failure into a plain message", async () => {
    vi.mocked(readWrittenFoodLog).mockRejectedValue(new Error("provider down"));
    const caller = caloriesRouter.createCaller(authContext());
    await expect(
      caller.analyzeWrittenFoodLog({ images: [{ imageBase64: jpegDataUrl() }] })
    ).rejects.toThrow(/clearer photo/);
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("saves the reviewed list in one insert and keeps the photo on each row", async () => {
    const caller = caloriesRouter.createCaller(authContext());
    const result = await caller.addLogs({
      logs: [
        {
          dateStr: "2026-01-15",
          mealType: "breakfast",
          foodName: "oatmeal",
          portion: "1 cup",
          time: "8:00am",
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 3,
          fiber: 4,
          imageUrl: "https://cdn.example/food-logs/42/page.jpg",
        },
        {
          dateStr: "2026-01-16",
          mealType: "lunch",
          foodName: "Unreadable item",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          imageUrl: "https://cdn.example/food-logs/42/page.jpg",
        },
      ],
    });

    expect(result).toEqual({ success: true, saved: 2 });
    expect(state.inserted).toEqual([
      [
        {
          userId: 42,
          dateStr: "2026-01-15",
          mealType: "breakfast",
          foodName: "8:00am · oatmeal (1 cup)",
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 3,
          fiber: 4,
          imageUrl: "https://cdn.example/food-logs/42/page.jpg",
        },
        {
          userId: 42,
          dateStr: "2026-01-16",
          mealType: "lunch",
          foodName: "Unreadable item",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          imageUrl: "https://cdn.example/food-logs/42/page.jpg",
        },
      ],
    ]);
    expect(state.db?.select).toHaveBeenCalled();
  });

  it("refuses a bad photo link and an empty batch", async () => {
    const caller = caloriesRouter.createCaller(authContext());
    await expect(
      caller.addLogs({
        logs: [
          {
            dateStr: "2026-01-15",
            mealType: "snack",
            foodName: "apple",
            calories: 80,
            protein: 0,
            carbs: 20,
            fat: 0,
            imageUrl: "javascript:alert(1)",
          },
        ],
      })
    ).rejects.toThrow(/Photo link/);
    expect(state.inserted).toHaveLength(0);

    await expect(caller.addLogs({ logs: [] })).rejects.toThrow();
  });
});
