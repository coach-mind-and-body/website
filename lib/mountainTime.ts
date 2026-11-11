const MOUNTAIN_TZ = "America/Denver";

function formatMountainLocal(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MOUNTAIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function parseLocalDatetime(localDatetime: string) {
  const [datePart, timePart] = localDatetime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return { year, month, day, hour, minute };
}

function localToComparableMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): number {
  return Date.UTC(year, month - 1, day, hour, minute);
}

/** Convert a Mountain Time local datetime string ("YYYY-MM-DDTHH:MM") to UTC ISO. */
export function mountainToUtc(localDatetime: string): string {
  const target = localDatetime.slice(0, 16);
  const { year, month, day, hour, minute } = parseLocalDatetime(target);
  const targetMs = localToComparableMs(year, month, day, hour, minute);

  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  for (let i = 0; i < 6; i++) {
    const formatted = formatMountainLocal(utc);
    if (formatted === target) {
      return utc.toISOString();
    }

    const f = parseLocalDatetime(formatted);
    const formattedMs = localToComparableMs(f.year, f.month, f.day, f.hour, f.minute);
    const diffMs = targetMs - formattedMs;
    utc = new Date(utc.getTime() + diffMs);
  }

  return utc.toISOString();
}

/** Convert a UTC ISO string to Mountain Time local datetime string for datetime-local inputs. */
export function utcToMountain(utcIso: string): string {
  const date = new Date(utcIso);
  return formatMountainLocal(date);
}

/** Current Mountain Time as a datetime-local string. */
export function nowMountain(): string {
  return utcToMountain(new Date().toISOString());
}

/** Returns the current Mountain Time as a date string ("YYYY-MM-DD") */
export function todayMountainDateStr(): string {
  return nowMountain().slice(0, 10);
}

/** Converts a given Date object to a Mountain Time date string ("YYYY-MM-DD") */
export function dateToMountainDateStr(date: Date): string {
  return utcToMountain(date.toISOString()).slice(0, 10);
}

/**
 * Calendar day stored in a MySQL DATE column.
 * mysql2 returns those as local-midnight Date objects, and "2026-10-03" > that Date is never true.
 */
export function calendarDateStr(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
  }
  if (typeof value === "string") {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
    return match?.[1] ?? null;
  }
  return null;
}