import { differenceInDays, parseISO, subDays } from "date-fns";
import { todayMountainDateStr } from "./mountainTime";

/** Calendar YMD from a Date constructed as local noon of a Denver day. */
export function calendarDateStr(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Parse YYYY-MM-DD as local noon (stable for day walking). */
export function parseCalendarDate(dateStr: string): Date {
  return parseISO(`${dateStr}T12:00:00`);
}

/**
 * Current streak: walk backward from Denver today.
 * A day counts if it appears in completedDates (any-habit rule).
 * Skips empty "today" so the streak doesn't break before end of day.
 */
export function calculateCurrentStreak(completedDates: Set<string> | string[]): number {
  const set = completedDates instanceof Set ? completedDates : new Set(completedDates);
  const todayStr = todayMountainDateStr();
  let checkDate = parseCalendarDate(todayStr);
  let streak = 0;

  while (true) {
    const dStr = calendarDateStr(checkDate);
    if (set.has(dStr)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else if (dStr === todayStr) {
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Longest historical streak from a set of completed calendar days (YYYY-MM-DD).
 * Used so Trophy Case stays unlocked after a streak breaks.
 */
export function calculateMaxStreak(completedDates: Set<string> | string[]): number {
  const set = completedDates instanceof Set ? completedDates : new Set(completedDates);
  if (set.size === 0) return 0;

  const sorted = Array.from(set).sort();
  let max = 1;
  let cur = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = parseCalendarDate(sorted[i - 1]);
    const curr = parseCalendarDate(sorted[i]);
    const diff = differenceInDays(curr, prev);
    if (diff === 1) {
      cur++;
      max = Math.max(max, cur);
    } else if (diff > 1) {
      cur = 1;
    }
  }
  return max;
}
