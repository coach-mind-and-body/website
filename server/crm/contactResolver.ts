// @ts-nocheck
import { sql, type SQL } from "drizzle-orm";
import { leads, conversations, users } from "../../drizzle/schema";
import { formatPhoneE164, normalizePhoneDigits } from "../../lib/phone";

export { formatPhoneE164, normalizePhoneDigits };

type Db = NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>;

/** SQL fragment matching a phone column against the last 10 digits of `targetPhone`. */
export function phoneColumnMatchSql(
  phoneColumn:
    | typeof users.phone
    | typeof leads.phone
    | typeof conversations.contactPhone,
  targetPhone: string
): SQL {
  const clean = normalizePhoneDigits(targetPhone);
  if (clean.length < 10) return sql`false`;
  const last10 = clean.slice(-10);
  return sql`REPLACE(REPLACE(REPLACE(REPLACE(${phoneColumn}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE ${`%${last10}`}`;
}

export type ResolvedContact = {
  name: string | null;
  userId: number | null;
  phone: string | null;
};

export async function resolveContactByPhone(
  db: Db,
  phone: string
): Promise<ResolvedContact> {
  const clean = normalizePhoneDigits(phone);
  if (clean.length < 10) {
    return { name: null, userId: null, phone: phone || null };
  }

  const userMatches = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(phoneColumnMatchSql(users.phone, phone))
    .limit(1);

  if (userMatches[0]?.name) {
    return {
      name: userMatches[0].name,
      userId: userMatches[0].id,
      phone,
    };
  }

  const leadMatches = await db
    .select({ name: leads.name })
    .from(leads)
    .where(phoneColumnMatchSql(leads.phone, phone))
    .limit(1);

  if (leadMatches[0]?.name) {
    return { name: leadMatches[0].name, userId: null, phone };
  }

  return { name: null, userId: null, phone };
}

/** Contact name for display (push, UI); falls back to the raw phone string. */
export async function getContactDisplayName(db: Db, phone: string): Promise<string> {
  const resolved = await resolveContactByPhone(db, phone);
  return resolved.name || phone;
}

/** Clean SMS text for lock-screen push previews (name is already in the title). */
export function formatSmsPushBody(raw: string | undefined): string {
  if (!raw?.trim()) return "Sent an attachment — tap to open";

  const text = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^from\s+utp\s+admin\s*/i, "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!text) return "New message — tap to open";
  return text.length > 140 ? `${text.slice(0, 137)}…` : text;
}

/** Resolve many phone numbers in one pass (for call logs, activity feed). */
export async function resolveContactsByPhones(
  db: Db,
  phones: string[]
): Promise<Map<string, ResolvedContact>> {
  const result = new Map<string, ResolvedContact>();
  const unique = [...new Set(phones.filter(Boolean))];

  for (const phone of unique) {
    result.set(phone, await resolveContactByPhone(db, phone));
  }

  return result;
}