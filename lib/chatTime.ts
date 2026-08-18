export function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dayKey(value: Date | string | null | undefined): string {
  const date = asDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** iMessage-style day chip: Today / Yesterday / Tuesday / Tue, Aug 12. */
export function dayLabel(value: Date | string | null | undefined): string {
  const date = asDate(value);
  if (!date) return "";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startToday - startThat) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function messageTime(value: Date | string | null | undefined): string {
  const date = asDate(value);
  if (!date) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function quoteSnippet(text?: string | null, max = 90): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "Attachment";
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
