import { z } from "zod";
import { eq, desc, and, asc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  programModules, 
  assignments, 
  assignmentSubmissions, 
  moduleProgress 
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

export const reclaimHubRouter = router({
  // ── Client Endpoints ────────────────────────────────────────────────────────
  
  // Get all published modules and the user's progress/submissions
  getModules: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    
    // Fetch all published modules
    const modules = await db
      .select()
      .from(programModules)
      .where(eq(programModules.isPublished, true))
      .orderBy(asc(programModules.order));

    // Fetch user's progress
    const progress = await db
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

    return { modules, progress, assignments: allAssignments, submissions };
  }),

  submitAssignment: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      answer: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

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
          .set({ answer: input.answer, submittedAt: new Date() })
          .where(eq(assignmentSubmissions.id, existing[0].id));
      } else {
        // Create new submission
        await db.insert(assignmentSubmissions).values({
          assignmentId: input.assignmentId,
          userId: ctx.user!.id,
          answer: input.answer
        });
      }

      // TODO: Trigger email notification to Lee Anne

      return { success: true };
    }),

  // ── Admin Endpoints ─────────────────────────────────────────────────────────

  adminListModules: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(programModules).orderBy(asc(programModules.order));
  }),

  adminCreateModule: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      videoUrl: z.string().optional(),
      content: z.string().optional(),
      pdfUrl: z.string().optional(),
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
      description: z.string().optional(),
      videoUrl: z.string().optional(),
      content: z.string().optional(),
      pdfUrl: z.string().optional(),
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
