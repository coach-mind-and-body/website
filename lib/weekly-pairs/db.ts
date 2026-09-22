import { nanoid } from "nanoid";
import { SEED_NAMES } from "./config";
import type { PairGroup } from "./match";
import type { Member, Rsvp, Week } from "./schema";
import { loadStore, mutateStore, readStore } from "./store";
import { currentMonday, isoNow } from "./week";

let seeded = false;

export async function dbReady() {
  if (seeded) return;
  await loadStore();
  await mutateStore((data) => {
    if (data.members.length > 0) return;
    const now = isoNow();
    for (const name of SEED_NAMES) {
      data.members.push({
        id: data.nextId.members++,
        name,
        email: name === "Lee Anne" ? "leeanne@connectbsg.com" : null,
        phone: null,
        token: nanoid(12),
        active: true,
        createdAt: now,
      });
    }
  });
  seeded = true;
}

export function parseGroups(raw: string | null | undefined): PairGroup[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PairGroup[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((g) => Array.isArray(g.memberIds) && g.memberIds.length >= 2);
  } catch {
    return [];
  }
}

export async function getOrCreateWeek(weekStart = currentMonday()): Promise<Week> {
  await dbReady();
  return mutateStore((data) => {
    const found = data.weeks.find((w) => w.weekStart === weekStart);
    if (found) return found;
    const week: Week = {
      id: data.nextId.weeks++,
      weekStart,
      status: "open",
      groupsJson: null,
      matchedAt: null,
      reminderSentAt: null,
      nudgeSentAt: null,
      matchNoticeSentAt: null,
    };
    data.weeks.push(week);
    return week;
  });
}

export async function activeMembers(): Promise<Member[]> {
  await dbReady();
  return readStore()
    .members.filter((m) => m.active)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export async function allMembers(): Promise<Member[]> {
  await dbReady();
  return [...readStore().members].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export async function memberByToken(token: string): Promise<Member | null> {
  await dbReady();
  return readStore().members.find((m) => m.token === token) ?? null;
}

export async function memberById(id: number): Promise<Member | null> {
  await dbReady();
  return readStore().members.find((m) => m.id === id) ?? null;
}

export async function rsvpsForWeek(weekId: number): Promise<Rsvp[]> {
  await dbReady();
  return readStore().rsvps.filter((r) => r.weekId === weekId);
}

export async function recentWeeks(limit = 12): Promise<Week[]> {
  await dbReady();
  return [...readStore().weeks].sort((a, b) => b.weekStart.localeCompare(a.weekStart)).slice(0, limit);
}

export async function createMember(input: {
  name: string;
  email: string | null;
  phone: string | null;
}) {
  await dbReady();
  return mutateStore((data) => {
    const member: Member = {
      id: data.nextId.members++,
      name: input.name,
      email: input.email,
      phone: input.phone,
      token: nanoid(12),
      active: true,
      createdAt: isoNow(),
    };
    data.members.push(member);
    return member;
  });
}

export async function patchMember(
  id: number,
  patch: Partial<Pick<Member, "name" | "email" | "phone" | "active">>
) {
  await dbReady();
  return mutateStore((data) => {
    const member = data.members.find((m) => m.id === id);
    if (!member) return null;
    Object.assign(member, patch);
    return member;
  });
}

export async function destroyMember(id: number) {
  await dbReady();
  await mutateStore((data) => {
    data.rsvps = data.rsvps.filter((r) => r.memberId !== id);
    data.members = data.members.filter((m) => m.id !== id);
  });
}

export async function upsertRsvp(weekId: number, memberId: number, status: "in" | "out") {
  await dbReady();
  return mutateStore((data) => {
    const existing = data.rsvps.find((r) => r.weekId === weekId && r.memberId === memberId);
    if (existing) {
      existing.status = status;
      existing.respondedAt = isoNow();
      return existing;
    }
    const rsvp: Rsvp = {
      id: data.nextId.rsvps++,
      weekId,
      memberId,
      status,
      respondedAt: isoNow(),
    };
    data.rsvps.push(rsvp);
    return rsvp;
  });
}

export async function clearRsvp(weekId: number, memberId: number) {
  await dbReady();
  await mutateStore((data) => {
    data.rsvps = data.rsvps.filter((r) => !(r.weekId === weekId && r.memberId === memberId));
  });
}

export async function patchWeek(id: number, patch: Partial<Week>) {
  await dbReady();
  return mutateStore((data) => {
    const week = data.weeks.find((w) => w.id === id);
    if (!week) return null;
    Object.assign(week, patch);
    return week;
  });
}

export type MemberRsvp = Member & { rsvp: Rsvp | null };

export async function weekBoard(week: Week, roster: Member[] = []) {
  const people = roster.length ? roster : await activeMembers();
  const responses = await rsvpsForWeek(week.id);
  const byMember = new Map(responses.map((r) => [r.memberId, r]));
  const withRsvp: MemberRsvp[] = people.map((m) => ({
    ...m,
    rsvp: byMember.get(m.id) ?? null,
  }));
  return {
    week,
    people: withRsvp,
    inThisWeek: withRsvp.filter((m) => m.rsvp?.status === "in"),
    outThisWeek: withRsvp.filter((m) => m.rsvp?.status === "out"),
    pending: withRsvp.filter((m) => !m.rsvp),
    groups: parseGroups(week.groupsJson),
  };
}
