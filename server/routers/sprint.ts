import { z } from "zod";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import {
  DEFAULT_SPRINT,
  SPRINT_SETTING_KEY,
  type SprintBoard,
  type SprintItem,
} from "../sprintDefaults";

const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
  notes: z.string(),
});

function parseBoard(raw: string | null | undefined): SprintBoard {
  if (!raw) return structuredClone(DEFAULT_SPRINT);
  try {
    const v = JSON.parse(raw) as Partial<SprintBoard>;
    if (!v || !Array.isArray(v.items)) return structuredClone(DEFAULT_SPRINT);
    return {
      period: typeof v.period === "string" ? v.period : DEFAULT_SPRINT.period,
      items: v.items.filter(
        (i): i is SprintItem =>
          !!i && typeof i.id === "string" && typeof i.title === "string"
      ).map((i) => ({
        id: i.id,
        title: i.title,
        done: Boolean(i.done),
        notes: typeof i.notes === "string" ? i.notes : "",
      })),
    };
  } catch {
    return structuredClone(DEFAULT_SPRINT);
  }
}

async function readBoard(): Promise<SprintBoard> {
  const db = await getDb();
  if (!db) return structuredClone(DEFAULT_SPRINT);
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, SPRINT_SETTING_KEY))
    .limit(1);
  if (rows.length === 0) {
    await db.insert(siteSettings).values({
      key: SPRINT_SETTING_KEY,
      value: JSON.stringify(DEFAULT_SPRINT),
    });
    return structuredClone(DEFAULT_SPRINT);
  }
  return parseBoard(rows[0].value);
}

async function writeBoard(board: SprintBoard) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const existing = await db
    .select({ id: siteSettings.id })
    .from(siteSettings)
    .where(eq(siteSettings.key, SPRINT_SETTING_KEY))
    .limit(1);
  const value = JSON.stringify(board);
  if (existing.length > 0) {
    await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, SPRINT_SETTING_KEY));
  } else {
    await db.insert(siteSettings).values({ key: SPRINT_SETTING_KEY, value });
  }
}

export const sprintRouter = router({
  get: adminProcedure.query(async () => readBoard()),

  toggle: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const board = await readBoard();
      board.items = board.items.map((i) =>
        i.id === input.id ? { ...i, done: !i.done } : i
      );
      await writeBoard(board);
      return board;
    }),

  updateNotes: adminProcedure
    .input(z.object({ id: z.string(), notes: z.string().max(2000) }))
    .mutation(async ({ input }) => {
      const board = await readBoard();
      board.items = board.items.map((i) =>
        i.id === input.id ? { ...i, notes: input.notes } : i
      );
      await writeBoard(board);
      return board;
    }),

  add: adminProcedure
    .input(z.object({ title: z.string().min(1).max(300) }))
    .mutation(async ({ input }) => {
      const board = await readBoard();
      board.items.push({
        id: nanoid(10),
        title: input.title.trim(),
        done: false,
        notes: "",
      });
      await writeBoard(board);
      return board;
    }),

  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const board = await readBoard();
      board.items = board.items.filter((i) => i.id !== input.id);
      await writeBoard(board);
      return board;
    }),

  save: adminProcedure
    .input(z.object({ period: z.string(), items: z.array(itemSchema) }))
    .mutation(async ({ input }) => {
      await writeBoard(input);
      return input;
    }),
});
