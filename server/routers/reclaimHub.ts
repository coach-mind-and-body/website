import { z } from "zod";
import { eq, desc, and, asc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  programModules, 
  assignments, 
  assignmentSubmissions, 
  moduleProgress,
  users,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { getUpcomingEventsForEmail } from "../googleCalendar";
import { PROGRAM_IDS, PROGRAMS, isProgramId } from "@shared/programs";
import { buildAssignmentFeedbackMessage } from "../assignmentFeedback";
import { sendTransactionalEmail } from "../notifications";
import { loadClientHub, loadCoachClientWorkspace } from "../programHubData";
import { ensureModuleHomeworkAssignments, setHomeworkAnswerBox, syncHomeworkQuestion } from "../moduleHomework";

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
  
  /**
   * Every program this person can open, with only that program's
   * published and unlocked modules, tasks, and files.
   */
  myHub: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { programs: [] };
    return loadClientHub(db, { id: ctx.user!.id, role: ctx.user!.role, email: ctx.user!.email });
  }),

  // Reclaim-only shape kept so older portal calls still resolve.
  // Content is filtered to the Reclaim program.
  getModules: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const hub = await loadClientHub(db, { id: ctx.user!.id, role: ctx.user!.role, email: ctx.user!.email }, { programs: ["reclaim"] });
    const reclaim = hub.programs.find((program) => program.program === "reclaim");
    if (!reclaim) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not actively enrolled in Reclaim." });
    }

    return {
      enrollment: reclaim.enrollment,
      modules: reclaim.modules,
      nextSession: reclaim.nextSession,
      assignments: reclaim.assignments,
      submissions: reclaim.submissions,
    };
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

      const hub = await loadClientHub(db, { id: ctx.user!.id, role: ctx.user!.role, email: ctx.user!.email });
      const openToUser = hub.programs.some((program) =>
        program.assignments.some((assignment) => assignment.id === input.assignmentId)
      );
      if (!openToUser) {
        throw new TRPCError({ code: "FORBIDDEN", message: "That assignment isn't open in your program." });
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

      const hub = await loadClientHub(db, { id: ctx.user!.id, role: ctx.user!.role, email: ctx.user!.email });
      const openToUser = hub.programs.some((program) =>
        program.modules.some((mod) => mod.id === input.moduleId)
      );
      if (!openToUser) {
        throw new TRPCError({ code: "FORBIDDEN", message: "That module isn't open in your program." });
      }

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

  adminListModules: protectedProcedure
    .input(z.object({ program: z.enum(PROGRAM_IDS).optional() }).optional())
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(programModules).orderBy(asc(programModules.order));
      if (!input?.program) return rows;
      return rows.filter((row) => row.program === input.program);
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
      program: z.enum(PROGRAM_IDS).default("reclaim"),
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
      program: z.enum(PROGRAM_IDS).optional(),
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
      if (data.content !== undefined) {
        await syncHomeworkQuestion(db, id, data.content);
      }
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
      const [mod] = await db.select().from(programModules).where(eq(programModules.id, input.moduleId)).limit(1);
      let rows = await db
        .select()
        .from(assignments)
        .where(eq(assignments.moduleId, input.moduleId))
        .orderBy(asc(assignments.order));
      if (mod) {
        const added = await ensureModuleHomeworkAssignments(db, [mod], rows);
        if (added) {
          rows = await db
            .select()
            .from(assignments)
            .where(eq(assignments.moduleId, input.moduleId))
            .orderBy(asc(assignments.order));
        }
      }
      return rows;
    }),

  /** Show or hide the typed answer under a module's Homework section. */
  adminSetHomeworkAnswerBox: protectedProcedure
    .input(z.object({ moduleId: z.number(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        return await setHomeworkAnswerBox(db, input.moduleId, input.enabled);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not update the answer box.";
        throw new TRPCError({
          code: message.includes("gone") ? "NOT_FOUND" : "BAD_REQUEST",
          message,
        });
      }
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
        .set({
          feedback: input.feedback,
          ...(input.feedback.trim()
            ? { status: "reviewed" as const, reviewedAt: new Date(), reviewedByUserId: ctx.user!.id }
            : {}),
        })
        .where(eq(assignmentSubmissions.id, input.submissionId));

      const [row] = await db
        .select({
          answer: assignmentSubmissions.answer,
          userName: users.name,
          userEmail: users.email,
          question: assignments.question,
          moduleTitle: programModules.title,
          program: programModules.program,
        })
        .from(assignmentSubmissions)
        .innerJoin(users, eq(assignmentSubmissions.userId, users.id))
        .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
        .innerJoin(programModules, eq(assignments.moduleId, programModules.id))
        .where(eq(assignmentSubmissions.id, input.submissionId))
        .limit(1);

      let emailSent = false;
      const feedback = input.feedback.trim();
      if (row?.userEmail && feedback && isProgramId(row.program)) {
        const message = buildAssignmentFeedbackMessage({
          clientName: row.userName?.trim() || "there",
          programLabel: PROGRAMS[row.program].label,
          moduleTitle: row.moduleTitle,
          question: row.question,
          feedback,
        });
        emailSent = await sendTransactionalEmail({
          to: row.userEmail,
          toName: row.userName?.trim() || row.userEmail,
          subject: message.subject,
          htmlBody: message.htmlBody,
          textBody: message.textBody,
        });
      }

      return { success: true, emailSent };
    }),

  /** One place for a client's programs, answers, files, and food logs. */
  adminClientWorkspace: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      email: z.string().email().optional(),
    }))
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      if (!input.userId && !input.email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a client." });
      }
      const db = await getDb();
      if (!db) return { found: false as const, foodLogAccess: { allowed: false as const, reason: "hidden" as const } };
      return loadCoachClientWorkspace(db, input);
    }),
});
