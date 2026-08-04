/**
 * Admin newsletter composer: drafts, schedule, snippets, finance list, analytics.
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  emailNewsletters,
  emailNewsletterSends,
  emailNewsletterSnippets,
} from "../../drizzle/schema";
import { sanitizeHtml } from "../../lib/sanitizeHtml";
import { getDb } from "../db";
import { sendMarketingEmail } from "../emailMarketing";
import {
  buildNewsletterHtml,
  DEFAULT_GREETING,
  DEFAULT_SIGN_OFF_CLOSING,
  DEFAULT_SIGN_OFF_NAME,
  DEFAULT_SIGN_OFF_TITLE,
  personalizeNewsletterText,
} from "../emails/newsletterShell";
import { processSendingNewsletters } from "../newsletterJob";
import {
  addFinanceContact,
  bulkAddFinanceContacts,
  countNewsletterAudience,
  listFinanceContacts,
  removeFinanceContact,
  type NewsletterAudienceGroup,
} from "../newsletterAudience";
import { parseContactPaste } from "../parseContactPaste";
import { storagePut } from "../storage";
import { adminProcedure, router } from "../_core/trpc";

const audienceGroupSchema = z.enum(["finance", "health", "all", "snack_hack"]);

const composeFields = {
  subject: z.string().min(1).max(500),
  previewText: z.string().max(500).optional().nullable(),
  headline: z.string().max(500).optional().nullable(),
  subheadline: z.string().max(500).optional().nullable(),
  greetingTemplate: z.string().max(500).optional().nullable(),
  signOffClosing: z.string().max(255).optional().nullable(),
  signOffName: z.string().max(255).optional().nullable(),
  signOffTitle: z.string().max(500).optional().nullable(),
  bodyHtml: z.string().min(1),
  ctaLabel: z.string().max(255).optional().nullable(),
  ctaUrl: z.string().max(1000).optional().nullable(),
  audienceGroup: audienceGroupSchema.default("health"),
  excludeEnrolled: z.boolean().default(false),
  excludeEmails: z.array(z.string().email()).max(500).default([]),
};

function emptyToNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length ? t : null;
}

function composeValues(
  input: z.infer<z.ZodObject<typeof composeFields>>,
  extra: Record<string, unknown> = {}
) {
  return {
    subject: input.subject.trim(),
    previewText: emptyToNull(input.previewText),
    headline: emptyToNull(input.headline),
    subheadline: emptyToNull(input.subheadline),
    greetingTemplate:
      input.greetingTemplate === undefined || input.greetingTemplate === null
        ? DEFAULT_GREETING
        : input.greetingTemplate,
    signOffClosing:
      input.signOffClosing === undefined || input.signOffClosing === null
        ? DEFAULT_SIGN_OFF_CLOSING
        : input.signOffClosing,
    signOffName:
      input.signOffName === undefined || input.signOffName === null
        ? DEFAULT_SIGN_OFF_NAME
        : input.signOffName,
    signOffTitle:
      input.signOffTitle === undefined || input.signOffTitle === null
        ? DEFAULT_SIGN_OFF_TITLE
        : input.signOffTitle,
    bodyHtml: sanitizeHtml(input.bodyHtml),
    ctaLabel: emptyToNull(input.ctaLabel),
    ctaUrl: emptyToNull(input.ctaUrl),
    audienceGroup: input.audienceGroup,
    excludeEnrolled: input.excludeEnrolled,
    excludeEmails: JSON.stringify(
      input.excludeEmails.map((e) => e.toLowerCase().trim())
    ),
    ...extra,
  };
}

function shellFromInput(input: {
  greetingTemplate?: string | null;
  signOffClosing?: string | null;
  signOffName?: string | null;
  signOffTitle?: string | null;
  previewText?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  bodyHtml: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}, firstName: string) {
  return buildNewsletterHtml({
    firstName,
    previewText: input.previewText
      ? personalizeNewsletterText(input.previewText, firstName)
      : input.previewText,
    headline: input.headline
      ? personalizeNewsletterText(input.headline, firstName)
      : input.headline,
    subheadline: input.subheadline
      ? personalizeNewsletterText(input.subheadline, firstName)
      : input.subheadline,
    greetingTemplate: input.greetingTemplate,
    signOffClosing: input.signOffClosing,
    signOffName: input.signOffName,
    signOffTitle: input.signOffTitle,
    bodyHtml: sanitizeHtml(input.bodyHtml),
    ctaLabel: input.ctaLabel
      ? personalizeNewsletterText(input.ctaLabel, firstName)
      : input.ctaLabel,
    ctaUrl: input.ctaUrl,
  });
}

export const newsletterRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(emailNewsletters)
      .orderBy(desc(emailNewsletters.createdAt))
      .limit(50);
  }),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [row] = await db
        .select()
        .from(emailNewsletters)
        .where(eq(emailNewsletters.id, input.id))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
      return row;
    }),

  audiencePreview: adminProcedure
    .input(
      z.object({
        audienceGroup: audienceGroupSchema,
        excludeEnrolled: z.boolean().default(false),
        excludeEmails: z.array(z.string()).max(500).default([]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        return {
          total: 0,
          sample: [] as { email: string; firstName: string; source: string }[],
        };
      return countNewsletterAudience(db, {
        audienceGroup: input.audienceGroup as NewsletterAudienceGroup,
        excludeEnrolled: input.excludeEnrolled,
        excludeEmails: input.excludeEmails,
      });
    }),

  saveDraft: adminProcedure
    .input(z.object({ id: z.number().optional(), ...composeFields }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const values = composeValues(input, {
        status: "draft" as const,
        scheduledAt: null,
        createdByUserId: ctx.user.id,
      });

      if (input.id) {
        const [existing] = await db
          .select()
          .from(emailNewsletters)
          .where(eq(emailNewsletters.id, input.id))
          .limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        if (
          existing.status === "sending" ||
          existing.status === "sent" ||
          existing.status === "scheduled"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Can't edit a newsletter that is scheduled, sending, or sent. Duplicate it as a new draft instead.",
          });
        }
        await db
          .update(emailNewsletters)
          .set(values)
          .where(eq(emailNewsletters.id, input.id));
        return { id: input.id };
      }

      const result = await db.insert(emailNewsletters).values(values);
      return { id: Number(result[0].insertId) };
    }),

  sendTest: adminProcedure
    .input(z.object({ ...composeFields, toEmail: z.string().email().optional() }))
    .mutation(async ({ ctx, input }) => {
      const to = (input.toEmail || ctx.user.email || "").toLowerCase().trim();
      if (!to) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No email on your admin account. Enter a test address.",
        });
      }

      const firstName = ctx.user.name?.trim().split(/\s+/)[0] || "Lee Anne";
      const htmlBody = shellFromInput(input, firstName);
      const rawSubject = personalizeNewsletterText(input.subject.trim(), firstName);
      const subject = rawSubject.startsWith("[TEST]")
        ? rawSubject
        : `[TEST] ${rawSubject}`;

      const result = await sendMarketingEmail({
        to,
        toName: firstName,
        subject,
        htmlBody,
        reasonLine: "This is a test newsletter from the admin portal.",
        tags: [{ name: "type", value: "newsletter_test" }],
      });

      if (!result.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Test email failed to send. Check Resend configuration.",
        });
      }
      return {
        success: true,
        to,
        personalizedAs: firstName,
        resendEmailId: result.resendEmailId ?? null,
      };
    }),

  /** Immediate or scheduled bulk send */
  send: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        ...composeFields,
        confirmPhrase: z.literal("SEND"),
        /** ISO string — if set, schedule instead of sending now */
        scheduledAt: z.string().datetime().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const audience = await countNewsletterAudience(db, {
        audienceGroup: input.audienceGroup,
        excludeEnrolled: input.excludeEnrolled,
        excludeEmails: input.excludeEmails,
      });

      if (audience.total === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No recipients match this audience. Adjust groups or exclusions.",
        });
      }

      const scheduleDate = input.scheduledAt ? new Date(input.scheduledAt) : null;
      if (scheduleDate && scheduleDate.getTime() <= Date.now() + 30_000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Scheduled time must be at least 1 minute in the future.",
        });
      }

      const isSchedule = !!scheduleDate;
      const values = composeValues(input, {
        status: (isSchedule ? "scheduled" : "sending") as "scheduled" | "sending",
        scheduledAt: scheduleDate,
        recipientCount: audience.total,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        createdByUserId: ctx.user.id,
      });

      let id = input.id;
      if (id) {
        const [existing] = await db
          .select()
          .from(emailNewsletters)
          .where(eq(emailNewsletters.id, id))
          .limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        if (
          existing.status === "sending" ||
          existing.status === "sent"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This newsletter was already sent or is currently sending.",
          });
        }
        await db.update(emailNewsletters).set(values).where(eq(emailNewsletters.id, id));
      } else {
        const result = await db.insert(emailNewsletters).values(values);
        id = Number(result[0].insertId);
      }

      if (!isSchedule) {
        setTimeout(() => {
          processSendingNewsletters().catch((e) =>
            console.error("[Newsletter] Immediate send failed:", e)
          );
        }, 100);
      }

      return {
        id,
        recipientCount: audience.total,
        scheduled: isSchedule,
        scheduledAt: scheduleDate?.toISOString() ?? null,
      };
    }),

  cancel: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [row] = await db
        .select()
        .from(emailNewsletters)
        .where(eq(emailNewsletters.id, input.id))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      if (row.status !== "sending" && row.status !== "scheduled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only scheduled or in-progress sends can be cancelled.",
        });
      }
      await db
        .update(emailNewsletters)
        .set({ status: "cancelled", scheduledAt: null })
        .where(eq(emailNewsletters.id, input.id));
      return { success: true };
    }),

  deleteDraft: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [row] = await db
        .select()
        .from(emailNewsletters)
        .where(eq(emailNewsletters.id, input.id))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      if (row.status === "sending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cancel the send first, then delete.",
        });
      }
      await db
        .delete(emailNewsletterSends)
        .where(eq(emailNewsletterSends.newsletterId, input.id));
      await db.delete(emailNewsletters).where(eq(emailNewsletters.id, input.id));
      return { success: true };
    }),

  uploadImage: adminProcedure
    .input(
      z.object({
        fileName: z.string(),
        mimeType: z.string(),
        base64Data: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.mimeType.startsWith("image/")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only images are allowed." });
      }
      const buffer = Buffer.from(input.base64Data, "base64");
      if (buffer.length > 5 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be under 5 MB." });
      }
      const ext = input.fileName.split(".").pop() ?? "jpg";
      const suffix = Math.random().toString(36).slice(2, 10);
      const fileKey = `newsletter-images/${suffix}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      return { url };
    }),

  // ── Snippets ──────────────────────────────────────────────────────────────
  listSnippets: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(emailNewsletterSnippets)
      .orderBy(desc(emailNewsletterSnippets.updatedAt));
  }),

  saveSnippet: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1).max(255),
        bodyHtml: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const bodyHtml = sanitizeHtml(input.bodyHtml);
      if (input.id) {
        await db
          .update(emailNewsletterSnippets)
          .set({ name: input.name.trim(), bodyHtml })
          .where(eq(emailNewsletterSnippets.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(emailNewsletterSnippets).values({
        name: input.name.trim(),
        bodyHtml,
        createdByUserId: ctx.user.id,
      });
      return { id: Number(result[0].insertId) };
    }),

  deleteSnippet: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(emailNewsletterSnippets)
        .where(eq(emailNewsletterSnippets.id, input.id));
      return { success: true };
    }),

  // ── Finance list ──────────────────────────────────────────────────────────
  listFinance: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return listFinanceContacts(db);
  }),

  addFinance: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        return await addFinanceContact(db, input.email, input.firstName);
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Could not add contact",
        });
      }
    }),

  /** Preview parse only — no DB writes. Paste from Dave Ramsey / Excel / etc. */
  parseFinancePaste: adminProcedure
    .input(z.object({ text: z.string().max(500_000) }))
    .mutation(({ input }) => {
      const result = parseContactPaste(input.text);
      return {
        contacts: result.contacts.map((c) => ({
          email: c.email,
          firstName: c.firstName,
        })),
        skippedLines: result.skippedLines,
        duplicateEmails: result.duplicateEmails,
        total: result.contacts.length,
      };
    }),

  /** Bulk import after review (or direct from paste text). */
  bulkAddFinance: adminProcedure
    .input(
      z.object({
        contacts: z
          .array(
            z.object({
              email: z.string().email(),
              firstName: z.string().max(255).optional(),
            })
          )
          .max(2000)
          .optional(),
        /** Optional: raw paste — server will parse if contacts not provided */
        text: z.string().max(500_000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let contacts = input.contacts ?? [];
      if ((!contacts.length) && input.text?.trim()) {
        contacts = parseContactPaste(input.text).contacts.map((c) => ({
          email: c.email,
          firstName: c.firstName,
        }));
      }
      if (!contacts.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid emails found to import.",
        });
      }

      const result = await bulkAddFinanceContacts(db, contacts);
      return { ...result, total: contacts.length };
    }),

  removeFinance: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await removeFinanceContact(db, input.email);
      return { success: true };
    }),

  // ── Analytics & history ───────────────────────────────────────────────────
  analytics: adminProcedure.query(async () => {
    const empty = {
      last30Days: {
        sent: 0,
        failed: 0,
        skipped: 0,
        campaigns: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
      },
      byAudience: [] as {
        audience: string;
        sent: number;
        campaigns: number;
        opened: number;
        clicked: number;
      }[],
      recent: [] as {
        id: number;
        subject: string;
        audienceGroup: string;
        status: string;
        sentCount: number;
        failedCount: number;
        skippedCount: number;
        recipientCount: number;
        sentAt: Date | null;
        delivered: number;
        opened: number;
        clicked: number;
        bounced: number;
        deliveryRate: number;
        openRate: number;
        clickRate: number;
      }[],
      trackingReady: false,
    };

    const db = await getDb();
    if (!db) return empty;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCampaigns = await db
      .select()
      .from(emailNewsletters)
      .where(
        or(
          and(eq(emailNewsletters.status, "sent"), gte(emailNewsletters.sentAt, since)),
          and(eq(emailNewsletters.status, "failed"), gte(emailNewsletters.updatedAt, since))
        )
      )
      .orderBy(desc(emailNewsletters.sentAt));

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const byAudienceMap = new Map<
      string,
      { sent: number; campaigns: number; opened: number; clicked: number }
    >();

    for (const c of recentCampaigns) {
      sent += c.sentCount ?? 0;
      failed += c.failedCount ?? 0;
      skipped += c.skippedCount ?? 0;
      const key = c.audienceGroup;
      const cur = byAudienceMap.get(key) ?? {
        sent: 0,
        campaigns: 0,
        opened: 0,
        clicked: 0,
      };
      cur.sent += c.sentCount ?? 0;
      cur.campaigns += 1;
      byAudienceMap.set(key, cur);
    }

    // Aggregate engagement for last 30 days from send log
    const engagementRows = await db
      .select({
        newsletterId: emailNewsletterSends.newsletterId,
        delivered: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.deliveryStatus} = 'delivered' OR ${emailNewsletterSends.openCount} > 0 OR ${emailNewsletterSends.clickCount} > 0 THEN 1 ELSE 0 END)`,
        opened: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.openCount} > 0 THEN 1 ELSE 0 END)`,
        clicked: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.clickCount} > 0 THEN 1 ELSE 0 END)`,
        bounced: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.deliveryStatus} = 'bounced' THEN 1 ELSE 0 END)`,
        withResendId: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.resendEmailId} IS NOT NULL THEN 1 ELSE 0 END)`,
      })
      .from(emailNewsletterSends)
      .innerJoin(
        emailNewsletters,
        eq(emailNewsletters.id, emailNewsletterSends.newsletterId)
      )
      .where(
        and(
          eq(emailNewsletterSends.status, "sent"),
          gte(emailNewsletterSends.sentAt, since)
        )
      )
      .groupBy(emailNewsletterSends.newsletterId);

    let delivered = 0;
    let opened = 0;
    let clicked = 0;
    let bounced = 0;
    let withResendId = 0;
    const engByNl = new Map<
      number,
      { delivered: number; opened: number; clicked: number; bounced: number }
    >();

    for (const r of engagementRows) {
      const d = Number(r.delivered) || 0;
      const o = Number(r.opened) || 0;
      const c = Number(r.clicked) || 0;
      const b = Number(r.bounced) || 0;
      delivered += d;
      opened += o;
      clicked += c;
      bounced += b;
      withResendId += Number(r.withResendId) || 0;
      engByNl.set(r.newsletterId, { delivered: d, opened: o, clicked: c, bounced: b });
    }

    // Roll engagement into audience map
    for (const c of recentCampaigns) {
      const eng = engByNl.get(c.id);
      if (!eng) continue;
      const cur = byAudienceMap.get(c.audienceGroup);
      if (cur) {
        cur.opened += eng.opened;
        cur.clicked += eng.clicked;
      }
    }

    const recentRaw = await db
      .select({
        id: emailNewsletters.id,
        subject: emailNewsletters.subject,
        audienceGroup: emailNewsletters.audienceGroup,
        status: emailNewsletters.status,
        sentCount: emailNewsletters.sentCount,
        failedCount: emailNewsletters.failedCount,
        skippedCount: emailNewsletters.skippedCount,
        recipientCount: emailNewsletters.recipientCount,
        sentAt: emailNewsletters.sentAt,
      })
      .from(emailNewsletters)
      .where(eq(emailNewsletters.status, "sent"))
      .orderBy(desc(emailNewsletters.sentAt))
      .limit(15);

    const recent = recentRaw.map((n) => {
      const eng = engByNl.get(n.id) ?? {
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
      };
      // For campaigns outside 30d window, eng may be empty — fetch not needed for list; rates 0 is ok
      // Re-query would be heavy; for recent list we use eng when available
      const denom = n.sentCount || 0;
      return {
        ...n,
        delivered: eng.delivered,
        opened: eng.opened,
        clicked: eng.clicked,
        bounced: eng.bounced,
        deliveryRate: denom ? Math.round((eng.delivered / denom) * 1000) / 10 : 0,
        openRate: denom ? Math.round((eng.opened / denom) * 1000) / 10 : 0,
        clickRate: denom ? Math.round((eng.clicked / denom) * 1000) / 10 : 0,
      };
    });

    // Fill engagement for recent campaigns not in 30d agg (older than 30d)
    for (const n of recent) {
      if (n.delivered || n.opened || n.clicked || !n.id) continue;
      const [row] = await db
        .select({
          delivered: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.deliveryStatus} = 'delivered' OR ${emailNewsletterSends.openCount} > 0 OR ${emailNewsletterSends.clickCount} > 0 THEN 1 ELSE 0 END)`,
          opened: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.openCount} > 0 THEN 1 ELSE 0 END)`,
          clicked: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.clickCount} > 0 THEN 1 ELSE 0 END)`,
          bounced: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.deliveryStatus} = 'bounced' THEN 1 ELSE 0 END)`,
        })
        .from(emailNewsletterSends)
        .where(
          and(
            eq(emailNewsletterSends.newsletterId, n.id),
            eq(emailNewsletterSends.status, "sent")
          )
        );
      if (row) {
        n.delivered = Number(row.delivered) || 0;
        n.opened = Number(row.opened) || 0;
        n.clicked = Number(row.clicked) || 0;
        n.bounced = Number(row.bounced) || 0;
        const denom = n.sentCount || 0;
        n.deliveryRate = denom ? Math.round((n.delivered / denom) * 1000) / 10 : 0;
        n.openRate = denom ? Math.round((n.opened / denom) * 1000) / 10 : 0;
        n.clickRate = denom ? Math.round((n.clicked / denom) * 1000) / 10 : 0;
      }
    }

    return {
      last30Days: {
        sent,
        failed,
        skipped,
        campaigns: recentCampaigns.length,
        delivered,
        opened,
        clicked,
        bounced,
        deliveryRate: sent ? Math.round((delivered / sent) * 1000) / 10 : 0,
        openRate: sent ? Math.round((opened / sent) * 1000) / 10 : 0,
        clickRate: sent ? Math.round((clicked / sent) * 1000) / 10 : 0,
      },
      byAudience: Array.from(byAudienceMap.entries()).map(([audience, v]) => ({
        audience,
        ...v,
      })),
      recent,
      trackingReady: withResendId > 0,
    };
  }),

  /** Who received a specific newsletter (+ Resend engagement) */
  sendLog: adminProcedure
    .input(
      z.object({
        newsletterId: z.number(),
        status: z.enum(["sent", "failed", "skipped"]).optional(),
        limit: z.number().min(1).max(500).default(200),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(emailNewsletterSends.newsletterId, input.newsletterId)];
      if (input.status) conditions.push(eq(emailNewsletterSends.status, input.status));
      return db
        .select()
        .from(emailNewsletterSends)
        .where(and(...conditions))
        .orderBy(desc(emailNewsletterSends.sentAt))
        .limit(input.limit);
    }),

  /** Campaign-level Resend stats for one newsletter */
  campaignStats: adminProcedure
    .input(z.object({ newsletterId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          complained: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
        };
      }
      const [row] = await db
        .select({
          sent: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.status} = 'sent' THEN 1 ELSE 0 END)`,
          delivered: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.deliveryStatus} = 'delivered' OR ${emailNewsletterSends.openCount} > 0 OR ${emailNewsletterSends.clickCount} > 0 THEN 1 ELSE 0 END)`,
          opened: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.openCount} > 0 THEN 1 ELSE 0 END)`,
          clicked: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.clickCount} > 0 THEN 1 ELSE 0 END)`,
          bounced: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.deliveryStatus} = 'bounced' THEN 1 ELSE 0 END)`,
          complained: sql<number>`SUM(CASE WHEN ${emailNewsletterSends.deliveryStatus} = 'complained' THEN 1 ELSE 0 END)`,
        })
        .from(emailNewsletterSends)
        .where(eq(emailNewsletterSends.newsletterId, input.newsletterId));

      const sent = Number(row?.sent) || 0;
      const delivered = Number(row?.delivered) || 0;
      const opened = Number(row?.opened) || 0;
      const clicked = Number(row?.clicked) || 0;
      const bounced = Number(row?.bounced) || 0;
      const complained = Number(row?.complained) || 0;
      return {
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        complained,
        deliveryRate: sent ? Math.round((delivered / sent) * 1000) / 10 : 0,
        openRate: sent ? Math.round((opened / sent) * 1000) / 10 : 0,
        clickRate: sent ? Math.round((clicked / sent) * 1000) / 10 : 0,
      };
    }),

  /** History for one person across all newsletters */
  personHistory: adminProcedure
    .input(z.object({ query: z.string().min(2).max(320) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = `%${input.query.toLowerCase().trim()}%`;
      const rows = await db
        .select({
          sendId: emailNewsletterSends.id,
          email: emailNewsletterSends.email,
          firstName: emailNewsletterSends.firstName,
          status: emailNewsletterSends.status,
          deliveryStatus: emailNewsletterSends.deliveryStatus,
          openCount: emailNewsletterSends.openCount,
          clickCount: emailNewsletterSends.clickCount,
          errorMessage: emailNewsletterSends.errorMessage,
          sentAt: emailNewsletterSends.sentAt,
          firstOpenedAt: emailNewsletterSends.firstOpenedAt,
          firstClickedAt: emailNewsletterSends.firstClickedAt,
          newsletterId: emailNewsletters.id,
          subject: emailNewsletters.subject,
          audienceGroup: emailNewsletters.audienceGroup,
        })
        .from(emailNewsletterSends)
        .innerJoin(
          emailNewsletters,
          eq(emailNewsletters.id, emailNewsletterSends.newsletterId)
        )
        .where(
          or(
            like(sql`LOWER(${emailNewsletterSends.email})`, q),
            like(sql`LOWER(COALESCE(${emailNewsletterSends.firstName}, ''))`, q)
          )
        )
        .orderBy(desc(emailNewsletterSends.sentAt))
        .limit(100);
      return rows;
    }),
});
