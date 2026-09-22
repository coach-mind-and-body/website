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

/** Monday of the current Mountain Time week, YYYY-MM-DD. */
export function currentMonday(date = new Date()): string {
  const t = denverParts(date);
  const utc = Date.UTC(t.year, t.month - 1, t.day);
  const day = new Date(utc).getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(utc);
  monday.setUTCDate(monday.getUTCDate() + offset);
  return monday.toISOString().slice(0, 10);
}

export function weekRangeLabel(monday: string): string {
  const start = new Date(`${monday}T12:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const startLabel = fmt.format(start);
  const endSameMonth =
    start.getUTCMonth() === end.getUTCMonth()
      ? String(end.getUTCDate())
      : fmt.format(end);
  return `${startLabel} – ${endSameMonth}`;
}

export function denverNow() {
  return denverParts();
}

export function isoNow() {
  return new Date().toISOString();
}
