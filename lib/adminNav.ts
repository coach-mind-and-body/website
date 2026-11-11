import { isProgramId, type ProgramId } from "@shared/programs";

/** Top-level admin sections. Old pill ids redirect here. */
export const ADMIN_SECTION_IDS = [
  "overview",
  "programs",
  "people",
  "library",
  "marketing",
  "engagement",
  "deposits",
  "settings",
] as const;

export type AdminSectionId = (typeof ADMIN_SECTION_IDS)[number];

export const ADMIN_SECTION_LABELS: Record<AdminSectionId, string> = {
  overview: "Overview",
  programs: "Programs",
  people: "People",
  library: "Library",
  marketing: "Marketing",
  engagement: "Habit Tracker",
  deposits: "Payments",
  settings: "Settings",
};

export type ProgramSectionId = "roster" | "signups" | "coaching" | "content" | "page" | "settings";

export type PeopleSourceId = "all" | "contacts" | "applicants" | "intakes" | "snackhack" | "needs";

export type PeopleScreenId = "contacts" | "applicants" | "intakes" | "snackhack";

export type LibrarySectionId = "files" | "food";

export type MarketingSectionId = "crm" | "newsletters" | "blog";

export type PeopleProgramId = ProgramId | "habit";

type LegacyTarget = {
  tab: AdminSectionId;
  program?: string;
  section?: string;
  source?: PeopleSourceId;
  screen?: PeopleScreenId;
  focus?: string;
};

/**
 * Previous top-level tabs. Bookmarks, emails, and push links still use these
 * ids; resolveAdminSearch rewrites them onto the new section.
 */
export const LEGACY_ADMIN_TABS: Record<string, LegacyTarget> = {
  sprint: { tab: "overview", focus: "month" },
  contacts: { tab: "people", source: "contacts", screen: "contacts" },
  applicants: { tab: "people", source: "applicants", screen: "applicants" },
  intakes: { tab: "people", source: "intakes", screen: "intakes" },
  snackhack: { tab: "people", source: "snackhack", screen: "snackhack" },
  "crm-automations": { tab: "marketing", section: "crm" },
  newsletters: { tab: "marketing", section: "newsletters" },
  challenge: { tab: "programs", program: "challenge", section: "signups" },
  fpu: { tab: "programs", program: "fpu", section: "coaching" },
  fpugroup: { tab: "programs", program: "fpu", section: "signups" },
  programbuilder: { tab: "programs", program: "reclaim", section: "content" },
  food: { tab: "library", section: "food" },
  pageeditor: { tab: "programs", program: "fpu", section: "page" },
  blog: { tab: "marketing", section: "blog" },
  filelibrary: { tab: "library", section: "files" },
};

export function isAdminSectionId(value: string | null): value is AdminSectionId {
  return !!value && (ADMIN_SECTION_IDS as readonly string[]).includes(value);
}

export function resolveAdminSearch(search: string): {
  tab: AdminSectionId;
  search: string;
  changed: boolean;
} {
  const current = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(current);
  const raw = params.get("tab");
  const legacy = raw ? LEGACY_ADMIN_TABS[raw] : undefined;
  if (!legacy) {
    return {
      tab: isAdminSectionId(raw) ? raw : "overview",
      search: params.toString(),
      changed: false,
    };
  }
  params.set("tab", legacy.tab);
  if (legacy.program) params.set("program", legacy.program);
  if (legacy.section) params.set("section", legacy.section);
  if (legacy.source) params.set("source", legacy.source);
  if (legacy.screen) params.set("screen", legacy.screen);
  if (legacy.focus) params.set("focus", legacy.focus);
  const next = params.toString();
  return { tab: legacy.tab, search: next, changed: next !== current };
}

export function resolvedAdminParams(search: string): URLSearchParams {
  return new URLSearchParams(resolveAdminSearch(search).search);
}

export const PROGRAM_SECTION_LABELS: Record<ProgramSectionId, string> = {
  roster: "Roster",
  signups: "Sign-ups",
  coaching: "Coaching",
  content: "Content",
  page: "Edit page",
  settings: "Settings",
};

export function programSectionIds(program: ProgramId): ProgramSectionId[] {
  if (program === "fpu") {
    return ["roster", "signups", "coaching", "content", "page", "settings"];
  }
  return ["roster", "signups", "content", "settings"];
}

export function normalizeProgramSection(program: ProgramId, raw: string | null): ProgramSectionId {
  const allowed = programSectionIds(program);
  if (raw && (allowed as readonly string[]).includes(raw)) return raw as ProgramSectionId;
  return "roster";
}

export function librarySection(raw: string | null): LibrarySectionId {
  return raw === "food" ? "food" : "files";
}

export function marketingSection(raw: string | null): MarketingSectionId {
  if (raw === "newsletters" || raw === "blog" || raw === "crm") return raw;
  return "crm";
}

const PEOPLE_SOURCES: readonly PeopleSourceId[] = [
  "all",
  "contacts",
  "applicants",
  "intakes",
  "snackhack",
  "needs",
];

export function peopleSource(raw: string | null): PeopleSourceId {
  if (raw && (PEOPLE_SOURCES as readonly string[]).includes(raw)) return raw as PeopleSourceId;
  return "all";
}

export function peopleScreen(raw: string | null): PeopleScreenId | null {
  if (raw === "contacts" || raw === "applicants" || raw === "intakes" || raw === "snackhack") return raw;
  return null;
}

export function peopleProgram(raw: string | null): PeopleProgramId | null {
  if (raw === "habit") return "habit";
  if (raw && isProgramId(raw)) return raw;
  return null;
}
