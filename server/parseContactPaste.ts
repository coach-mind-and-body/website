/**
 * Extract name + email pairs from messy paste (Dave Ramsey exports, Excel, CSV, etc.).
 */

export type ParsedContact = {
  email: string;
  firstName: string;
  rawLine?: string;
};

const EMAIL_RE =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function cleanNamePart(s: string): string {
  return s
    .replace(/[<>"'`]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,;|.\-–—:]+|[\s,;|.\-–—:]+$/g, "")
    .trim();
}

/** First name from "Jane Doe", "Doe, Jane", or single token */
export function firstNameFromDisplayName(name: string): string {
  const cleaned = cleanNamePart(name);
  if (!cleaned) return "";
  // "Doe, Jane" or "Doe, Jane M."
  if (cleaned.includes(",")) {
    const after = cleaned.split(",")[1]?.trim();
    if (after) return after.split(/\s+/)[0] || "";
  }
  // Drop titles
  const tokens = cleaned
    .replace(/^(mr|mrs|ms|miss|dr|prof)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return tokens[0] || "";
}

function looksLikePhone(token: string): boolean {
  const digits = token.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && /[\d()+.\-\s]/.test(token);
}

function looksLikeHeader(line: string): boolean {
  const l = line.toLowerCase();
  return (
    /^(name|first\s*name|last\s*name|email|e-mail|phone|member|contact)/i.test(l) &&
    !EMAIL_RE.test(line)
  );
}

/**
 * Parse one logical row that may already contain an email.
 */
function parseRow(line: string): ParsedContact | null {
  const trimmed = line.trim();
  if (!trimmed || looksLikeHeader(trimmed)) return null;

  const emails = trimmed.match(EMAIL_RE);
  if (!emails?.length) return null;

  // Prefer the first valid-looking email
  const email = normalizeEmail(emails[0]);
  if (!email.includes("@") || email.startsWith("@")) return null;

  // Prefer text *before* the email as the name (keeps "Doe, Jane" intact)
  const emailIdx = trimmed.search(EMAIL_RE);
  let nameRegion =
    emailIdx >= 0 ? trimmed.slice(0, emailIdx) : trimmed.replace(EMAIL_RE, " ");

  // Also fold any leftover after the email (rare)
  if (emailIdx >= 0) {
    const afterEmail = trimmed.slice(emailIdx).replace(EMAIL_RE, " ");
    if (afterEmail.trim() && !looksLikePhone(afterEmail.trim())) {
      // Only append if it looks like more name (not pure phone/junk)
      const afterClean = cleanNamePart(afterEmail.replace(/[<>|;]/g, " "));
      if (afterClean && /[a-zA-Z]{2,}/.test(afterClean) && !looksLikePhone(afterClean)) {
        nameRegion = `${nameRegion} ${afterClean}`;
      }
    }
  }

  nameRegion = nameRegion.replace(/[<>]/g, " ");
  // Tabs/pipes → space, but keep commas for "Last, First"
  nameRegion = nameRegion.replace(/[|\t;]+/g, " ");
  // CSV: "Jane Doe, email" → trailing comma only
  nameRegion = nameRegion.replace(/,\s*$/g, "");
  // Strip phone tokens
  nameRegion = nameRegion
    .split(/\s+/)
    .filter((t) => t && !looksLikePhone(t) && !/^https?:/i.test(t))
    .join(" ");
  nameRegion = cleanNamePart(nameRegion);

  let firstName = firstNameFromDisplayName(nameRegion);
  if (!firstName) {
    // Local-part fallback: jane.doe@ → Jane
    const local = email.split("@")[0] || "";
    const piece = local.split(/[._+\-]/)[0] || local;
    firstName = piece.charAt(0).toUpperCase() + piece.slice(1).toLowerCase();
  }

  return { email, firstName, rawLine: trimmed };
}

/**
 * Split paste into rows. Handles:
 * - Newlines
 * - Excel/CSV (tabs/commas) with one contact per line
 * - Multiple emails on one line → multiple contacts when possible
 */
export function parseContactPaste(raw: string): {
  contacts: ParsedContact[];
  skippedLines: number;
  duplicateEmails: number;
} {
  if (!raw?.trim()) {
    return { contacts: [], skippedLines: 0, duplicateEmails: 0 };
  }

  // Normalize Windows newlines; also split on semicolons that separate full records
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const contacts: ParsedContact[] = [];
  let skippedLines = 0;
  let duplicateEmails = 0;

  for (const line of lines) {
    if (looksLikeHeader(line)) {
      skippedLines++;
      continue;
    }

    const emails = line.match(EMAIL_RE);
    if (!emails?.length) {
      skippedLines++;
      continue;
    }

    if (emails.length === 1) {
      const parsed = parseRow(line);
      if (!parsed) {
        skippedLines++;
        continue;
      }
      if (seen.has(parsed.email)) {
        duplicateEmails++;
        continue;
      }
      seen.add(parsed.email);
      contacts.push(parsed);
      continue;
    }

    // Multiple emails on one line: try "Name email" pairs by splitting on emails
    // e.g. "Jane jane@x.com Bob bob@y.com"
    let work = line;
    for (const emailMatch of emails) {
      const idx = work.indexOf(emailMatch);
      if (idx < 0) continue;
      const before = work.slice(0, idx);
      const chunk = (before + " " + emailMatch).trim();
      const parsed = parseRow(chunk);
      work = work.slice(idx + emailMatch.length);
      if (!parsed) continue;
      if (seen.has(parsed.email)) {
        duplicateEmails++;
        continue;
      }
      seen.add(parsed.email);
      contacts.push(parsed);
    }
  }

  // If the whole paste was one blob with no newlines (rare), try splitting by email only
  if (contacts.length === 0 && raw.includes("@")) {
    const emails = raw.match(EMAIL_RE) ?? [];
    for (const e of emails) {
      const email = normalizeEmail(e);
      if (seen.has(email)) {
        duplicateEmails++;
        continue;
      }
      const local = email.split("@")[0] || "friend";
      const piece = local.split(/[._+\-]/)[0] || local;
      const firstName = piece.charAt(0).toUpperCase() + piece.slice(1).toLowerCase();
      seen.add(email);
      contacts.push({ email, firstName });
    }
  }

  return { contacts, skippedLines, duplicateEmails };
}
