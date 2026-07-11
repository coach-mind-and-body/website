import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { clientFiles, commonFiles, enrollments } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export const clientFilesRouter = router({
  // List files for an enrollment (client sees their own, admin sees any)
  list: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      // Clients can only see their own enrollment's files
      if (ctx.user!.role !== "admin") {
        const [enrollment] = await db
          .select()
          .from(enrollments)
          .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user!.id)));
        if (!enrollment) throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db
        .select()
        .from(clientFiles)
        .where(eq(clientFiles.enrollmentId, input.enrollmentId));
    }),

  // Upload a file (base64 encoded)
  upload: protectedProcedure
    .input(z.object({
      enrollmentId: z.number(),
      fileName: z.string(),
      mimeType: z.string(),
      base64Data: z.string(), // base64-encoded file content
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Clients can only upload to their own enrollment
      if (ctx.user!.role !== "admin") {
        const [enrollment] = await db
          .select()
          .from(enrollments)
          .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user!.id)));
        if (!enrollment) throw new TRPCError({ code: "FORBIDDEN" });
      }

      const buffer = Buffer.from(input.base64Data, "base64");
      const ext = input.fileName.split(".").pop() ?? "bin";
      const fileKey = `client-files/${input.enrollmentId}/${randomSuffix()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      const [inserted] = await db
        .insert(clientFiles)
        .values({
          enrollmentId: input.enrollmentId,
          uploadedByUserId: ctx.user!.id,
          uploadedByRole: ctx.user!.role === "admin" ? "admin" : "client",
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
        })
        .$returningId();

      return { id: inserted.id, url, fileName: input.fileName };
    }),

  // Delete a file (admin only)
  delete: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(clientFiles).where(eq(clientFiles.id, input.fileId));
      return { success: true };
    }),

  // ── Shared library (common files) ─────────────────────────────────────────

  /** Admin: list reusable files for "Share file" */
  listCommon: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(commonFiles).orderBy(desc(commonFiles.createdAt));
  }),

  /** Admin: upload into shared library */
  uploadCommon: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        mimeType: z.string(),
        base64Data: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const buffer = Buffer.from(input.base64Data, "base64");
      if (buffer.length > 10 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "File must be under 10 MB" });
      }
      const ext = input.fileName.split(".").pop() ?? "bin";
      const fileKey = `common-files/${randomSuffix()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      const [inserted] = await db
        .insert(commonFiles)
        .values({
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
          uploadedByUserId: ctx.user!.id,
        })
        .$returningId();

      return { id: inserted.id, url, fileName: input.fileName };
    }),

  /** Admin: remove from library (does not delete already-shared client copies) */
  deleteCommon: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(commonFiles).where(eq(commonFiles.id, input.fileId));
      return { success: true };
    }),

  /**
   * Admin: attach a library file to a client's enrollment so they see it in portal.
   * Reuses the same storage URL (no re-upload).
   */
  shareCommonToEnrollment: protectedProcedure
    .input(
      z.object({
        commonFileId: z.number(),
        enrollmentId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [common] = await db
        .select()
        .from(commonFiles)
        .where(eq(commonFiles.id, input.commonFileId))
        .limit(1);
      if (!common) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Library file not found" });
      }

      const [enrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(eq(enrollments.id, input.enrollmentId))
        .limit(1);
      if (!enrollment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }

      // Avoid duplicate shares of the same library URL to this client
      const existing = await db
        .select({ id: clientFiles.id })
        .from(clientFiles)
        .where(
          and(
            eq(clientFiles.enrollmentId, input.enrollmentId),
            eq(clientFiles.fileKey, common.fileKey)
          )
        )
        .limit(1);
      if (existing[0]) {
        return { id: existing[0].id, fileName: common.fileName, alreadyShared: true as const };
      }

      const [inserted] = await db
        .insert(clientFiles)
        .values({
          enrollmentId: input.enrollmentId,
          uploadedByUserId: ctx.user!.id,
          uploadedByRole: "admin",
          fileName: common.fileName,
          fileKey: common.fileKey,
          fileUrl: common.fileUrl,
          mimeType: common.mimeType,
        })
        .$returningId();

      return { id: inserted.id, fileName: common.fileName, alreadyShared: false as const };
    }),
});
