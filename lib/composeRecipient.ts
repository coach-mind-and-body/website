export type ComposeContactHit = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  designation?: string;
  userId: number | null;
};

/** Resolve the phone to send to from typed query + optional selected contact. */
export function resolveComposeRecipientPhone(
  query: string,
  selected: ComposeContactHit | null
): string | null {
  if (selected?.phone?.trim()) return selected.phone.trim();
  const digits = query.replace(/\D/g, "");
  if (digits.length >= 10) return query.trim();
  return null;
}