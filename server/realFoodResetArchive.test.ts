import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTableName, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { REAL_FOOD_RESET, REAL_FOOD_RESET_THEME } from "@shared/realFoodReset";
import { challenges, userChallenges } from "../drizzle/schema";

const clock = vi.hoisted(() => ({ today: "2026-09-29" }));

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../lib/mountainTime", async () => {
  const actual = await vi.importActual<typeof import("../lib/mountainTime")>("../lib/mountainTime");
  return {
    ...actual,
    todayMountainDateStr: () => clock.today,
    nowMountain: () => `${clock.today}T12:00`,
  };
});

vi.mock("./emailMarketing", async () => {
  const actual = await vi.importActual<typeof import("./emailMarketing")>("./emailMarketing");
  return {
    ...actual,
    sendMarketingEmail: vi.fn(async () => {
      throw new Error("email should not send");
    }),
  };
});

vi.mock("./resendSubscribe", () => ({
  resendSubscribe: vi.fn(async () => {
    throw new Error("resend should not be called");
  }),
}));

vi.mock("./metaCapi", () => ({
  fireMetaPixelLead: vi.fn(async () => {
    throw new Error("pixel should not fire");
  }),
}));

import { getDb } from "./db";
import { sendMarketingEmail } from "./emailMarketing";
import { fireMetaPixelLead } from "./metaCapi";
import { resendSubscribe } from "./resendSubscribe";
import {
  enrollRealFoodResetByEmail,
  ensureRealFoodResetChallenge,
  getChallengeToday,
} from "./realFoodResetChallenge";
import { challengesRouter } from "./routers/challenges";
import { leadgenRouter } from "./routers/leadgen";

type Row = Record<string, unknown>;

const dialect = new MySqlDialect();

function predicates(condition: unknown): { column: string; value: unknown }[] {
  const query = dialect.sqlToQuery(condition as SQL);
  const parts = query.sql.split(/\band\b/i);
  const preds: { column: string; value: unknown }[] = [];
  let paramIndex = 0;
  for (const part of parts) {
    const columns = [...part.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    const placeholders = part.match(/\?/g)?.length ?? 0;
    if (columns.length > 0 && placeholders === 1) {
      preds.push({
        column: columns[columns.length - 1],
        value: query.params[paramIndex],
      });
    }
    paramIndex += placeholders;
  }
  if (preds.length === 0) {
    throw new Error(`Unparsed where: ${query.sql} ${JSON.stringify(query.params)}`);
  }
  return preds;
}

function same(left: unknown, right: unknown) {
  if (left === right) return true;
  if (typeof left === "boolean" && (right === 0 || right === 1)) return left === (right === 1);
  if (typeof right === "boolean" && (left === 0 || left === 1)) return right === (left === 1);
  return false;
}

function memoryDb() {
  const tables = new Map<string, Row[]>();
  const updates: Row[] = [];

  function store(table: unknown): Row[] {
    const name = getTableName(table as never);
    let rows = tables.get(name);
    if (!rows) {
      rows = [];
      tables.set(name, rows);
    }
    return rows;
  }

  function matching(table: unknown, condition: unknown): Row[] {
    const preds = predicates(condition);
    return store(table).filter((row) => preds.every((pred) => same(row[pred.column], pred.value)));
  }

  const db = {
    select() {
      return {
        from(table: unknown) {
          return {
            where(condition: unknown) {
              const rows = matching(table, condition).map((row) => ({ ...row }));
              return Object.assign(Promise.resolve(rows), {
                limit: async (n: number) => rows.slice(0, n),
              });
            },
          };
        },
      };
    },
    update(table: unknown) {
      return {
        set(values: Row) {
          return {
            async where(condition: unknown) {
              updates.push({ ...values });
              for (const row of matching(table, condition)) Object.assign(row, values);
            },
          };
        },
      };
    },
    insert(table: unknown) {
      return {
        async values(row: Row) {
          const rows = store(table);
          const id = rows.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
          rows.push({ id, ...row });
          return [{ insertId: id }];
        },
      };
    },
    async execute() {
      return [];
    },
  };

  return { db, store, updates };
}

let mem: ReturnType<typeof memoryDb>;

function seedReset(overrides: Row = {}) {
  mem.store(challenges).push({
    id: 4,
    title: "Old title",
    description: "old",
    durationDays: 5,
    startDate: REAL_FOOD_RESET.startDate,
    endDate: REAL_FOOD_RESET.endDate,
    themeTag: REAL_FOOD_RESET_THEME,
    meetUrl: REAL_FOOD_RESET.meetUrl,
    isFeatured: false,
    featuredOrder: 9,
    isActive: true,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    ...overrides,
  });
}

function seedOtherChallenge() {
  mem.store(challenges).push({
    id: 2,
    title: "Water week",
    description: null,
    durationDays: 7,
    startDate: null,
    endDate: null,
    themeTag: null,
    meetUrl: null,
    isFeatured: false,
    featuredOrder: 0,
    isActive: true,
    createdAt: new Date("2026-08-01T00:00:00Z"),
  });
}

function seedEnrollment() {
  mem.store(userChallenges).push({
    id: 9,
    challengeId: 4,
    userId: 5,
    email: "already@example.com",
    deviceId: null,
    claimToken: "existing-token",
    startDate: REAL_FOOD_RESET.startDate,
    status: "active",
  });
}

function caller() {
  return {
    challenges: challengesRouter.createCaller({
      user: null,
      req: new Request("https://mindandbodyresetcoach.com/habit-tracker"),
    }),
    leadgen: leadgenRouter.createCaller({
      user: null,
      req: new Request("https://mindandbodyresetcoach.com/real-food-reset"),
    }),
  };
}

beforeEach(() => {
  clock.today = "2026-09-29";
  mem = memoryDb();
  vi.mocked(getDb).mockReset();
  vi.mocked(getDb).mockResolvedValue(mem.db as never);
  vi.mocked(sendMarketingEmail).mockClear();
  vi.mocked(resendSubscribe).mockClear();
  vi.mocked(fireMetaPixelLead).mockClear();
});

describe("ensureRealFoodResetChallenge", () => {
  it("does not overwrite isActive or isFeatured on an existing row", async () => {
    seedReset({ isActive: false, isFeatured: false, title: "Old title" });

    const id = await ensureRealFoodResetChallenge();

    expect(id).toBe(4);
    expect(mem.updates).toHaveLength(1);
    expect(mem.updates[0]).not.toHaveProperty("isActive");
    expect(mem.updates[0]).not.toHaveProperty("isFeatured");
    const row = mem.store(challenges).find((item) => item.id === 4);
    expect(row).toMatchObject({
      isActive: false,
      isFeatured: false,
      title: REAL_FOOD_RESET.name,
      endDate: REAL_FOOD_RESET.endDate,
    });
  });

  it("sets isActive and isFeatured only when inserting", async () => {
    const id = await ensureRealFoodResetChallenge();

    expect(mem.updates).toHaveLength(0);
    const row = mem.store(challenges).find((item) => item.id === id);
    expect(row).toMatchObject({
      isActive: true,
      isFeatured: true,
      themeTag: REAL_FOOD_RESET_THEME,
      endDate: REAL_FOOD_RESET.endDate,
    });
  });
});

describe("hidden challenges", () => {
  it("hides an enrolled challenge the day after endDate", async () => {
    clock.today = "2026-10-03";
    seedReset({ isActive: true, isFeatured: true });
    seedOtherChallenge();
    seedEnrollment();

    const today = await getChallengeToday({ userId: 5 });
    const active = await caller().challenges.getActiveChallenges();

    expect(today.enrolled).toBe(false);
    expect(today.afterEnd).toBe(true);
    expect(today.userChallengeId).toBeNull();
    expect(active.map((row) => row.title)).toEqual(["Water week"]);
    expect(mem.store(userChallenges)).toHaveLength(1);
  });

  it("keeps the challenge visible on its end date", async () => {
    clock.today = REAL_FOOD_RESET.endDate;
    seedReset({ isActive: true, isFeatured: true });
    seedEnrollment();

    const today = await getChallengeToday({ userId: 5 });
    const active = await caller().challenges.getActiveChallenges();

    expect(today.enrolled).toBe(true);
    expect(today.afterEnd).toBe(false);
    expect(active.map((row) => row.id)).toContain(4);
  });

  it("hides an inactive challenge during the window", async () => {
    clock.today = "2026-09-29";
    seedReset({ isActive: false, isFeatured: true });
    seedOtherChallenge();
    seedEnrollment();

    const today = await getChallengeToday({ userId: 5, email: "already@example.com" });
    const active = await caller().challenges.getActiveChallenges();

    expect(today.enrolled).toBe(false);
    expect(today.afterEnd).toBe(false);
    expect(active.map((row) => row.title)).toEqual(["Water week"]);
    expect(mem.store(challenges).find((row) => row.id === 4)?.isActive).toBe(false);
    expect(mem.store(userChallenges)).toHaveLength(1);
  });
});

describe("closed signup", () => {
  it("rejects enroll and the public route after endDate", async () => {
    clock.today = "2026-10-03";
    seedReset({ isActive: true });
    seedEnrollment();

    await expect(enrollRealFoodResetByEmail("new@example.com")).rejects.toThrow(
      "This challenge has ended."
    );
    await expect(
      caller().leadgen.subscribeRealFoodReset({
        email: "new@example.com",
        firstName: "New",
        contentName: REAL_FOOD_RESET.name,
      })
    ).rejects.toThrow("This challenge has ended.");

    expect(mem.store(userChallenges)).toHaveLength(1);
    expect(sendMarketingEmail).not.toHaveBeenCalled();
    expect(resendSubscribe).not.toHaveBeenCalled();
    expect(fireMetaPixelLead).not.toHaveBeenCalled();
  });

  it("rejects signup when the challenge is inactive", async () => {
    clock.today = "2026-09-30";
    seedReset({ isActive: false });

    await expect(enrollRealFoodResetByEmail("new@example.com")).rejects.toThrow(
      "This challenge isn't open right now."
    );
    expect(mem.store(userChallenges)).toHaveLength(0);
  });
});
