/**
 * Admin newsletter composer: draft, preview audience, test send, bulk send via Resend.
 */
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { emailNewsletters } from "../../drizzle/schema";
import { sanitizeHtml } from "../../lib/sanitizeHtml";
import { getDb } from "../db";
import { sendMarketingEmail } from "../emailMarketing";
import {
  buildNewsletterHtml,
  buildNewsletterPreviewDocument,
  personalizeNewsletterText,
} from "../emails/newsletterShell";
import { processSendingNewsletters } from "../newsletterJob";
import {
  countNewsletterAudience,
  type NewsletterAudienceGroup,
} from "../newsletterAudience";
import { storagePut } from "../storage";
import { adminProcedure, router } from "../_core/trpc";

const audienceGroupSchema = z.enum(["finance", "health", "all"]);

const composeFields = {
  subject: z.string().min(1).max(500),
  previewText: z.string().max(500).optional().nullable(),
  headline: z.string().max(500).optional().nullable(),
  subheadline: z.string().max(500).optional().nullable(),
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

  /** Live audience count + sample for the composer. */
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
      if (!db) return { total: 0, sample: [] as { email: string; firstName: string; source: string }[] };
      return countNewsletterAudience(db, {
        audienceGroup: input.audienceGroup as NewsletterAudienceGroup,
        excludeEnrolled: input.excludeEnrolled,
        excludeEmails: input.excludeEmails,
      });
    }),

  /** Server-rendered full HTML for the right-hand preview panel. */
  renderPreview: adminProcedure
    .input(
      z.object({
        headline: z.string().optional().nullable(),
        subheadline: z.string().optional().nullable(),
        bodyHtml: z.string(),
        ctaLabel: z.string().optional().nullable(),
        ctaUrl: z.string().optional().nullable(),
        firstName: z.string().optional(),
      })
    )
    .query(({ input }) => {
      const doc = buildNewsletterPreviewDocument({
        firstName: input.firstName || "there",
        headline: input.headline,
        subheadline: input.subheadline,
        bodyHtml: sanitizeHtml(input.bodyHtml || "<p></p>"),
        ctaLabel: input.ctaLabel,
        ctaUrl: input.ctaUrl,
        previewMode: true,
      });
      return { html: doc };
    }),

  saveDraft: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        ...composeFields,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const values = {
        subject: input.subject.trim(),
        previewText: emptyToNull(input.previewText),
        headline: emptyToNull(input.headline),
        subheadline: emptyToNull(input.subheadline),
        bodyHtml: sanitizeHtml(input.bodyHtml),
        ctaLabel: emptyToNull(input.ctaLabel),
        ctaUrl: emptyToNull(input.ctaUrl),
        audienceGroup: input.audienceGroup,
        excludeEnrolled: input.excludeEnrolled,
        excludeEmails: JSON.stringify(input.excludeEmails.map((e) => e.toLowerCase().trim())),
        status: "draft" as const,
        createdByUserId: ctx.user.id,
      };

      if (input.id) {
        const [existing] = await db
          .select()
          .from(emailNewsletters)
          .where(eq(emailNewsletters.id, input.id))
          .limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        if (existing.status === "sending" || existing.status === "sent") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can't edit a newsletter that is already sending or sent. Duplicate it as a new draft instead.",
          });
        }
        await db
          .update(emailNewsletters)
          .set(values)
          .where(eq(emailNewsletters.id, input.id));
        return { id: input.id };
      }

      const result = await db.insert(emailNewsletters).values(values);
      const id = Number(result[0].insertId);
      return { id };
    }),

  /** Send a single test email to the logged-in admin (or optional override). */
  sendTest: adminProcedure
    .input(
      z.object({
        ...composeFields,
        toEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const to = (input.toEmail || ctx.user.email || "").toLowerCase().trim();
      if (!to) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No email on your admin account. Enter a test address.",
        });
      }

      const firstName =
        ctx.user.name?.trim().split(/\s+/)[0] || "Lee Anne";
      const htmlBody = buildNewsletterHtml({
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
        bodyHtml: sanitizeHtml(input.bodyHtml),
        ctaLabel: input.ctaLabel
          ? personalizeNewsletterText(input.ctaLabel, firstName)
          : input.ctaLabel,
        ctaUrl: input.ctaUrl,
      });

      const rawSubject = personalizeNewsletterText(input.subject.trim(), firstName);
      const subject = rawSubject.startsWith("[TEST]")
        ? rawSubject
        : `[TEST] ${rawSubject}`;

      const ok = await sendMarketingEmail({
        to,
        toName: firstName,
        subject,
        htmlBody,
        reasonLine: "This is a test newsletter from the admin portal.",
      });

      if (!ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Test email failed to send. Check Resend configuration.",
        });
      }
      return { success: true, to };
    }),

  /** Queue bulk send: saves content, marks sending, kicks off worker. */
  send: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        ...composeFields,
        confirmPhrase: z.literal("SEND"),
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

      const values = {
        subject: input.subject.trim(),
        previewText: emptyToNull(input.previewText),
        headline: emptyToNull(input.headline),
        subheadline: emptyToNull(input.subheadline),
        bodyHtml: sanitizeHtml(input.bodyHtml),
        ctaLabel: emptyToNull(input.ctaLabel),
        ctaUrl: emptyToNull(input.ctaUrl),
        audienceGroup: input.audienceGroup,
        excludeEnrolled: input.excludeEnrolled,
        excludeEmails: JSON.stringify(input.excludeEmails.map((e) => e.toLowerCase().trim())),
        status: "sending" as const,
        recipientCount: audience.total,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        createdByUserId: ctx.user.id,
      };

      let id = input.id;
      if (id) {
        const [existing] = await db
          .select()
          .from(emailNewsletters)
          .where(eq(emailNewsletters.id, id))
          .limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        if (existing.status === "sending" || existing.status === "sent") {
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

      // Kick off immediately (worker also polls)
      setTimeout(() => {
        processSendingNewsletters().catch((e) =>
          console.error("[Newsletter] Immediate send failed:", e)
        );
      }, 100);

      return { id, recipientCount: audience.total };
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
      if (row.status !== "sending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only in-progress sends can be cancelled." });
      }
      await db
        .update(emailNewsletters)
        .set({ status: "cancelled" })
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
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cancel the send first, then delete." });
      }
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
});
