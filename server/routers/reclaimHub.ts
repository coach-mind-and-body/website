import { z } from "zod";
import { eq, desc, and, asc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  programModules, 
  assignments, 
  assignmentSubmissions, 
  moduleProgress,
  enrollments
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { getUpcomingEventsForEmail } from "../googleCalendar";

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

export const reclaimHubRouter = router({
  // ── Client Endpoints ────────────────────────────────────────────────────────
  
  // Get upcoming Google Meet appointments
  getUpcomingAppointments: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.email) return [];
    return getUpcomingEventsForEmail(ctx.user.email);
  }),
  
  // Get all published modules and the user's progress/submissions
  getModules: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    
    // Verify enrollment
    const enrollmentRows = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, ctx.user!.id),
          eq(enrollments.program, "reclaim")
        )
      )
      .limit(1);

    const enrollment = enrollmentRows[0];
    if (ctx.user!.role !== "admin" && (!enrollment || enrollment.status !== "active")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not actively enrolled in Reclaim." });
    }

    const effectiveEnrollment = (ctx.user!.role === "admin" && !enrollment) 
      ? {
          id: 0,
          userId: ctx.user!.id,
          program: "reclaim",
          status: "active",
          enrolledAt: new Date(new Date().getTime() - 100 * 24 * 60 * 60 * 1000), // 100 days ago to unlock everything
          paymentType: "full",
          depositPaid: true,
          balancePaid: true,
          clientName: ctx.user!.name,
          clientEmail: ctx.user!.email,
          createdAt: new Date(),
          updatedAt: new Date()
        } 
      : enrollment;

    // Fetch all published modules
    const modules = await db
      .select()
      .from(programModules)
      .where(eq(programModules.isPublished, true))
      .orderBy(asc(programModules.order));

    // Fetch user's progress
    const progressRecords = await db
      .select()
      .from(moduleProgress)
      .where(eq(moduleProgress.userId, ctx.user!.id));

    // Fetch assignments for these modules
    const allAssignments = await db
      .select()
      .from(assignments)
      .orderBy(asc(assignments.order));

    // Fetch user's submissions
    const submissions = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.userId, ctx.user!.id));

    // Calculate drip logic
    const enrichedModules = modules.map((mod, index) => {
      const progress = progressRecords.find(p => p.moduleId === mod.id);
      
      // Module is unlocked if the admin has explicitly assigned it (a progress record exists)
      // OR if it's the very first module and we auto-unlock it for new clients so they have a starting point.
      let isUnlocked = (progress !== undefined && progress.unlockedAt !== null) || index === 0;

      return {
        ...mod,
        isUnlocked,
        progress: progress || null,
      };
    });

    return { enrollment: effectiveEnrollment, modules: enrichedModules, assignments: allAssignments, submissions };
  }),

  submitAssignment: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      answer: z.string().optional(),
      fileUrl: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (!input.answer && !input.fileUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Provide either an answer or a file upload." });
      }

      // Check if submission already exists
      const existing = await db
        .select()
        .from(assignmentSubmissions)
        .where(
          and(
            eq(assignmentSubmissions.assignmentId, input.assignmentId),
            eq(assignmentSubmissions.userId, ctx.user!.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing submission
        await db
          .update(assignmentSubmissions)
          .set({ answer: input.answer || null, fileUrl: input.fileUrl || null, submittedAt: new Date() })
          .where(eq(assignmentSubmissions.id, existing[0].id));
      } else {
        // Create new submission
        await db.insert(assignmentSubmissions).values({
          assignmentId: input.assignmentId,
          userId: ctx.user!.id,
          answer: input.answer || null,
          fileUrl: input.fileUrl || null
        });
      }

      return { success: true };
    }),

  markModuleComplete: protectedProcedure
    .input(z.object({ moduleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const existing = await db
        .select()
        .from(moduleProgress)
        .where(
          and(
            eq(moduleProgress.userId, ctx.user!.id),
            eq(moduleProgress.moduleId, input.moduleId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        if (!existing[0].completedAt) {
          await db
            .update(moduleProgress)
            .set({ completedAt: new Date() })
            .where(eq(moduleProgress.id, existing[0].id));
        }
      } else {
        await db.insert(moduleProgress).values({
          userId: ctx.user!.id,
          moduleId: input.moduleId,
          completedAt: new Date(),
        });
      }

      return { success: true };
    }),

  // ── Admin Endpoints ─────────────────────────────────────────────────────────

  adminListModules: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(programModules).orderBy(asc(programModules.order));
  }),

  adminGetClientProgress: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) return [];
      return db.select().from(moduleProgress).where(eq(moduleProgress.userId, input.userId));
    }),

  adminCreateModule: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().nullish(),
      videoUrl: z.string().nullish(),
      content: z.string().nullish(),
      pdfUrl: z.string().nullish(),
      order: z.number(),
      isPublished: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await db.insert(programModules).values(input);
      return { success: true };
    }),

  adminUpdateModule: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().nullish(),
      videoUrl: z.string().nullish(),
      content: z.string().nullish(),
      pdfUrl: z.string().nullish(),
      order: z.number().optional(),
      isPublished: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, ...data } = input;
      await db.update(programModules).set(data).where(eq(programModules.id, id));
      return { success: true };
    }),

  adminDeleteModule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(programModules).where(eq(programModules.id, input.id));
      return { success: true };
    }),

  adminAssignModule: protectedProcedure
    .input(z.object({ userId: z.number(), moduleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const existing = await db.select().from(moduleProgress)
        .where(
          and(
            eq(moduleProgress.userId, input.userId),
            eq(moduleProgress.moduleId, input.moduleId)
          )
        ).limit(1);

      if (existing.length === 0) {
        await db.insert(moduleProgress).values({
          userId: input.userId,
          moduleId: input.moduleId,
          unlockedAt: new Date(),
        });
      } else {
        // Just update unlockedAt if it already existed but perhaps wasn't unlocked
        await db.update(moduleProgress)
          .set({ unlockedAt: new Date() })
          .where(eq(moduleProgress.id, existing[0].id));
      }

      return { success: true };
    }),

  adminUnassignModule: protectedProcedure
    .input(z.object({ userId: z.number(), moduleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(moduleProgress)
        .where(
          and(
            eq(moduleProgress.userId, input.userId),
            eq(moduleProgress.moduleId, input.moduleId)
          )
        );

      return { success: true };
    }),

  adminUploadFile: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      mimeType: z.string(),
      base64Data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const { storagePut } = await import("../storage");
      const buffer = Buffer.from(input.base64Data, "base64");
      const ext = input.fileName.split(".").pop() ?? "pdf";
      const suffix = Math.random().toString(36).slice(2, 10);
      const fileKey = `reclaim-modules/${suffix}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      return { url };
    }),

  adminListAssignments: protectedProcedure
    .input(z.object({ moduleId: z.number() }))
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(assignments)
        .where(eq(assignments.moduleId, input.moduleId))
        .orderBy(asc(assignments.order));
    }),

  adminCreateAssignment: protectedProcedure
    .input(z.object({
      moduleId: z.number(),
      question: z.string().min(1),
      order: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await db.insert(assignments).values(input);
      return { success: true };
    }),

  adminUpdateAssignment: protectedProcedure
    .input(z.object({
      id: z.number(),
      question: z.string().optional(),
      order: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, ...data } = input;
      await db.update(assignments).set(data).where(eq(assignments.id, id));
      return { success: true };
    }),

  adminDeleteAssignment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(assignments).where(eq(assignments.id, input.id));
      return { success: true };
    }),

  adminListSubmissions: protectedProcedure
    .query(async ({ ctx }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) return [];
      
      // Joining with users and assignments to get a complete view
      const result = await db
        .select({
          submission: assignmentSubmissions,
          assignment: assignments,
          module: programModules,
          // user logic handled on frontend or basic join if needed
        })
        .from(assignmentSubmissions)
        .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
        .innerJoin(programModules, eq(assignments.moduleId, programModules.id))
        .orderBy(desc(assignmentSubmissions.submittedAt));
        
      return result;
    }),

  adminUpdateFeedback: protectedProcedure
    .input(z.object({
      submissionId: z.number(),
      feedback: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(assignmentSubmissions)
        .set({ feedback: input.feedback })
        .where(eq(assignmentSubmissions.id, input.submissionId));

      // TODO: Trigger email notification to Client

      return { success: true };
    }),
});
