export const ADMIN_EMAILS = [
  "carter@inseitzmarketing.com",
  "coach@mindandbodyresetcoach.com",
];

export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase().trim()));
}
