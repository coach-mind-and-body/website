import { eq } from "drizzle-orm";
import { leads, subscribers, enrollments, users, fpuLeads, userHabits, userHabitLogs } from "../../drizzle/schema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type TimelineEvent = { date: string; action: string; type: string };

export type UnifiedContact = {
  email: string;
  name: string;
  phone?: string;
  tags: string[];
  timeline: TimelineEvent[];
  highestStatus: string;
  leadStatus?: string;
  leadId?: number;
  enrollmentStatus?: string;
  enrollmentId?: number;
  userId?: number;
  shareHabitsWithCoach?: boolean;
  notes?: string;
  hasActiveHabits?: boolean;
  lastHabitDateStr?: string | null;
};

export type UnifiedContactFilter = "all" | "reclaim" | "habit" | "leads";

export type UnifiedContactsQuery = {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: UnifiedContactFilter;
};

export type UnifiedContactsPage = {
  items: UnifiedContact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function matchesFilter(contact: UnifiedContact, filter: UnifiedContactFilter): boolean {
  if (filter === "all") return true;
  if (filter === "reclaim") return contact.highestStatus === "reclaim";
  if (filter === "habit") return contact.highestStatus === "habit-only";
  if (filter === "leads") {
    return ["discovery", "fpu", "subscriber"].includes(contact.highestStatus);
  }
  return true;
}

function matchesSearch(contact: UnifiedContact, search: string): boolean {
  const q = search.toLowerCase().trim();
  const qDigits = q.replace(/\D/g, "");
  const phoneDigits = contact.phone?.replace(/\D/g, "") ?? "";
  return (
    contact.email.toLowerCase().includes(q) ||
    contact.name.toLowerCase().includes(q) ||
    (contact.phone?.toLowerCase().includes(q) ?? false) ||
    (qDigits.length >= 3 && phoneDigits.includes(qDigits))
  );
}

export async function buildUnifiedContacts(db: Db): Promise<UnifiedContact[]> {
  const [allLeads, allSubscribers, allEnrollments, allFpu, allUsers, activeHabitsRaw, allCompletedLogs] = await Promise.all([
    db.select().from(leads),
    db.select().from(subscribers),
    db
      .select({
        id: enrollments.id,
        userId: enrollments.userId,
        email: users.email,
        name: users.name,
        paymentType: enrollments.paymentType,
        depositPaid: enrollments.depositPaid,
        balancePaid: enrollments.balancePaid,
        status: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
      })
      .from(enrollments)
      .leftJoin(users, eq(users.id, enrollments.userId)),
    db.select().from(fpuLeads),
    db.select().from(users),
    db.select({ id: userHabits.id, userId: userHabits.userId }).from(userHabits).where(eq(userHabits.isActive, true)),
    db.select({ userId: userHabitLogs.userId, dateStr: userHabitLogs.dateStr, userHabitId: userHabitLogs.userHabitId }).from(userHabitLogs).where(eq(userHabitLogs.completed, true))
  ]);

  const activeHabitIdsByUserId = new Map<number, Set<number>>();
  for (const h of activeHabitsRaw) {
    if (!activeHabitIdsByUserId.has(h.userId)) activeHabitIdsByUserId.set(h.userId, new Set());
    activeHabitIdsByUserId.get(h.userId)!.add(h.id);
  }
  
  const lastLogByUserId = new Map<number, string>();
  for (const log of allCompletedLogs) {
    const activeIds = activeHabitIdsByUserId.get(log.userId);
    if (activeIds && activeIds.has(log.userHabitId)) {
      const currentLast = lastLogByUserId.get(log.userId);
      if (!currentLast || log.dateStr > currentLast) {
        lastLogByUserId.set(log.userId, log.dateStr);
      }
    }
  }

  const contactsMap = new Map<string, UnifiedContact>();

  const getContact = (email: string, nameFallback: string) => {
    const normalized = email.toLowerCase().trim();
    if (!contactsMap.has(normalized)) {
      contactsMap.set(normalized, {
        email: normalized,
        name: nameFallback,
        tags: [],
        timeline: [],
        highestStatus: "subscriber",
      });
    }
    return contactsMap.get(normalized)!;
  };

  allSubscribers.forEach((sub) => {
    const contact = getContact(
      sub.email,
      sub.firstName ? `${sub.firstName} ${sub.lastName || ""}`.trim() : "Unknown"
    );
    if (sub.segments) {
      try {
        const parsed = JSON.parse(sub.segments);
        if (Array.isArray(parsed)) contact.tags.push(...parsed);
      } catch {
        // ignore invalid segments JSON
      }
    }
    let optInLabel = "Joined Subscriber List";
    if (sub.segments?.includes("leadgen_snack_hack")) {
      optInLabel = "Downloaded Snack Hack Guide";
      if (!contact.tags.includes("leadgen_snack_hack")) contact.tags.push("leadgen_snack_hack");
    } else if (sub.segments?.includes("leadgen_food_quiz")) {
      optInLabel = "Completed Food Freedom Quiz";
      if (!contact.tags.includes("leadgen_food_quiz")) contact.tags.push("leadgen_food_quiz");
    }
    contact.timeline.push({
      date: sub.createdAt.toISOString(),
      action: optInLabel,
      type: "optin",
    });
  });

  allFpu.forEach((fpu) => {
    const contact = getContact(fpu.email, fpu.name);
    contact.tags.push("fpu_interest");
    contact.timeline.push({
      date: fpu.createdAt.toISOString(),
      action: "FPU Group Sign-up",
      type: "fpu",
    });
    if (contact.highestStatus === "subscriber") contact.highestStatus = "fpu";
  });

  allLeads.forEach((lead) => {
    const contact = getContact(lead.email, lead.name);
    // Prefer a real display name over email-local-part / "Unknown" from earlier sources
    if (lead.name && lead.name !== "Unknown" && !lead.name.includes("@")) {
      if (
        !contact.name ||
        contact.name === "Unknown" ||
        contact.name.toLowerCase() === contact.email.split("@")[0]
      ) {
        contact.name = lead.name;
      }
    }
    contact.phone = lead.phone || contact.phone;
    contact.leadStatus = lead.status;
    contact.leadId = lead.id;
    // Append notes; don't wipe prior snack-hack / form notes if both exist
    if (lead.notes) {
      contact.notes = contact.notes
        ? contact.notes.includes(lead.notes)
          ? contact.notes
          : `${contact.notes}\n\n${lead.notes}`
        : lead.notes;
    }
    const fromGcal = !!lead.notes?.includes("gcal_event:");
    contact.timeline.push({
      date: lead.createdAt.toISOString(),
      action: fromGcal
        ? "Booked Discovery Call (Google Calendar)"
        : "Booked Discovery Call",
      type: "discovery",
    });
    // Surface booking time from notes when present
    const whenMatch = lead.notes?.match(/When \(MT\):\s*(.+)/);
    if (whenMatch?.[1]) {
      contact.timeline.push({
        date: lead.updatedAt?.toISOString?.() ?? lead.createdAt.toISOString(),
        action: `Call scheduled: ${whenMatch[1].trim()}`,
        type: "discovery",
      });
    }
    if (lead.status === "enrolled") {
      contact.highestStatus = "reclaim";
    } else if (contact.highestStatus !== "reclaim") {
      contact.highestStatus = "discovery";
    }
  });

  allUsers.forEach((user) => {
    if (!user.email) return;
    const contact = getContact(user.email, user.name || "Unknown");
    contact.userId = user.id;
    contact.shareHabitsWithCoach = user.shareHabitsWithCoach;
    contact.hasActiveHabits = !!activeHabitIdsByUserId.get(user.id)?.size;
    contact.lastHabitDateStr = lastLogByUserId.get(user.id) || null;
    
    if (contact.highestStatus === "subscriber" || contact.highestStatus === "fpu") {
      contact.highestStatus = "habit-only";
    }
    if (!contact.timeline.some((t) => t.type === "signup")) {
      contact.timeline.push({
        date: user.createdAt.toISOString(),
        action: "Created Portal Account",
        type: "signup",
      });
    }
  });

  allEnrollments.forEach((enr) => {
    if (!enr.email) return;
    const contact = getContact(enr.email, enr.name || "Unknown");
    contact.enrollmentId = enr.id;
    contact.enrollmentStatus = enr.status;
    contact.timeline.push({
      date: enr.enrolledAt.toISOString(),
      action: `Paid for RECLAIM (${enr.paymentType})`,
      type: "purchase",
    });
    contact.highestStatus = "reclaim";
  });

  return Array.from(contactsMap.values())
    .map((c) => {
      c.timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return c;
    })
    .sort((a, b) => {
      const dateA = a.timeline[0]?.date ? new Date(a.timeline[0].date).getTime() : 0;
      const dateB = b.timeline[0]?.date ? new Date(b.timeline[0].date).getTime() : 0;
      return dateB - dateA;
    });
}

export function queryUnifiedContacts(
  contacts: UnifiedContact[],
  options: UnifiedContactsQuery = {}
): UnifiedContactsPage {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize ?? 25));
  const filter = options.filter ?? "all";
  const search = options.search?.trim().toLowerCase();

  let filtered = contacts.filter((c) => matchesFilter(c, filter));
  if (search) {
    filtered = filtered.filter((c) => matchesSearch(c, search));
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function getUnifiedContactsPage(
  db: Db,
  options: UnifiedContactsQuery = {}
): Promise<UnifiedContactsPage> {
  const contacts = await buildUnifiedContacts(db);
  return queryUnifiedContacts(contacts, options);
}
