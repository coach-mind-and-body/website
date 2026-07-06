/** Strip formatting and leading US country code; returns digits only (no leading 1). */
export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^1/, "");
}

/** Normalize to E.164 for Twilio (+1XXXXXXXXXX for US numbers). */
export function formatPhoneE164(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

/** Friendly US display: (435) 828-5621 */
export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone.trim();
}

export function isValidUsPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}