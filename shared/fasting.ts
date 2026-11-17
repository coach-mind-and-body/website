/** One fasting answer for a client on a calendar day. */
export type FastingDay = {
  dateStr: string;
  didFast: boolean;
  hours: number | null;
  notes: string | null;
  recorded: boolean;
};

export const FASTING_HOURS_MAX = 72;
export const FASTING_NOTES_MAX = 2000;

export function fastingHoursError(hours: number | null | undefined): string | null {
  if (hours == null) return null;
  if (!Number.isFinite(hours) || hours < 0 || hours > FASTING_HOURS_MAX) {
    return `Hours must be between 0 and ${FASTING_HOURS_MAX}.`;
  }
  const halves = Math.round(hours * 2);
  if (Math.abs(hours * 2 - halves) > 1e-6) {
    return "Use whole hours or halves, like 16 or 18.5.";
  }
  return null;
}

export function roundFastingHours(hours: number): number {
  return Math.round(hours * 2) / 2;
}

export function normalizeFastingInput(input: {
  dateStr: string;
  didFast: boolean;
  hours?: number | null;
  notes?: string | null;
}): FastingDay {
  const hoursError = fastingHoursError(input.hours ?? null);
  if (hoursError) {
    throw new Error(hoursError);
  }
  const notes = (input.notes ?? "").trim().slice(0, FASTING_NOTES_MAX);
  const hours =
    input.didFast && input.hours != null ? roundFastingHours(input.hours) : null;
  return {
    dateStr: input.dateStr,
    didFast: input.didFast,
    hours,
    notes: notes || null,
    recorded: true,
  };
}

export function emptyFastingDay(dateStr: string): FastingDay {
  return { dateStr, didFast: false, hours: null, notes: null, recorded: false };
}
