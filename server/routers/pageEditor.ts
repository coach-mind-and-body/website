import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { pageContent } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
  }
}

export const pageEditorRouter = router({
  // Public: get published content for a page (visitors see this)
  getPublished: publicProcedure
    .input(z.object({ page: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {};
      const rows = await db
        .select()
        .from(pageContent)
        .where(eq(pageContent.page, input.page));
      const map: Record<string, string> = {};
      for (const row of rows) {
        if (row.publishedContent) {
          map[row.key] = row.publishedContent;
        }
      }
      return map;
    }),

  // Admin: get full content including drafts
  getAll: protectedProcedure
    .input(z.object({ page: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) return {};
      const rows = await db
        .select()
        .from(pageContent)
        .where(eq(pageContent.page, input.page));
      const map: Record<string, { published: string | null; draft: string | null; hasDraft: boolean }> = {};
      for (const row of rows) {
        map[row.key] = {
          published: row.publishedContent ?? null,
          draft: row.draftContent ?? null,
          hasDraft: row.hasDraft,
        };
      }
      return map;
    }),

  // Admin: check if any drafts exist for a page
  hasDrafts: protectedProcedure
    .input(z.object({ page: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) return false;
      const rows = await db
        .select()
        .from(pageContent)
        .where(and(eq(pageContent.page, input.page), eq(pageContent.hasDraft, true)));
      return rows.length > 0;
    }),

  // Admin: save a draft for a single content block
  saveDraft: protectedProcedure
    .input(z.object({
      page: z.string(),
      key: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await db
        .select()
        .from(pageContent)
        .where(and(eq(pageContent.page, input.page), eq(pageContent.key, input.key)));

      if (existing.length > 0) {
        await db
          .update(pageContent)
          .set({ draftContent: input.content, hasDraft: true })
          .where(and(eq(pageContent.page, input.page), eq(pageContent.key, input.key)));
      } else {
        await db.insert(pageContent).values({
          page: input.page,
          key: input.key,
          publishedContent: null,
          draftContent: input.content,
          hasDraft: true,
        });
      }
      return { success: true };
    }),

  // Admin: publish all drafts for a page
  publishPage: protectedProcedure
    .input(z.object({ page: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const drafts = await db
        .select()
        .from(pageContent)
        .where(and(eq(pageContent.page, input.page), eq(pageContent.hasDraft, true)));

      for (const row of drafts) {
        await db
          .update(pageContent)
          .set({ publishedContent: row.draftContent, draftContent: null, hasDraft: false })
          .where(eq(pageContent.id, row.id));
      }
      return { published: drafts.length };
    }),

  // Admin: discard all drafts for a page
  discardDrafts: protectedProcedure
    .input(z.object({ page: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const drafts = await db
        .select()
        .from(pageContent)
        .where(and(eq(pageContent.page, input.page), eq(pageContent.hasDraft, true)));

      for (const row of drafts) {
        await db
          .update(pageContent)
          .set({ draftContent: null, hasDraft: false })
          .where(eq(pageContent.id, row.id));
      }
      return { discarded: drafts.length };
    }),
});
