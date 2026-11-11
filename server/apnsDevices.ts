import { eq, inArray } from "drizzle-orm";
import { apnsDeviceTokens, users } from "../drizzle/schema";
import { normalizeApnsToken } from "./apns";
import { getDb } from "./db";

export class InvalidDeviceTokenError extends Error {
  constructor() {
    super("Device token must be 64 hex characters");
    this.name = "InvalidDeviceTokenError";
  }
}

type TokenUpsert = {
  upsert(userId: number, token: string): Promise<void>;
};

/** Normalize and store. The unique token row follows whichever user is signed in on that device. */
export async function assignDeviceToken(store: TokenUpsert, userId: number, raw: string): Promise<string> {
  const token = normalizeApnsToken(raw);
  if (!token) throw new InvalidDeviceTokenError();
  await store.upsert(userId, token);
  return token;
}

export async function saveDeviceToken(userId: number, raw: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return assignDeviceToken(
    {
      async upsert(nextUserId, token) {
        await db
          .insert(apnsDeviceTokens)
          .values({ userId: nextUserId, token })
          .onDuplicateKeyUpdate({ set: { userId: nextUserId, updatedAt: new Date() } });
      },
    },
    userId,
    raw
  );
}

export async function tokensForUser(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ token: apnsDeviceTokens.token })
    .from(apnsDeviceTokens)
    .where(eq(apnsDeviceTokens.userId, userId));
  return rows.map((row) => row.token);
}

export async function tokensForAdmins(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ token: apnsDeviceTokens.token })
    .from(apnsDeviceTokens)
    .innerJoin(users, eq(users.id, apnsDeviceTokens.userId))
    .where(eq(users.role, "admin"));
  return rows.map((row) => row.token);
}

export async function deleteDeviceTokens(tokens: string[]): Promise<void> {
  if (!tokens.length) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(apnsDeviceTokens).where(inArray(apnsDeviceTokens.token, tokens));
}
