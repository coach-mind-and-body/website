import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { clientFiles, enrollments } from "../../drizzle/schema";
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
});
