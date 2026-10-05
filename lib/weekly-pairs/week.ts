const TZ = "America/Denver";

function denverParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday"),
    hour: Number(get("hour")),
  };
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** First Monday of the every-two-weeks rotation. Earlier check-ins stay one week. */
export const BIWEEKLY_START = "2026-10-19";

function utcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(iso: string, days: number): string {
  const date = utcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  return Math.round((utcDate(end).getTime() - utcDate(start).getTime()) / 86_400_000);
}

/** Monday of the Mountain Time week that contains `date`, YYYY-MM-DD. */
export function currentMonday(date = new Date()): string {
  const t = denverParts(date);
  const utc = Date.UTC(t.year, t.month - 1, t.day);
  const day = new Date(utc).getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(utc);
  monday.setUTCDate(monday.getUTCDate() + offset);
  return monday.toISOString().slice(0, 10);
}

export function denverYmd(date = new Date()): string {
  const t = denverParts(date);
  return ymd(t.year, t.month, t.day);
}

/** 14 days from Oct 19, 2026. Check-ins that started earlier stay 7 days. */
export function periodDays(periodStart: string): number {
  return periodStart >= BIWEEKLY_START ? 14 : 7;
}

export function isBiweekly(periodStart: string): boolean {
  return periodDays(periodStart) === 14;
}

/**
 * Start of the open check-in.
 * Before Oct 19, 2026 that is Monday of the current week.
 * From that Monday on, blocks run 14 days and stay aligned to Oct 19.
 */
export function currentPeriodStart(date = new Date()): string {
  const monday = currentMonday(date);
  if (monday < BIWEEKLY_START) return monday;
  const block = Math.floor(daysBetween(BIWEEKLY_START, monday) / 14) * 14;
  return addDays(BIWEEKLY_START, block);
}

export function periodEnd(periodStart: string): string {
  return addDays(periodStart, periodDays(periodStart) - 1);
}

export function weekRangeLabel(periodStart: string): string {
  const start = utcDate(periodStart);
  const end = utcDate(periodEnd(periodStart));
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const startLabel = fmt.format(start);
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  const endLabel = sameMonth ? String(end.getUTCDate()) : fmt.format(end);
  return `${startLabel} – ${endLabel}`;
}

export function checkInPhrases(periodStart: string) {
  const two = isBiweekly(periodStart);
  const span = two ? "these two weeks" : "this week";
  return {
    span,
    titleOpen: two ? "Who's in for these two weeks?" : "Who's in this week?",
    titleMatched: two ? "Pairs for these two weeks" : "This week's pairs",
    in: two ? "You're in for these two weeks." : "You're in this week.",
    out: two ? "You're out for these two weeks." : "You're out this week.",
    ask: two ? "Are you in for these two weeks?" : "Are you in this week?",
    inLabel: two ? "In these two weeks" : "In this week",
    outLabel: two ? "Out these two weeks" : "Out this week",
    youLabel: two ? "You these two weeks" : "You this week",
    adminTitle: two ? "These two weeks" : "This week",
    matchButton: two ? "Match these two weeks" : "Match this week",
    emailPairs: two ? "Email/text these pairs" : "Email/text this week's pairs",
  };
}

export function denverNow() {
  return denverParts();
}

export function isoNow() {
  return new Date().toISOString();
}
