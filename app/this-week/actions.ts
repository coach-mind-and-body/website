"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearMemberToken,
  isAdmin,
  loginAdmin,
  logoutAdmin,
  setMemberToken,
} from "@/lib/weekly-pairs/auth";
import {
  activeMembers,
  clearRsvp,
  createMember,
  destroyMember,
  getOrCreateWeek,
  memberById,
  memberByToken,
  parseGroups,
  patchMember,
  patchWeek,
  upsertRsvp,
  weekBoard,
} from "@/lib/weekly-pairs/db";
import { pairRandom } from "@/lib/weekly-pairs/match";
import { matchNoticeCopy, notifyMember, rsvpReminderCopy } from "@/lib/weekly-pairs/reminders";
import { memberUrl } from "@/lib/weekly-pairs/url";
import { isoNow } from "@/lib/weekly-pairs/week";

function refresh() {
  revalidatePath("/this-week");
  revalidatePath("/this-week/me");
  revalidatePath("/this-week/admin");
}

async function requireAdmin() {
  if (!(await isAdmin())) {
    redirect("/this-week/admin/login");
  }
}

export async function claimIdentity(formData: FormData) {
  const id = Number(formData.get("memberId"));
  const member = await memberById(id);
  if (!member || !member.active) {
    throw new Error("That name isn't on the list.");
  }
  await setMemberToken(member.token);
  redirect("/this-week");
}

export async function usePersonalLink(token: string) {
  const member = await memberByToken(token);
  if (!member) redirect("/this-week");
  await setMemberToken(member.token);
  redirect("/this-week");
}

export async function adminSetRsvp(formData: FormData) {
  await requireAdmin();
  const memberId = Number(formData.get("memberId"));
  const status = String(formData.get("status") || "");
  const member = await memberById(memberId);
  if (!member) throw new Error("That person isn't on the list.");
  const week = await getOrCreateWeek();
  if (status === "clear") {
    await clearRsvp(week.id, memberId);
  } else if (status === "in" || status === "out") {
    await upsertRsvp(week.id, memberId, status);
  } else {
    throw new Error("Pick in, out, or clear.");
  }
  refresh();
}

export async function switchPerson() {
  await clearMemberToken();
  redirect("/this-week");
}

export async function setRsvp(formData: FormData) {
  const status = String(formData.get("status"));
  if (status !== "in" && status !== "out") {
    throw new Error("Pick in or out.");
  }
  const token = String(formData.get("token") || "");
  const member = await memberByToken(token);
  if (!member || !member.active) {
    throw new Error("We couldn't find you on the list.");
  }
  const week = await getOrCreateWeek();
  await upsertRsvp(week.id, member.id, status);
  await setMemberToken(member.token);
  refresh();
  redirect("/this-week");
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") || "");
  const result = await loginAdmin(password);
  if (!result.ok) {
    redirect(`/this-week/admin/login?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/this-week/admin");
}

export async function adminLogout() {
  await logoutAdmin();
  redirect("/this-week/admin/login");
}

export async function addMember(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  if (!name) throw new Error("Name is required.");
  await createMember({ name, email, phone });
  refresh();
}

export async function updateMember(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const active = formData.get("active") === "on";
  if (!id || !name) throw new Error("Name is required.");
  await patchMember(id, { name, email, phone, active });
  refresh();
}

export async function removeMember(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await destroyMember(id);
  refresh();
}

export async function matchThisWeek() {
  await requireAdmin();
  const week = await getOrCreateWeek();
  const board = await weekBoard(week);
  const ids = board.inThisWeek.map((m) => m.id);
  if (ids.length < 2) {
    redirect("/this-week/admin?notice=" + encodeURIComponent("Need at least two people marked in."));
  }
  const groups = pairRandom(ids);
  await patchWeek(week.id, {
    status: "matched",
    groupsJson: JSON.stringify(groups),
    matchedAt: isoNow(),
    matchNoticeSentAt: null,
  });
  refresh();
  redirect("/this-week/admin?notice=" + encodeURIComponent(`Matched ${ids.length} people.`));
}

export async function reopenWeek() {
  await requireAdmin();
  const week = await getOrCreateWeek();
  await patchWeek(week.id, {
    status: "open",
    groupsJson: null,
    matchedAt: null,
    matchNoticeSentAt: null,
  });
  refresh();
}

export async function sendCheckInReminders() {
  await requireAdmin();
  const week = await getOrCreateWeek();
  const board = await weekBoard(week);
  const targets = board.pending.filter((m) => m.email || m.phone);
  const results = [];
  for (const member of targets) {
    const link = await memberUrl(member.token);
    const copy = await rsvpReminderCopy(member, link);
    results.push(...(await notifyMember(member, copy)));
  }
  await patchWeek(week.id, { reminderSentAt: isoNow() });
  refresh();
  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const skipped = board.pending.length - targets.length;
  redirect(
    "/this-week/admin?notice=" +
      encodeURIComponent(
        `Reminders: ${sent} sent, ${skipped} have no email/phone, ${failed} failed.`
      )
  );
}

export async function sendMatchNotices() {
  await requireAdmin();
  const week = await getOrCreateWeek();
  if (week.status !== "matched") {
    redirect("/this-week/admin?notice=" + encodeURIComponent("Match first, then send notices."));
  }
  const roster = await activeMembers();
  const byId = new Map(roster.map((m) => [m.id, m]));
  const groups = parseGroups(week.groupsJson);
  const results = [];
  for (const group of groups) {
    const people = group.memberIds.map((id) => byId.get(id)).filter(Boolean);
    for (const member of people) {
      if (!member) continue;
      const partners = people.filter((p) => p && p.id !== member.id).map((p) => p!.name);
      const link = await memberUrl(member.token);
      const copy = await matchNoticeCopy(member, partners, link);
      results.push(...(await notifyMember(member, copy)));
    }
  }
  await patchWeek(week.id, { matchNoticeSentAt: isoNow() });
  refresh();
  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  redirect(
    "/this-week/admin?notice=" + encodeURIComponent(`Match notices: ${sent} sent, ${failed} failed.`)
  );
}
