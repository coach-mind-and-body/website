import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTableName } from "drizzle-orm";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import {
  HOLIDAY_ONBOARDING_SEQUENCE_ID,
  METABOLIC_ONBOARDING_SEQUENCE_ID,
} from "@shared/programs";
import { sequenceEnrollments, subscribers } from "../drizzle/schema";
import { getDb } from "./db";
import { enrollUserInSequence } from "./sequences";

type Row = Record<string, unknown>;

function memoryDb(seed?: { subs?: Row[]; enrollments?: Row[] }) {
  const subs: Row[] = [...(seed?.subs ?? [])];
  const enrollments: Row[] = [...(seed?.enrollments ?? [])];

  function sqlParams(node: unknown, out: unknown[] = []): unknown[] {
    if (!node || typeof node !== "object") return out;
    const rec = node as {
      value?: unknown;
      queryChunks?: unknown[];
      encoder?: unknown;
    };
    if (rec.encoder && "value" in rec && !rec.queryChunks) out.push(rec.value);
    if (Array.isArray(rec.queryChunks)) {
      for (const chunk of rec.queryChunks) sqlParams(chunk, out);
    }
    return out;
  }

  function rowsFor(table: unknown, condition: unknown): Row[] {
    const name = getTableName(table as never);
    const values = sqlParams(condition);
    if (name === getTableName(subscribers)) {
      return subs.filter(row => values.includes(row.email));
    }
    if (name === getTableName(sequenceEnrollments)) {
      return enrollments.filter(
        row => values.includes(row.userId) && values.includes(row.sequenceId)
      );
    }
    return [];
  }

  const db = {
    select() {
      return {
        from(table: unknown) {
          return {
            where(condition: unknown) {
              return {
                limit: async () => rowsFor(table, condition),
              };
            },
          };
        },
      };
    },
    insert(table: unknown) {
      return {
        values(row: Row) {
          const name = getTableName(table as never);
          if (name === getTableName(subscribers)) {
            const created = { id: subs.length + 1, ...row };
            subs.push(created);
            return { $returningId: async () => [{ id: created.id }] };
          }
          const id = enrollments.length + 1;
          enrollments.push({
            id,
            status: "active",
            ...row,
          });
          return { $returningId: async () => [{ id }] };
        },
      };
    },
  };

  return { db, subs, enrollments };
}

describe("enrollUserInSequence", () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset();
  });

  it("schedules each program once and does not insert a second row", async () => {
    const mem = memoryDb();
    vi.mocked(getDb).mockResolvedValue(mem.db as never);

    const first = await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      METABOLIC_ONBOARDING_SEQUENCE_ID
    );
    const again = await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      METABOLIC_ONBOARDING_SEQUENCE_ID
    );
    const holiday = await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      HOLIDAY_ONBOARDING_SEQUENCE_ID
    );
    const holidayAgain = await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      HOLIDAY_ONBOARDING_SEQUENCE_ID
    );

    expect(first).toBe(true);
    expect(again).toBe(true);
    expect(holiday).toBe(true);
    expect(holidayAgain).toBe(true);
    expect(mem.subs).toHaveLength(1);
    expect(mem.enrollments.map(row => row.sequenceId)).toEqual([
      METABOLIC_ONBOARDING_SEQUENCE_ID,
      HOLIDAY_ONBOARDING_SEQUENCE_ID,
    ]);
    expect(mem.enrollments[0]).toMatchObject({
      currentStepId: 0,
      status: "active",
    });
  });

  it("does not reopen a finished or stopped series", async () => {
    const mem = memoryDb({
      subs: [{ id: 4, email: "ada@example.com", firstName: "Ada" }],
      enrollments: [
        {
          id: 9,
          userId: 4,
          sequenceId: METABOLIC_ONBOARDING_SEQUENCE_ID,
          status: "completed",
          currentStepId: 7,
        },
      ],
    });
    vi.mocked(getDb).mockResolvedValue(mem.db as never);

    await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      METABOLIC_ONBOARDING_SEQUENCE_ID
    );

    expect(mem.enrollments).toHaveLength(1);
    expect(mem.enrollments[0].status).toBe("completed");
    expect(mem.enrollments[0].currentStepId).toBe(7);
  });
});
