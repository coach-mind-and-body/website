import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { fastingLogs } from "../drizzle/schema";
import {
  emptyFastingDay,
  fastingHoursError,
  normalizeFastingInput,
  type FastingDay,
} from "@shared/fasting";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type StoredFasting = {
  userId: number;
  dateStr: string;
  didFast: boolean;
  hours: number | string | null;
  notes: string | null;
};

function asHours(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 2) / 2;
}

function toDay(row: StoredFasting): FastingDay {
  return {
    dateStr: row.dateStr,
    didFast: Boolean(row.didFast),
    hours: asHours(row.hours),
    notes: row.notes?.trim() ? row.notes : null,
    recorded: true,
  };
}

function invalidHours(hours: number | null | undefined): TRPCError | null {
  const message = fastingHoursError(hours ?? null);
  if (!message) return null;
  return new TRPCError({ code: "BAD_REQUEST", message });
}

export async function readFastingDay(db: Db, userId: number, dateStr: string): Promise<FastingDay> {
  const rows = (await db.select().from(fastingLogs).where(eq(fastingLogs.userId, userId))) as StoredFasting[];
  const row = rows.find((item) => item.dateStr === dateStr);
  return row ? toDay(row) : emptyFastingDay(dateStr);
}

export async function listFastingDays(db: Db, userId: number, limit = 60): Promise<FastingDay[]> {
  const rows = (await db.select().from(fastingLogs).where(eq(fastingLogs.userId, userId))) as StoredFasting[];
  return rows
    .map(toDay)
    .sort((a, b) => b.dateStr.localeCompare(a.dateStr))
    .slice(0, limit);
}

export async function saveFastingDay(
  db: Db,
  userId: number,
  input: { dateStr: string; didFast: boolean; hours?: number | null; notes?: string | null }
): Promise<FastingDay> {
  const hoursError = invalidHours(input.hours);
  if (hoursError) throw hoursError;
  let day: FastingDay;
  try {
    day = normalizeFastingInput(input);
  } catch (err) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: err instanceof Error ? err.message : "Could not save fasting.",
    });
  }
  await db
    .insert(fastingLogs)
    .values({
      userId,
      dateStr: day.dateStr,
      didFast: day.didFast,
      hours: day.hours,
      notes: day.notes,
    })
    .onDuplicateKeyUpdate({
      set: {
        didFast: day.didFast,
        hours: day.hours,
        notes: day.notes,
      },
    });
  return day;
}

export async function importFastingDays(
  db: Db,
  userId: number,
  entries: { dateStr: string; didFast: boolean; hours?: number | null; notes?: string | null }[]
): Promise<number> {
  let imported = 0;
  for (const entry of entries) {
    await saveFastingDay(db, userId, entry);
    imported += 1;
  }
  return imported;
}
