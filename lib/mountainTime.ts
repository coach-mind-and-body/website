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