import { eq } from "drizzle-orm";
import { leads, subscribers, enrollments, users, fpuLeads } from "../../drizzle/schema";
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
  const q = search.toLowerCase();
  return (
    contact.email.toLowerCase().includes(q) ||
    contact.name.toLowerCase().includes(q) ||
    (contact.phone?.toLowerCase().includes(q) ?? false)
  );
}

export async function buildUnifiedContacts(db: Db): Promise<UnifiedContact[]> {
  const [allLeads, allSubscribers, allEnrollments, allFpu, allUsers] = await Promise.all([
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
  ]);

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
    contact.timeline.push({
      date: sub.createdAt.toISOString(),
      action: "Joined Subscriber List",
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
    contact.phone = lead.phone || contact.phone;
    contact.leadStatus = lead.status;
    contact.leadId = lead.id;
    if (lead.notes) contact.notes = lead.notes;
    contact.timeline.push({
      date: lead.createdAt.toISOString(),
      action: "Booked Discovery Call",
      type: "discovery",
    });
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