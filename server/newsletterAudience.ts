/**
 * Resolve newsletter recipients for finance / health / snack_hack / all audiences.
 */
import { and, eq, inArray, isNotNull, ne } from "drizzle-orm";
import {
  enrollments,
  fpuLeads,
  leads,
  subscribers,
  users,
} from "../drizzle/schema";
import type { getDb } from "./db";
import { isEmailOptedOut, parseSegments } from "./emailMarketing";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Segment flag for manually managed finance newsletter list */
export const NEWSLETTER_FINANCE_SEGMENT = "newsletter_finance";

export type NewsletterAudienceGroup = "finance" | "health" | "all" | "snack_hack";

export type NewsletterRecipient = {
  email: string;
  firstName: string;
  source: string;
};

export type AudienceResolveOptions = {
  audienceGroup: NewsletterAudienceGroup;
  excludeEnrolled?: boolean;
  excludeEmails?: string[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function firstNameFrom(name: string | null | undefined, email: string): string {
  if (name?.trim()) {
    const part = name.trim().split(/\s+/)[0];
    if (part && !part.includes("@")) return part;
  }
  const local = email.split("@")[0] || "friend";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function isFinanceSegment(segments: string[]): boolean {
  return segments.some(
    (s) =>
      s === "fpu" ||
      s === NEWSLETTER_FINANCE_SEGMENT ||
      s.startsWith("fpu_") ||
      s.includes("financial") ||
      s === "fpu_interest"
  );
}

function isSnackHackSegment(segments: string[]): boolean {
  return segments.some(
    (s) =>
      s === "leadgen_snack_hack" ||
      s.includes("snack_hack") ||
      s.includes("snack-hack")
  );
}

function isHealthSegment(segments: string[]): boolean {
  if (segments.length === 0) return true;
  if (
    isFinanceSegment(segments) &&
    segments.every((s) => isFinanceSegment([s]) || s === "email_opt_out")
  ) {
    return false;
  }
  return true;
}

/**
 * Build the full recipient list for a newsletter send.
 * Always skips opted-out emails and invalid addresses.
 */
export async function resolveNewsletterAudience(
  db: Db,
  opts: AudienceResolveOptions
): Promise<NewsletterRecipient[]> {
  const excludeSet = new Set(
    (opts.excludeEmails ?? []).map(normalizeEmail).filter(Boolean)
  );

  let enrolledEmails = new Set<string>();
  if (opts.excludeEnrolled) {
    const enrolledRows = await db
      .select({ email: users.email })
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.userId))
      .where(
        and(
          eq(enrollments.program, "reclaim"),
          inArray(enrollments.status, ["pending", "active", "completed"])
        )
      );
    enrolledEmails = new Set(
      enrolledRows
        .map((r) => (r.email ? normalizeEmail(r.email) : ""))
        .filter(Boolean)
    );
  }

  const map = new Map<string, NewsletterRecipient>();

  const add = (
    emailRaw: string | null | undefined,
    name: string | null | undefined,
    source: string,
    allow: boolean
  ) => {
    if (!allow || !emailRaw) return;
    const email = normalizeEmail(emailRaw);
    if (!EMAIL_RE.test(email)) return;
    if (excludeSet.has(email)) return;
    if (opts.excludeEnrolled && enrolledEmails.has(email)) return;
    if (map.has(email)) {
      const existing = map.get(email)!;
      const next = firstNameFrom(name, email);
      if (
        existing.firstName.toLowerCase() === email.split("@")[0].toLowerCase() &&
        name?.trim()
      ) {
        existing.firstName = next;
      }
      return;
    }
    map.set(email, {
      email,
      firstName: firstNameFrom(name, email),
      source,
    });
  };

  const [allSubs, allFpu, allLeads, allUsers] = await Promise.all([
    db.select().from(subscribers),
    db.select().from(fpuLeads),
    db.select().from(leads),
    db
      .select({ email: users.email, name: users.name, role: users.role })
      .from(users)
      .where(and(isNotNull(users.email), ne(users.email, ""))),
  ]);

  const group = opts.audienceGroup;

  for (const sub of allSubs) {
    if (isEmailOptedOut(sub.segments)) continue;
    const segs = parseSegments(sub.segments);
    const name =
      [sub.firstName, sub.lastName].filter(Boolean).join(" ") || sub.firstName;

    if (group === "all") {
      add(sub.email, name, "subscriber", true);
    } else if (group === "finance") {
      add(sub.email, name, "subscriber:finance", isFinanceSegment(segs));
    } else if (group === "snack_hack") {
      add(sub.email, name, "subscriber:snack_hack", isSnackHackSegment(segs));
    } else {
      add(sub.email, name, "subscriber:health", isHealthSegment(segs));
    }
  }

  // FPU leads → finance (+ all)
  if (group === "finance" || group === "all") {
    for (const f of allFpu) {
      add(f.email, f.name, "fpu_lead", true);
    }
  }

  // Discovery leads → health (+ all), not snack_hack-only
  if (group === "health" || group === "all") {
    for (const lead of allLeads) {
      add(lead.email, lead.name, "lead", true);
    }
  }

  // Platform users → health / all
  if (group === "health" || group === "all") {
    for (const u of allUsers) {
      if (u.role === "admin") continue;
      add(u.email, u.name, "user", true);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
}

export async function countNewsletterAudience(
  db: Db,
  opts: AudienceResolveOptions
): Promise<{ total: number; sample: NewsletterRecipient[] }> {
  const recipients = await resolveNewsletterAudience(db, opts);
  return {
    total: recipients.length,
    sample: recipients.slice(0, 8),
  };
}

/** List people on the finance newsletter list (segment + FPU leads). */
export async function listFinanceContacts(db: Db): Promise<
  { email: string; firstName: string; source: string; canRemove: boolean }[]
> {
  const rows = await resolveNewsletterAudience(db, {
    audienceGroup: "finance",
    excludeEnrolled: false,
    excludeEmails: [],
  });
  return rows.map((r) => ({
    email: r.email,
    firstName: r.firstName,
    source: r.source,
    // Manual newsletter_finance segment contacts can be removed; fpu leads stay
    canRemove: r.source === "subscriber:finance",
  }));
}

/** Add email to finance list via subscribers.newsletter_finance segment. */
export async function addFinanceContact(
  db: Db,
  emailRaw: string,
  firstName?: string
): Promise<{ email: string; created: boolean; alreadyOnList: boolean }> {
  const email = normalizeEmail(emailRaw);
  if (!EMAIL_RE.test(email)) throw new Error("Invalid email");

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1);

  if (existing) {
    const segs = parseSegments(existing.segments);
    const alreadyOnList = segs.includes(NEWSLETTER_FINANCE_SEGMENT);
    if (!alreadyOnList) {
      segs.push(NEWSLETTER_FINANCE_SEGMENT);
      await db
        .update(subscribers)
        .set({
          segments: JSON.stringify(segs),
          firstName: firstName?.trim() || existing.firstName,
          updatedAt: new Date(),
        })
        .where(eq(subscribers.id, existing.id));
    } else if (firstName?.trim() && !existing.firstName) {
      await db
        .update(subscribers)
        .set({ firstName: firstName.trim(), updatedAt: new Date() })
        .where(eq(subscribers.id, existing.id));
    }
    return { email, created: false, alreadyOnList };
  }

  await db.insert(subscribers).values({
    email,
    firstName: firstName?.trim() || firstNameFrom(null, email),
    segments: JSON.stringify([NEWSLETTER_FINANCE_SEGMENT]),
  });
  return { email, created: true, alreadyOnList: false };
}

export async function bulkAddFinanceContacts(
  db: Db,
  contacts: { email: string; firstName?: string }[]
): Promise<{
  added: number;
  alreadyOnList: number;
  failed: number;
  errors: string[];
}> {
  let added = 0;
  let alreadyOnList = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const c of contacts) {
    try {
      const result = await addFinanceContact(db, c.email, c.firstName);
      if (result.alreadyOnList) alreadyOnList++;
      else added++;
    } catch (e) {
      failed++;
      if (errors.length < 10) {
        errors.push(
          `${c.email}: ${e instanceof Error ? e.message : "failed"}`
        );
      }
    }
  }

  return { added, alreadyOnList, failed, errors };
}

/** Remove newsletter_finance segment (does not delete FPU site leads). */
export async function removeFinanceContact(db: Db, emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1);
  if (!existing) return;
  const segs = parseSegments(existing.segments).filter(
    (s) => s !== NEWSLETTER_FINANCE_SEGMENT
  );
  await db
    .update(subscribers)
    .set({ segments: JSON.stringify(segs), updatedAt: new Date() })
    .where(eq(subscribers.id, existing.id));
}
