import { enrollments, fpuLeads } from "../../drizzle/schema";
import { and, eq, inArray } from "drizzle-orm";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type CrmDesignation =
  | "reclaim"
  | "fpu"
  | "discovery"
  | "habit"
  | "admin"
  | "customer"
  | "lead";

export const DESIGNATION_LABELS: Record<CrmDesignation, string> = {
  reclaim: "Reclaim Client",
  fpu: "FPU Interest",
  discovery: "Discovery Lead",
  lead: "Lead",
  habit: "Habit Tracker",
  admin: "Admin",
  customer: "Customer",
};

/** Active or completed Reclaim program enrollments */
export async function loadReclaimUserIds(db: Db): Promise<Set<number>> {
  const rows = await db
    .select({ userId: enrollments.userId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.program, "reclaim"),
        inArray(enrollments.status, ["pending", "active", "completed"])
      )
    );
  return new Set(rows.map((r) => r.userId));
}

export async function loadDesignationContext(db: Db) {
  const [reclaimUserIds, fpuEmails] = await Promise.all([
    loadReclaimUserIds(db),
    loadFpuEmails(db),
  ]);
  return { reclaimUserIds, fpuEmails };
}

export async function loadFpuEmails(db: Db): Promise<Set<string>> {
  const rows = await db.select({ email: fpuLeads.email }).from(fpuLeads);
  return new Set(rows.map((r) => r.email.toLowerCase().trim()));
}

export function resolveDesignation(opts: {
  userId?: number | null;
  email?: string | null;
  role?: string | null;
  leadStatus?: string | null;
  reclaimUserIds: Set<number>;
  fpuEmails?: Set<string>;
}): CrmDesignation {
  const { userId, email, role, leadStatus, reclaimUserIds, fpuEmails } = opts;

  if (role === "admin") return "admin";
  if (userId && reclaimUserIds.has(userId)) return "reclaim";
  if (leadStatus === "enrolled") return "reclaim";
  if (email && fpuEmails?.has(email.toLowerCase().trim())) return "fpu";
  if (leadStatus === "new" || leadStatus === "contacted" || leadStatus === "not_a_fit") {
    return leadStatus === "new" ? "discovery" : "lead";
  }
  if (userId) return "habit";
  return "customer";
}

export function designationLabel(designation: CrmDesignation): string {
  return DESIGNATION_LABELS[designation];
}

const DESIGNATION_PRIORITY: Record<CrmDesignation, number> = {
  reclaim: 7,
  admin: 6,
  fpu: 5,
  discovery: 4,
  habit: 3,
  customer: 2,
  lead: 1,
};

export function mergeDesignations(a: CrmDesignation, b: CrmDesignation): CrmDesignation {
  return DESIGNATION_PRIORITY[a] >= DESIGNATION_PRIORITY[b] ? a : b;
}