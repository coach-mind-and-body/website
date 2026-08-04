/**
 * Resolve newsletter recipients for finance / health / all audiences.
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

export type NewsletterAudienceGroup = "finance" | "health" | "all";

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
      s.startsWith("fpu_") ||
      s.includes("financial") ||
      s === "fpu_interest"
  );
}

function isHealthSegment(segments: string[]): boolean {
  if (segments.length === 0) return true; // generic list → health by default
  // Health if any non-finance marketing segment, or pure finance-only is false
  if (isFinanceSegment(segments) && segments.every((s) => isFinanceSegment([s]) || s === "email_opt_out")) {
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

  // Map email → best recipient record
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
      // Prefer a better first name if we only had email local-part
      const existing = map.get(email)!;
      const next = firstNameFrom(name, email);
      if (existing.firstName.toLowerCase() === email.split("@")[0].toLowerCase() && name?.trim()) {
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

  // Subscribers
  for (const sub of allSubs) {
    if (isEmailOptedOut(sub.segments)) continue;
    const segs = parseSegments(sub.segments);
    const name = [sub.firstName, sub.lastName].filter(Boolean).join(" ") || sub.firstName;
    if (group === "all") {
      add(sub.email, name, "subscriber", true);
    } else if (group === "finance") {
      add(sub.email, name, "subscriber:fpu", isFinanceSegment(segs));
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

  // Discovery / health leads → health (+ all)
  if (group === "health" || group === "all") {
    for (const lead of allLeads) {
      add(lead.email, lead.name, "lead", true);
    }
  }

  // Platform users (non-admin) → health or all (not finance-only unless they appear elsewhere)
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
