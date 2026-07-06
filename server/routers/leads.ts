import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { leads, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { sendOwnerEmail } from "../notifications";
import { fireMetaPixelLead, fireMetaCrmEvent } from "../metaCapi";
import { metaTrackingInputSchema } from "@shared/metaTracking";
import { escapeHtml } from "../../lib/htmlEscape";
import { getUnifiedContactsPage } from "../crm/unifiedContacts";

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

export const leadsRouter = router({
  // Public: submit discovery call interest
  submit: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email required"),
      phone: z.string().optional(), notes: z.string().optional() }).merge(metaTrackingInputSchema)).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const safeName = escapeHtml(input.name);
      const safeEmail = escapeHtml(input.email);
      const safePhone = input.phone ? escapeHtml(input.phone) : "";
      const safeNotes = input.notes ? escapeHtml(input.notes) : "";

      await db.insert(leads).values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
      });
      // Notify Lee Anne
      await notifyOwner({
        title: "New Discovery Call Lead",
        content: `${input.name} (${input.email}) just booked a discovery call.${input.phone ? ` Phone: ${input.phone}` : ""}`,
      });
      // Also send email to coach@
      await sendOwnerEmail({
        subject: `New Discovery Call Lead: ${input.name}`,
        htmlBody: `
          <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
            <div style="background:#3a5a3a;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">New Discovery Call Lead!</h1>
            </div>
            <div style="padding:32px 40px;">
              <p style="color:#4a4a4a;font-size:16px;">Hi Lee Anne! Someone just booked a discovery call:</p>
              <div style="background:#f9f5f0;border-left:4px solid #3a5a3a;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
                <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#3a5a3a;">${safeName}</p>
                <p style="margin:0;font-size:16px;color:#4a4a4a;"><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color:#c9a96e;">${safeEmail}</a></p>
                ${safePhone ? `<p style="margin:8px 0 0;font-size:16px;color:#4a4a4a;"><strong>Phone:</strong> ${safePhone}</p>` : ""}
                ${safeNotes ? `<p style="margin:8px 0 0;font-size:14px;color:#6a6a6a;"><strong>Notes:</strong> ${safeNotes}</p>` : ""}
              </div>
              <hr style="border:none;border-top:1px solid #e8e0d8;margin:28px 0;" />
              <p style="color:#8a9a8a;font-size:13px;text-align:center;">Mind &amp; Body Reset — mindandbodyresetcoach.com</p>
            </div>
          </div>
        `,
        textBody: `New Discovery Call Lead!\n\nName: ${input.name}\nEmail: ${input.email}${input.phone ? `\nPhone: ${input.phone}` : ""}${input.notes ? `\nNotes: ${input.notes}` : ""}`,
      });
      await fireMetaPixelLead({
        customerEmail: input.email,
        customerName: input.name,
        customerPhone: input.phone,
        contentName: "Discovery Call Booking",
        eventSourceUrl: "https://mindandbodyresetcoach.com/book",
        eventId: input.eventId,
        req: ctx.req,
        fbc: input.fbc,
        fbp: input.fbp,
      });

      return { success: true };
    }),

  // Admin: list all leads
  list: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }),

  // Admin: update lead status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "enrolled", "not_a_fit"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const [lead] = await db.select().from(leads).where(eq(leads.id, input.id));
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.notes !== undefined) updateData.notes = input.notes;
      await db.update(leads).set(updateData).where(eq(leads.id, input.id));

      if (input.status === "contacted" || input.status === "enrolled") {
        const eventName = input.status.charAt(0).toUpperCase() + input.status.slice(1);
        await fireMetaCrmEvent({
          eventName,
          customerEmail: lead.email,
          customerName: lead.name,
          customerPhone: lead.phone,
          eventId: `crm_${lead.id}_${input.status}`,
        });
      }

      return { success: true };
    }),

  // Admin: get unified contacts (paginated)
  unifiedContacts: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          page: z.number().int().min(1).optional(),
          pageSize: z.number().int().min(1).max(100).optional(),
          filter: z.enum(["all", "reclaim", "habit", "leads"]).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) {
        return {
          items: [],
          total: 0,
          page: input?.page ?? 1,
          pageSize: input?.pageSize ?? 25,
          totalPages: 1,
        };
      }

      return getUnifiedContactsPage(db, {
        search: input?.search,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 25,
        filter: input?.filter ?? "all",
      });
    }),

  updateContactDetails: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      phone: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      leadId: z.number().nullable().optional(),
      userId: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 1. If leadId is provided, update that lead.
      // Else find if any lead matches the email.
      let targetLeadId = input.leadId;
      if (!targetLeadId) {
        const matches = await db.select({ id: leads.id }).from(leads).where(eq(leads.email, input.email)).limit(1);
        if (matches.length > 0) {
          targetLeadId = matches[0].id;
        }
      }

      if (targetLeadId) {
        await db.update(leads)
          .set({
            name: input.name,
            phone: input.phone || null,
            notes: input.notes !== undefined ? input.notes : undefined,
          })
          .where(eq(leads.id, targetLeadId));
      } else if (input.notes) {
        // If there's notes to save but no lead exists, let's create a lead to persist notes and phone!
        await db.insert(leads).values({
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          notes: input.notes,
          status: "contacted",
        });
      }

      // 2. If userId is provided, update that user.
      // Else find if any user matches the email.
      let targetUserId = input.userId;
      if (!targetUserId) {
        const matches = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
        if (matches.length > 0) {
          targetUserId = matches[0].id;
        }
      }

      if (targetUserId) {
        await db.update(users)
          .set({
            name: input.name,
            phone: input.phone || null,
          })
          .where(eq(users.id, targetUserId));
      }

      return { success: true };
    }),
});


