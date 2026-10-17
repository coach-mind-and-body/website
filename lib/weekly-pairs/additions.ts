import { nanoid } from "nanoid";
import type { DbData } from "./store";

/** Addresses Lee Anne sent on 2026-10-16. Amy, Amanda, Jeanette, and Alex were left off. */
export const ROSTER_EMAILS: Record<string, string> = {
  anna: "alstice@gmail.com",
  brenda: "brendapnorton@gmail.com",
  carrie: "blondee08@gmail.com",
  catherine: "catherine.denney@gmail.com",
  chrissy: "christina.olsen@gmail.com",
  dianne: "bdgullino@gmail.com",
  emilie: "lovelylynnies@gmail.com",
  gina: "ginarajch@gmail.com",
  jaycee: "jayceenorm@msn.com",
  jennifer: "jennijean14@hotmail.com",
  judy: "jabhorton@hotmail.com",
  kacy: "kacy.moller@hotmail.com",
  "kelly f.": "frasierk13@gmail.com",
  "lee anne": "connect.chapman@gmail.com",
  marianne: "activemarianne@gmail.com",
  mary: "zachandmary@gmail.com",
  mckenna: "mckennaosborne@gmail.com",
  nicole: "nicoleluther3@gmail.com",
  shannon: "shannonpierce777@icloud.com",
  sherry: "sherrybrower@gmail.com",
  sherylee: "sherylee.kartchner@gmail.com",
};

const ROSTER_EMAILS_KEY = "2026-10-16-emails";

/** Add a person once to a roster that was already seeded. A later removal stays removed. */
export function applyRosterAddition(data: DbData, name: string, now: string) {
  const clean = name.trim();
  const key = clean.toLowerCase();
  if (!key) return;
  const applied = data.appliedAdditions ?? [];
  if (applied.includes(key)) return;
  data.appliedAdditions = [...applied, key];
  if (data.members.some((m) => m.name.trim().toLowerCase() === key)) return;
  data.members.push({
    id: data.nextId.members++,
    name: clean,
    email: null,
    phone: null,
    token: nanoid(12),
    active: true,
    createdAt: now,
  });
}

/** Fill the addresses once. A later edit in admin stays as edited. */
export function applyRosterEmails(data: DbData) {
  const applied = data.appliedAdditions ?? [];
  if (applied.includes(ROSTER_EMAILS_KEY)) return;
  data.appliedAdditions = [...applied, ROSTER_EMAILS_KEY];
  for (const member of data.members) {
    const email = ROSTER_EMAILS[member.name.trim().toLowerCase()];
    if (email) member.email = email;
  }
}
