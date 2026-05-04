import { z } from "zod";
import { eq, desc, and, lte, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

export const blogRouter = router({
  // Public: list published posts (also auto-publishes scheduled posts that are due)
  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10), category: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Auto-publish any scheduled posts whose time has arrived
      const now = new Date();
      await db
        .update(blogPosts)
        .set({ published: true, publishedAt: now, scheduledAt: null })
        .where(
          and(
            eq(blogPosts.published, false),
            lte(blogPosts.scheduledAt, now),
            sql`${blogPosts.scheduledAt} IS NOT NULL`
          )
        );

      const conditions = [eq(blogPosts.published, true)];
      if (input.category) conditions.push(eq(blogPosts.category, input.category));
      return db
        .select()
        .from(blogPosts)
        .where(and(...conditions))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit);
    }),

  // Public: get single post by slug
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.published, true)))
        .limit(1);
      return result[0] ?? null;
    }),

  // Admin: list all posts (including drafts)
  adminList: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }),

  // Admin: get single post by id (including drafts)
  adminGetById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(blogPosts).where(eq(blogPosts.id, input.id)).limit(1);
      return result[0] ?? null;
    }),

  // Admin: create post
  create: protectedProcedure
    .input(z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      excerpt: z.string().optional(),
      content: z.string().min(1),
      category: z.string().optional(),
      coverImage: z.string().optional(),
      published: z.boolean().default(false),
      scheduledAt: z.string().optional(), // ISO string in UTC
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { scheduledAt: scheduledAtStr, ...rest } = input;
      const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : undefined;

      // If scheduling, don't publish immediately
      const isScheduled = !!scheduledAt && !rest.published;

      await db.insert(blogPosts).values({
        ...rest,
        published: isScheduled ? false : rest.published,
        authorId: ctx.user!.id,
        publishedAt: rest.published && !isScheduled ? new Date() : undefined,
        scheduledAt: isScheduled ? scheduledAt : undefined,
      });
      return { success: true, scheduled: isScheduled };
    }),

  // Admin: update post
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().optional(),
      title: z.string().optional(),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      category: z.string().optional(),
      coverImage: z.string().optional(),
      published: z.boolean().optional(),
      scheduledAt: z.string().nullable().optional(), // ISO string or null to clear
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, scheduledAt: scheduledAtStr, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };

      // Handle scheduling
      if (scheduledAtStr !== undefined) {
        if (scheduledAtStr === null) {
          updateData.scheduledAt = null;
        } else {
          updateData.scheduledAt = new Date(scheduledAtStr);
          // If scheduling for the future, ensure not published yet
          if (!rest.published) {
            updateData.published = false;
          }
        }
      }

      if (rest.published) {
        updateData.publishedAt = new Date();
        updateData.scheduledAt = null; // Clear schedule when publishing immediately
      }

      await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id));
      return { success: true };
    }),

  // Admin: delete post
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  // Admin: upload cover image to S3
  uploadImage: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      mimeType: z.string(),
      base64Data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const buffer = Buffer.from(input.base64Data, "base64");
      const ext = input.fileName.split(".").pop() ?? "jpg";
      const suffix = Math.random().toString(36).slice(2, 10);
      const fileKey = `blog-images/${suffix}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      return { url };
    }),

  // Public: list distinct categories from published posts
  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(sql`${blogPosts.category} IS NOT NULL AND ${blogPosts.category} != ''`);
    return rows.map(r => r.category).filter(Boolean) as string[];
  }),
});
