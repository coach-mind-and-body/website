import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";
import { fastingHoursError, normalizeFastingInput } from "@shared/fasting";

type Row = {
  userId: number;
  dateStr: string;
  didFast: boolean;
  hours: number | null;
  notes: string | null;
};

const state = vi.hoisted(() => ({
  rows: [] as Row[],
}));

function memoryDb() {
  return {
    insert: () => ({
      values: (value: Row) => ({
        onDuplicateKeyUpdate: async ({ set }: { set: Partial<Row> }) => {
          const hit = state.rows.find((row) => row.userId === value.userId && row.dateStr === value.dateStr);
          if (hit) Object.assign(hit, set);
          else state.rows.push({ ...value });
        },
      }),
    }),
    select: () => ({
      from: () => ({
        where: async () => state.rows.map((row) => ({ ...row })),
      }),
    }),
  };
}

vi.mock("./db", () => ({
  getDb: vi.fn(async () => memoryDb()),
}));

import { caloriesRouter } from "./routers/calories";

function authContext(): TrpcContext {
  return {
    req: new Request("https://example.com/api/trpc"),
    user: { id: 7, email: "client@example.com", role: "user" } as User,
  };
}

describe("fasting hours", () => {
  it("accepts whole hours and halves", () => {
    expect(fastingHoursError(16)).toBeNull();
    expect(fastingHoursError(18.5)).toBeNull();
    expect(normalizeFastingInput({ dateStr: "2026-11-17", didFast: true, hours: 18.5, notes: "  easy  " })).toEqual({
      dateStr: "2026-11-17",
      didFast: true,
      hours: 18.5,
      notes: "easy",
      recorded: true,
    });
  });

  it("drops hours when she did not fast", () => {
    expect(normalizeFastingInput({ dateStr: "2026-11-17", didFast: false, hours: 16, notes: "" })).toMatchObject({
      didFast: false,
      hours: null,
      notes: null,
    });
  });

  it("rejects a quarter hour", () => {
    expect(fastingHoursError(18.25)).toMatch(/halves/);
  });
});

describe("calories fasting procedures", () => {
  beforeEach(() => {
    state.rows = [];
  });

  it("requires a signed-in client", async () => {
    const caller = caloriesRouter.createCaller({
      req: new Request("https://example.com/api/trpc"),
      user: null,
    });
    await expect(caller.getFasting({ dateStr: "2026-11-17" })).rejects.toThrow();
  });

  it("saves one row per day and edits it in place", async () => {
    const caller = caloriesRouter.createCaller(authContext());
    const saved = await caller.saveFasting({
      dateStr: "2026-11-17",
      didFast: true,
      hours: 18.5,
      notes: "Stopped at dinner",
    });
    expect(saved).toMatchObject({ didFast: true, hours: 18.5, notes: "Stopped at dinner", recorded: true });

    await caller.saveFasting({
      dateStr: "2026-11-17",
      didFast: true,
      hours: 16,
      notes: "Shorter",
    });
    expect(state.rows).toHaveLength(1);

    const day = await caller.getFasting({ dateStr: "2026-11-17" });
    expect(day).toMatchObject({ didFast: true, hours: 16, notes: "Shorter", recorded: true });

    const empty = await caller.getFasting({ dateStr: "2026-11-16" });
    expect(empty.recorded).toBe(false);
  });

  it("clears hours when the answer is no", async () => {
    const caller = caloriesRouter.createCaller(authContext());
    await caller.saveFasting({ dateStr: "2026-11-17", didFast: true, hours: 14, notes: null });
    const saved = await caller.saveFasting({ dateStr: "2026-11-17", didFast: false, hours: 14, notes: "Ate breakfast" });
    expect(saved.hours).toBeNull();
    expect(saved.didFast).toBe(false);
    expect(saved.notes).toBe("Ate breakfast");
  });

  it("rejects hours that are not halves", async () => {
    const caller = caloriesRouter.createCaller(authContext());
    await expect(
      caller.saveFasting({ dateStr: "2026-11-17", didFast: true, hours: 18.25, notes: null })
    ).rejects.toThrow(/halves/);
    expect(state.rows).toHaveLength(0);
  });

  it("imports guest days and updates a day that is already stored", async () => {
    const caller = caloriesRouter.createCaller(authContext());
    const first = await caller.importGuestFasting({
      entries: [
        { dateStr: "2026-11-16", didFast: true, hours: 12, notes: "First" },
        { dateStr: "2026-11-17", didFast: false, hours: null, notes: null },
      ],
    });
    expect(first.imported).toBe(2);
    const second = await caller.importGuestFasting({
      entries: [{ dateStr: "2026-11-16", didFast: true, hours: 18.5, notes: "Updated" }],
    });
    expect(second.imported).toBe(1);
    expect(state.rows).toHaveLength(2);
    const day = await caller.getFasting({ dateStr: "2026-11-16" });
    expect(day.hours).toBe(18.5);
    expect(day.notes).toBe("Updated");
  });
});
