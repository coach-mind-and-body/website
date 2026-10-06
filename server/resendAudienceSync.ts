/**
 * Copy admin newsletter audiences into Resend segments and send one broadcast
 * per newsletter. Segments are the marketing lists. One-to-one mail stays on
 * the transactional API.
 */
import { Resend } from "resend";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import {
  applyBroadcastName,
  buildBroadcastHtml,
} from "./emails/newsletterShell";
import {
  resolveNewsletterAudience,
  type NewsletterAudienceGroup,
  type NewsletterRecipient,
} from "./newsletterAudience";

const PACE_MS = 550;

/**
 * Standing marketing lists. Resend's free plan allows 3 segments, and one
 * slot is already the existing "General" segment, so the combined admin list
 * uses that name. Finance and Challenge stay on one-to-one sends.
 */
export const RESEND_AUDIENCE_SEGMENTS: {
  group: NewsletterAudienceGroup;
  name: string;
}[] = [
  { group: "snack_hack", name: "Snack Hack" },
  { group: "health", name: "Health" },
  { group: "all", name: "General" },
];

export function usesMarketingBroadcast(group: string): boolean {
  return RESEND_AUDIENCE_SEGMENTS.some((row) => row.group === group);
}

type ContactError = { email: string; error: string };

export type AudienceSyncReport = {
  segments: { name: string; id: string; count: number }[];
  created: number;
  updated: number;
  addedToSegment: number;
  removedFromSegment: number;
  alreadyUnsubscribed: number;
  failed: ContactError[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function client() {
  if (!ENV.resendApiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(ENV.resendApiKey);
}

function errText(error: { message?: string } | null): string {
  return error?.message || "Resend error";
}

function alreadyThere(message: string): boolean {
  return /already/i.test(message);
}

function isRateLimit(
  error: { message?: string; name?: string; statusCode?: number | null } | null
): boolean {
  if (!error) return false;
  return (
    error.statusCode === 429 ||
    error.name === "rate_limit_exceeded" ||
    /rate limit|too many requests|\b429\b/i.test(error.message || "")
  );
}

async function paced<
  T extends { error: { message?: string; name?: string; statusCode?: number | null } | null },
>(fn: () => Promise<T>): Promise<T> {
  await sleep(PACE_MS);
  const first = await fn();
  if (!isRateLimit(first.error)) return first;
  await sleep(1500);
  return fn();
}

type ListedContact = {
  id: string;
  email: string;
  first_name: string | null;
  unsubscribed: boolean;
};

async function listContacts(
  resend: Resend,
  segmentId?: string
): Promise<ListedContact[]> {
  const all: ListedContact[] = [];
  let after: string | undefined;
  for (;;) {
    const { data, error } = await paced(() =>
      resend.contacts.list({
        limit: 100,
        ...(segmentId ? { segmentId } : {}),
        ...(after ? { after } : {}),
      })
    );
    if (error || !data) {
      throw new Error(errText(error));
    }
    all.push(...data.data);
    if (!data.has_more || data.data.length === 0) break;
    after = data.data[data.data.length - 1].id;
  }
  return all;
}

async function ensureSegment(resend: Resend, name: string): Promise<string> {
  const { data, error } = await paced(() => resend.segments.list({ limit: 100 }));
  if (error || !data) throw new Error(errText(error));
  const found = data.data.find((segment) => segment.name === name);
  if (found) return found.id;
  const created = await paced(() => resend.segments.create({ name }));
  if (created.error || !created.data) throw new Error(errText(created.error));
  return created.data.id;
}

function segmentName(group: NewsletterAudienceGroup): string {
  const match = RESEND_AUDIENCE_SEGMENTS.find((row) => row.group === group);
  if (!match) throw new Error(`No Resend segment for ${group}`);
  return match.name;
}

async function syncMembers(
  resend: Resend,
  segmentId: string,
  recipients: NewsletterRecipient[],
  known: Map<string, ListedContact>
): Promise<Pick<
  AudienceSyncReport,
  "created" | "updated" | "addedToSegment" | "removedFromSegment" | "alreadyUnsubscribed" | "failed"
>> {
  const report = {
    created: 0,
    updated: 0,
    addedToSegment: 0,
    removedFromSegment: 0,
    alreadyUnsubscribed: 0,
    failed: [] as ContactError[],
  };
  const wanted = new Map(recipients.map((row) => [row.email, row]));
  const members = await listContacts(resend, segmentId);
  const memberEmails = new Set(members.map((row) => row.email.toLowerCase()));

  for (const member of members) {
    const email = member.email.toLowerCase();
    known.set(email, member);
    if (wanted.has(email)) continue;
    const removed = await paced(() =>
      resend.contacts.segments.remove({ email, segmentId })
    );
    if (removed.error && !alreadyThere(errText(removed.error))) {
      report.failed.push({ email, error: errText(removed.error) });
      continue;
    }
    report.removedFromSegment++;
    memberEmails.delete(email);
  }

  for (const recipient of recipients) {
    const email = recipient.email;
    const existing = known.get(email);
    if (!existing) {
      const created = await paced(() =>
        resend.contacts.create({
          email,
          firstName: recipient.firstName,
          unsubscribed: false,
          segments: [{ id: segmentId }],
        })
      );
      if (created.error) {
        if (!alreadyThere(errText(created.error))) {
          report.failed.push({ email, error: errText(created.error) });
          continue;
        }
        const fetched = await paced(() => resend.contacts.get({ email }));
        if (fetched.data) {
          known.set(email, {
            id: fetched.data.id,
            email,
            first_name: fetched.data.first_name,
            unsubscribed: fetched.data.unsubscribed,
          });
        }
      } else {
        report.created++;
        report.addedToSegment++;
        known.set(email, {
          id: created.data?.id || "",
          email,
          first_name: recipient.firstName,
          unsubscribed: false,
        });
        memberEmails.add(email);
        continue;
      }
    }

    const current = known.get(email);
    if (current?.unsubscribed) report.alreadyUnsubscribed++;
    if (current && (current.first_name || "") !== recipient.firstName) {
      const updated = await paced(() =>
        resend.contacts.update({ email, firstName: recipient.firstName })
      );
      if (updated.error) {
        report.failed.push({ email, error: errText(updated.error) });
      } else {
        report.updated++;
        current.first_name = recipient.firstName;
      }
    }
    if (memberEmails.has(email)) continue;
    const added = await paced(() =>
      resend.contacts.segments.add({ email, segmentId })
    );
    if (added.error && !alreadyThere(errText(added.error))) {
      report.failed.push({ email, error: errText(added.error) });
      continue;
    }
    report.addedToSegment++;
    memberEmails.add(email);
  }

  return report;
}

function addReport(
  total: AudienceSyncReport,
  part: Omit<AudienceSyncReport, "segments">
) {
  total.created += part.created;
  total.updated += part.updated;
  total.addedToSegment += part.addedToSegment;
  total.removedFromSegment += part.removedFromSegment;
  total.alreadyUnsubscribed += part.alreadyUnsubscribed;
  total.failed.push(...part.failed);
}

/** Match Snack Hack, Health, and the combined list (General) in Resend. Does not send. */
export async function syncAllAdminAudiencesToResend(): Promise<AudienceSyncReport> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const resend = client();
  const known = new Map<string, ListedContact>();
  for (const contact of await listContacts(resend)) {
    known.set(contact.email.toLowerCase(), contact);
  }

  const report: AudienceSyncReport = {
    segments: [],
    created: 0,
    updated: 0,
    addedToSegment: 0,
    removedFromSegment: 0,
    alreadyUnsubscribed: 0,
    failed: [],
  };

  for (const audience of RESEND_AUDIENCE_SEGMENTS) {
    const segmentId = await ensureSegment(resend, audience.name);
    const recipients = await resolveNewsletterAudience(db, {
      audienceGroup: audience.group,
      excludeEnrolled: false,
      excludeEmails: [],
    });
    const part = await syncMembers(resend, segmentId, recipients, known);
    addReport(report, part);
    report.segments.push({
      name: audience.name,
      id: segmentId,
      count: recipients.length,
    });
    console.log(
      `[Resend] ${audience.name}: ${recipients.length} people, +${part.created} created, ${part.addedToSegment} added, ${part.failed.length} failed`
    );
  }

  return report;
}

export async function prepareNewsletterSegment(opts: {
  newsletterId: number;
  audienceGroup: NewsletterAudienceGroup;
  recipients: NewsletterRecipient[];
}): Promise<{ segmentId: string; failed: ContactError[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const resend = client();
  const known = new Map<string, ListedContact>();
  for (const contact of await listContacts(resend)) {
    known.set(contact.email.toLowerCase(), contact);
  }

  const full = await resolveNewsletterAudience(db, {
    audienceGroup: opts.audienceGroup,
    excludeEnrolled: false,
    excludeEmails: [],
  });
  const name = segmentName(opts.audienceGroup);
  const standingId = await ensureSegment(resend, name);
  const standing = await syncMembers(resend, standingId, full, known);
  const exactEmails = new Set(opts.recipients.map((row) => row.email));
  const sameList =
    full.length === opts.recipients.length &&
    full.every((row) => exactEmails.has(row.email));
  if (!sameList) {
    console.warn(
      `[Resend] Newsletter ${opts.newsletterId} goes to the full ${name} segment (${full.length} people). A smaller send needs another segment, and the free plan has none left.`
    );
  }
  return { segmentId: standingId, failed: standing.failed };
}

export async function sendNewsletterBroadcast(opts: {
  newsletterId: number;
  segmentId: string;
  subject: string;
  previewText?: string | null;
  html: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const resend = client();
  const subject = applyBroadcastName(opts.subject).slice(0, 500);
  const preview = opts.previewText
    ? applyBroadcastName(opts.previewText).slice(0, 200)
    : undefined;
  const { data, error } = await paced(() =>
    resend.broadcasts.create({
      name: `Newsletter ${opts.newsletterId}`.slice(0, 80),
      from: `Lee Anne — Mind and Body Reset Coaching <${ENV.resendFromEmail}>`,
      subject,
      html: opts.html,
      ...(preview ? { previewText: preview } : {}),
      segmentId: opts.segmentId,
      send: true,
    })
  );
  if (error || !data) return { ok: false, error: errText(error) };
  return { ok: true, id: data.id };
}

export { buildBroadcastHtml };
