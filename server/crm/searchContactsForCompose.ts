import { and, desc, eq, like, or, sql, type AnyColumn } from "drizzle-orm";
import { getDb } from "../db";
import {
  leads,
  conversations,
  users,
} from "../../drizzle/schema";
import { normalizePhoneDigits } from "./contactResolver";
import {
  designationLabel,
  loadDesignationContext,
  resolveDesignation,
  type CrmDesignation,
} from "./contactDesignation";
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

function hitFromDesignation(
  designation: CrmDesignation,
  base: Omit<ComposeContactHit, "source" | "designation">
): ComposeContactHit {
  return {
    ...base,
    designation,
    source: designationLabel(designation),
  };
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
  const { reclaimUserIds, fpuEmails } = await loadDesignationContext(db);

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
      role: users.role,
    })
    .from(users)
    .where(nameEmailPhoneMatch(users.name, users.email, users.phone, qLower, phonePattern))
    .limit(MAX_RESULTS);

  for (const u of userRows) {
    const designation = resolveDesignation({
      userId: u.id,
      email: u.email,
      role: u.role,
      reclaimUserIds,
      fpuEmails,
    });
    addHit(
      hitFromDesignation(designation, {
        id: `user-${u.id}`,
        name: u.name || "Unknown",
        phone: u.phone,
        email: u.email,
        userId: u.id,
      })
    );
  }

  const leadRows = await db
    .select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      phone: leads.phone,
      status: leads.status,
    })
    .from(leads)
    .where(
      nameEmailPhoneMatch(
        leads.name,
        leads.email,
        leads.phone,
        qLower,
        phonePattern
      )
    )
    .limit(MAX_RESULTS);

  for (const l of leadRows) {
    const designation = resolveDesignation({
      email: l.email,
      leadStatus: l.status,
      reclaimUserIds,
      fpuEmails,
    });
    addHit(
      hitFromDesignation(designation, {
        id: `lead-${l.id}`,
        name: l.name || "Unknown",
        phone: l.phone,
        email: l.email,
        userId: null,
      })
    );
  }

  const convConditions = [
    sql`LOWER(COALESCE(${users.name}, '')) LIKE ${qLower}`,
  ];
  if (phonePattern) {
    convConditions.push(like(conversations.contactPhone, phonePattern));
  }

  const platformFilter = or(
    eq(conversations.platform, "sms"),
    eq(conversations.platform, "whatsapp")
  );
  const contactFilter =
    convConditions.length === 1 ? convConditions[0]! : or(...convConditions);

  const convRows = await db
    .select({
      convId: conversations.id,
      contactPhone: conversations.contactPhone,
      userName: users.name,
      userId: users.id,
      userEmail: users.email,
      userRole: users.role,
      platform: conversations.platform,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.userId, users.id))
    .where(and(platformFilter, contactFilter))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(MAX_RESULTS);

  for (const c of convRows) {
    const designation = resolveDesignation({
      userId: c.userId,
      email: c.userEmail,
      role: c.userRole,
      reclaimUserIds,
      fpuEmails,
    });
    const platformLabel = c.platform === "whatsapp" ? "WhatsApp" : "Recent chat";
    const source =
      designation === "customer" || designation === "lead"
        ? platformLabel
        : designationLabel(designation);
    addHit({
      id: `conv-${c.convId}`,
      name: c.userName || c.contactPhone || "Unknown",
      phone: c.contactPhone,
      email: c.userEmail,
      designation,
      source,
      userId: c.userId,
    });
  }

  return hits;
}
