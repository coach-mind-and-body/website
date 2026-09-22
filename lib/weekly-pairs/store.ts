import mysql from "mysql2/promise";
import type { Member, Rsvp, Week } from "./schema";

export type DbData = {
  members: Member[];
  weeks: Week[];
  rsvps: Rsvp[];
  nextId: { members: number; weeks: number; rsvps: number };
};

function empty(): DbData {
  return {
    members: [],
    weeks: [],
    rsvps: [],
    nextId: { members: 1, weeks: 1, rsvps: 1 },
  };
}

async function withConn<T>(fn: (c: mysql.Connection) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const c = await mysql.createConnection(url);
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS weekly_pairs_store (
        id int NOT NULL PRIMARY KEY,
        json longtext NOT NULL
      )
    `);
    return await fn(c);
  } finally {
    await c.end();
  }
}

async function readAsync(): Promise<DbData> {
  return withConn(async (c) => {
    const [rows] = await c.query("SELECT json FROM weekly_pairs_store WHERE id = 1");
    const list = rows as { json: string }[];
    if (!list[0]?.json) return empty();
    try {
      const parsed = JSON.parse(list[0].json) as DbData;
      if (!parsed.members || !parsed.weeks || !parsed.rsvps || !parsed.nextId) return empty();
      return parsed;
    } catch {
      return empty();
    }
  });
}

async function writeAsync(data: DbData) {
  const json = JSON.stringify(data);
  await withConn(async (c) => {
    await c.query(
      "INSERT INTO weekly_pairs_store (id, json) VALUES (1, ?) ON DUPLICATE KEY UPDATE json = VALUES(json)",
      [json]
    );
  });
}

let cache: DbData | null = null;
let chain: Promise<unknown> = Promise.resolve();

export function readStore(): DbData {
  if (!cache) {
    throw new Error("weekly pairs store not loaded — call mutateStore or dbReady first");
  }
  return cache;
}

export function mutateStore<T>(fn: (data: DbData) => T): Promise<T> {
  const run = chain.then(async () => {
    const data = cache ?? (await readAsync());
    const result = fn(data);
    cache = data;
    await writeAsync(data);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function loadStore(): Promise<DbData> {
  if (!cache) cache = await readAsync();
  return cache;
}
