import type { ProgramId } from "@shared/programs";

export type PeopleSource = "contacts" | "applicants" | "intakes" | "snackhack";

export type PeopleProgram = ProgramId | "habit";

export type MergedPerson = {
  email: string;
  name: string;
  phone: string | null;
  sources: PeopleSource[];
  programs: PeopleProgram[];
  needsProgram: boolean;
  leadStatus: string | null;
  applicationId: number | null;
  applicationStatus: string | null;
  applicationWhy: string | null;
  applicationHopes: string | null;
  applicationFlags: string[];
  intakeId: number | null;
  snackHackId: number | null;
};

export type MergePeopleInput = {
  contacts?: Array<{
    email: string;
    name?: string | null;
    phone?: string | null;
    tags?: string[] | null;
    highestStatus?: string | null;
    hasActiveHabits?: boolean | null;
    leadStatus?: string | null;
  }>;
  leads?: Array<{
    email: string;
    name?: string | null;
    phone?: string | null;
    needsProgram?: boolean | null;
    status?: string | null;
  }>;
  applicants?: Array<{
    id: number;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    whyCoaching?: string | null;
    hopes?: string | null;
    flags?: string[] | null;
  }>;
  intakes?: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string | null;
  }>;
  snackHacks?: Array<{
    id: number;
    email: string;
    firstName?: string | null;
  }>;
  rosters?: Array<{
    program: PeopleProgram;
    email: string;
    name?: string | null;
    phone?: string | null;
  }>;
};

type Bucket = {
  email: string;
  name: string;
  phone: string | null;
  sources: Set<PeopleSource>;
  programs: Set<PeopleProgram>;
  needsProgram: boolean;
  leadStatus: string | null;
  applicationId: number | null;
  applicationStatus: string | null;
  applicationWhy: string | null;
  applicationHopes: string | null;
  applicationFlags: string[];
  intakeId: number | null;
  snackHackId: number | null;
};

function emailKey(email: string): string {
  return email.trim().toLowerCase();
}

function usableName(name: string | null | undefined, email: string): string | null {
  const trimmed = name?.trim() ?? "";
  if (!trimmed || trimmed === "Unknown" || trimmed.includes("@")) return null;
  if (trimmed.toLowerCase() === email.split("@")[0]) return null;
  return trimmed;
}

function getBucket(map: Map<string, Bucket>, email: string, name?: string | null, phone?: string | null): Bucket {
  const key = emailKey(email);
  let bucket = map.get(key);
  if (!bucket) {
    bucket = {
      email: key,
      name: usableName(name, key) ?? key,
      phone: phone?.trim() || null,
      sources: new Set(),
      programs: new Set(),
      needsProgram: false,
      leadStatus: null,
      applicationId: null,
      applicationStatus: null,
      applicationWhy: null,
      applicationHopes: null,
      applicationFlags: [],
      intakeId: null,
      snackHackId: null,
    };
    map.set(key, bucket);
  }
  const betterName = usableName(name, key);
  if (betterName && (bucket.name === key || bucket.name.length < betterName.length)) {
    bucket.name = betterName;
  }
  if (!bucket.phone && phone?.trim()) bucket.phone = phone.trim();
  return bucket;
}

export function mergePeople(input: MergePeopleInput): MergedPerson[] {
  const map = new Map<string, Bucket>();

  for (const contact of input.contacts ?? []) {
    if (!contact.email?.trim()) continue;
    const bucket = getBucket(map, contact.email, contact.name, contact.phone);
    bucket.sources.add("contacts");
    if (contact.leadStatus) bucket.leadStatus = contact.leadStatus;
    if (contact.highestStatus === "reclaim") bucket.programs.add("reclaim");
    if (contact.highestStatus === "fpu" || contact.tags?.includes("fpu_interest")) bucket.programs.add("fpu");
    if (contact.highestStatus === "habit-only" || contact.hasActiveHabits) bucket.programs.add("habit");
    if (contact.tags?.includes("leadgen_snack_hack")) bucket.sources.add("snackhack");
  }

  for (const lead of input.leads ?? []) {
    if (!lead.email?.trim()) continue;
    const bucket = getBucket(map, lead.email, lead.name, lead.phone);
    bucket.sources.add("contacts");
    if (lead.needsProgram) bucket.needsProgram = true;
    if (lead.status) bucket.leadStatus = lead.status;
  }

  for (const applicant of input.applicants ?? []) {
    if (!applicant.email?.trim()) continue;
    const bucket = getBucket(map, applicant.email, applicant.fullName, applicant.phone);
    bucket.sources.add("applicants");
    bucket.programs.add("metabolic");
    const pending = applicant.status !== "accepted";
    const replace = bucket.applicationId == null || (pending && bucket.applicationStatus === "accepted");
    if (replace) {
      bucket.applicationId = applicant.id;
      bucket.applicationStatus = applicant.status;
      bucket.applicationWhy = applicant.whyCoaching ?? null;
      bucket.applicationHopes = applicant.hopes ?? null;
      bucket.applicationFlags = applicant.flags ?? [];
    }
  }

  for (const intake of input.intakes ?? []) {
    if (!intake.email?.trim()) continue;
    const bucket = getBucket(map, intake.email, intake.name, intake.phone);
    bucket.sources.add("intakes");
    bucket.programs.add("metabolic");
    if (bucket.intakeId == null || intake.id > bucket.intakeId) bucket.intakeId = intake.id;
  }

  for (const snack of input.snackHacks ?? []) {
    if (!snack.email?.trim()) continue;
    const bucket = getBucket(map, snack.email, snack.firstName, null);
    bucket.sources.add("snackhack");
    if (bucket.snackHackId == null || snack.id > bucket.snackHackId) bucket.snackHackId = snack.id;
  }

  for (const row of input.rosters ?? []) {
    if (!row.email?.trim()) continue;
    const bucket = getBucket(map, row.email, row.name, row.phone);
    bucket.sources.add("contacts");
    bucket.programs.add(row.program);
  }

  return Array.from(map.values())
    .map((bucket) => ({
      email: bucket.email,
      name: bucket.name,
      phone: bucket.phone,
      sources: Array.from(bucket.sources),
      programs: Array.from(bucket.programs),
      needsProgram: bucket.needsProgram,
      leadStatus: bucket.leadStatus,
      applicationId: bucket.applicationId,
      applicationStatus: bucket.applicationStatus,
      applicationWhy: bucket.applicationWhy,
      applicationHopes: bucket.applicationHopes,
      applicationFlags: bucket.applicationFlags,
      intakeId: bucket.intakeId,
      snackHackId: bucket.snackHackId,
    }))
    .sort((a, b) => {
      if (a.needsProgram !== b.needsProgram) return a.needsProgram ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function filterPeople(
  people: MergedPerson[],
  query: { source?: string | null; program?: string | null; search?: string | null }
): MergedPerson[] {
  const source = query.source && query.source !== "all" ? query.source : null;
  const program = query.program && query.program !== "all" ? query.program : null;
  const search = query.search?.trim().toLowerCase() ?? "";
  const digits = search.replace(/\D/g, "");
  return people.filter((person) => {
    if (source === "needs" && !person.needsProgram) return false;
    if (source && source !== "needs" && !person.sources.includes(source as PeopleSource)) return false;
    if (program && !person.programs.includes(program as PeopleProgram)) return false;
    if (!search) return true;
    const phoneDigits = person.phone?.replace(/\D/g, "") ?? "";
    const hay = `${person.name} ${person.email} ${person.phone ?? ""}`.toLowerCase();
    return hay.includes(search) || (digits.length >= 3 && phoneDigits.includes(digits));
  });
}
