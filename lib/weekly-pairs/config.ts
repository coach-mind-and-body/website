export const APP_NAME = "This Week";
export const TZ = "America/Denver";

export const SEED_NAMES = [
  "Jaycee",
  "Judy",
  "Lee Anne",
  "Chrissy",
  "Dianne",
  "Nicole",
  "Jennifer",
  "Sherylee",
  "Sherry",
  "Mary",
  "Marianne",
  "Gina",
  "Kelly F.",
  "Brenda",
  "Mckenna",
  "Amanda",
  "Carrie",
  "Shannon",
  "Emilie",
  "Anna",
  "Alex",
  "Catherine",
  "Jeanette",
  "Amy",
] as const;

export function groupName() {
  return process.env.GROUP_NAME?.trim() || "the coaching group";
}

export function adminPassword() {
  return process.env.WEEKLY_PAIRS_ADMIN_PASSWORD?.trim() || process.env.ADMIN_PASSWORD?.trim() || "";
}

export function adminSecret() {
  return process.env.ADMIN_SECRET?.trim() || adminPassword() || "dev-only-change-me";
}

export function cronSecret() {
  return process.env.CRON_SECRET?.trim() || "";
}
