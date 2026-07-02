// @ts-nocheck
import { and, desc, eq, like, or, sql, type AnyColumn } from "drizzle-orm";
import { getDb } from "../db";
import {
  clientLeads,
  conversations,
  users,
  vacationQuotes,
} from "../../drizzle/schema";
import { normalizePhoneDigits } from "./contactResolver";
import type { ComposeContactHit } from "../../lib/composeRecipient";

export type { ComposeContactHit };

const MAX_RESULTS = 12;

function nameEmailPhoneMatch(
  nameCol: AnyColumn,
  emailCol: AnyColumn,
  phoneCol: AnyColumn,
  qLower: string,
  phonePattern: string | null
) {
  const conditions = [
    sql`LOWER(COALESCE(${nameCol}, '')) LIKE ${qLower}`,
    sql`LOWER(COALESCE(${emailCol}, '')) LIKE ${qLower}`,
  ];
  if (phonePattern) {
    conditions.push(
      sql`REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(${phoneCol}, ''), '-', ''), ' ', ''), '(', ''), ')', '') LIKE ${phonePattern}`
    );
  }
  return or(...conditions);
}

export async function searchContactsForCompose(
  query: string
): Promise<ComposeContactHit[]> {
  const db = await getDb();
  if (!db) return [];

  const q = query.trim();
  if (q.length < 2) return [];

  const qLower = `%${q.toLowerCase()}%`;
  const digits = q.replace(/\D/g, "");
  const phonePattern = digits.length >= 3 ? `%${digits}%` : null;

  const hits: ComposeContactHit[] = [];
  const seenKeys = new Set<string>();

  const addHit = (hit: ComposeContactHit) => {
    const key = hit.phone
      ? normalizePhoneDigits(hit.phone)
      : `id:${hit.id}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    if (hits.length < MAX_RESULTS) hits.push(hit);
  };

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      isPremium: users.isPremium,
    })
    .from(users)
    .where(nameEmailPhoneMatch(users.name, users.email, users.phone, qLower, phonePattern))
    .limit(MAX_RESULTS);

  for (const u of userRows) {
    addHit({
      id: `user-${u.id}`,
      name: u.name || "Unknown",
      phone: u.phone,
      email: u.email,
      source: u.isPremium ? "Premium" : "Customer",
      userId: u.id,
    });
  }

  const leadRows = await db
    .select({
      id: clientLeads.id,
      name: clientLeads.name,
      email: clientLeads.email,
      phone: clientLeads.phone,
    })
    .from(clientLeads)
    .where(
      nameEmailPhoneMatch(
        clientLeads.name,
        clientLeads.email,
        clientLeads.phone,
        qLower,
        phonePattern
      )
    )
    .limit(MAX_RESULTS);

  for (const l of leadRows) {
    addHit({
      id: `lead-${l.id}`,
      name: l.name || "Unknown",
      phone: l.phone,
      email: l.email,
      source: "Lead",
      userId: null,
    });
  }

  const quoteRows = await db
    .select({
      id: vacationQuotes.id,
      name: vacationQuotes.name,
      email: vacationQuotes.email,
      phone: vacationQuotes.phone,
    })
    .from(vacationQuotes)
    .where(
      nameEmailPhoneMatch(
        vacationQuotes.name,
        vacationQuotes.email,
        vacationQuotes.phone,
        qLower,
        phonePattern
      )
    )
    .limit(MAX_RESULTS);

  for (const qRow of quoteRows) {
    addHit({
      id: `quote-${qRow.id}`,
      name: qRow.name || "Unknown",
      phone: qRow.phone,
      email: qRow.email,
      source: "Quote",
      userId: null,
    });
  }

  const convConditions = [
    sql`LOWER(COALESCE(${users.name}, '')) LIKE ${qLower}`,
  ];
  if (phonePattern) {
    convConditions.push(like(conversations.contactPhone, phonePattern));
  }

  const convRows = await db
    .select({
      convId: conversations.id,
      contactPhone: conversations.contactPhone,
      userName: users.name,
      platform: conversations.platform,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.userId, users.id))
    .where(
      and(
        or(eq(conversations.platform, "sms"), eq(conversations.platform, "whatsapp")),
        or(...convConditions)
      )
    )
    .orderBy(desc(conversations.lastMessageAt))
    .limit(MAX_RESULTS);

  for (const c of convRows) {
    addHit({
      id: `conv-${c.convId}`,
      name: c.userName || c.contactPhone || "Unknown",
      phone: c.contactPhone,
      email: null,
      source: c.platform === "whatsapp" ? "WhatsApp" : "Recent chat",
      userId: null,
    });
  }

  return hits;
}