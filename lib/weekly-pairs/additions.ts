import { nanoid } from "nanoid";
import type { DbData } from "./store";

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
