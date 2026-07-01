import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { leads, subscribers, enrollments, users, fpuLeads } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { sendOwnerEmail } from "../notifications";
import { fireMetaPixelLead, fireMetaCrmEvent } from "../metaCapi";
import { metaTrackingInputSchema } from "@shared/metaTracking";

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
                <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#3a5a3a;">${input.name}</p>
                <p style="margin:0;font-size:16px;color:#4a4a4a;"><strong>Email:</strong> <a href="mailto:${input.email}" style="color:#c9a96e;">${input.email}</a></p>
                ${input.phone ? `<p style="margin:8px 0 0;font-size:16px;color:#4a4a4a;"><strong>Phone:</strong> ${input.phone}</p>` : ""}
                ${input.notes ? `<p style="margin:8px 0 0;font-size:14px;color:#6a6a6a;"><strong>Notes:</strong> ${input.notes}</p>` : ""}
              </div>
              <hr style="border:none;border-top:1px solid #e8e0d8;margin:28px 0;" />
              <p style="color:#8a9a8a;font-size:13px;text-align:center;">Mind &amp; Body Reset â€” mindandbodyresetcoach.com</p>
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

  // Admin: get unified contacts
  unifiedContacts: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];

    const [allLeads, allSubscribers, allEnrollments, allFpu, allUsers] = await Promise.all([
      db.select().from(leads),
      db.select().from(subscribers),
      db.select({
        id: enrollments.id,
        userId: enrollments.userId,
        email: users.email,
        name: users.name,
        paymentType: enrollments.paymentType,
        depositPaid: enrollments.depositPaid,
        balancePaid: enrollments.balancePaid,
        status: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
      }).from(enrollments).leftJoin(users, eq(users.id, enrollments.userId)),
      db.select().from(fpuLeads),
      db.select().from(users)
    ]);

    type TimelineEvent = { date: string; action: string; type: string };
    type UnifiedContact = {
      email: string;
      name: string;
      phone?: string;
      tags: string[];
      timeline: TimelineEvent[];
      highestStatus: string; // 'reclaim', 'fpu', 'discovery', 'subscriber', 'habit-only'
      leadStatus?: string;
      leadId?: number;
      enrollmentStatus?: string;
      enrollmentId?: number;
      userId?: number;
      shareHabitsWithCoach?: boolean;
      notes?: string;
    };

    const contactsMap = new Map<string, UnifiedContact>();

    const getContact = (email: string, nameFallback: string) => {
      const normalized = email.toLowerCase().trim();
      if (!contactsMap.has(normalized)) {
        contactsMap.set(normalized, {
          email: normalized,
          name: nameFallback,
          tags: [],
          timeline: [],
          highestStatus: 'subscriber',
        });
      }
      return contactsMap.get(normalized)!;
    };

    allSubscribers.forEach(sub => {
      const contact = getContact(sub.email, sub.firstName ? `${sub.firstName} ${sub.lastName || ''}`.trim() : 'Unknown');
      if (sub.segments) {
        try {
          const parsed = JSON.parse(sub.segments);
          if (Array.isArray(parsed)) contact.tags.push(...parsed);
        } catch {}
      }
      contact.timeline.push({ date: sub.createdAt.toISOString(), action: 'Joined Subscriber List', type: 'optin' });
    });

    allFpu.forEach(fpu => {
      const contact = getContact(fpu.email, fpu.name);
      contact.tags.push('fpu_interest');
      contact.timeline.push({ date: fpu.createdAt.toISOString(), action: 'FPU Group Sign-up', type: 'fpu' });
      if (contact.highestStatus === 'subscriber') contact.highestStatus = 'fpu';
    });

    allLeads.forEach(lead => {
      const contact = getContact(lead.email, lead.name);
      contact.phone = lead.phone || contact.phone;
      contact.leadStatus = lead.status;
      contact.leadId = lead.id;
      if (lead.notes) contact.notes = lead.notes;
      contact.timeline.push({ date: lead.createdAt.toISOString(), action: 'Booked Discovery Call', type: 'discovery' });
      if (lead.status === 'enrolled') {
        contact.highestStatus = 'reclaim';
      } else if (contact.highestStatus !== 'reclaim') {
        contact.highestStatus = 'discovery';
      }
    });

    allUsers.forEach(user => {
      if (!user.email) return;
      const contact = getContact(user.email, user.name || 'Unknown');
      contact.userId = user.id;
      contact.shareHabitsWithCoach = user.shareHabitsWithCoach;
      // If they are a registered user but haven't booked a call or bought reclaim, they are a habit-tracker user
      if (contact.highestStatus === 'subscriber' || contact.highestStatus === 'fpu') {
        contact.highestStatus = 'habit-only';
      }
      if (!contact.timeline.some(t => t.type === 'signup')) {
         contact.timeline.push({ date: user.createdAt.toISOString(), action: 'Created Portal Account', type: 'signup' });
      }
    });

    allEnrollments.forEach(enr => {
      if (!enr.email) return;
      const contact = getContact(enr.email, enr.name || 'Unknown');
      contact.enrollmentId = enr.id;
      contact.enrollmentStatus = enr.status;
      contact.timeline.push({ 
        date: enr.enrolledAt.toISOString(), 
        action: `Paid for RECLAIM (${enr.paymentType})`, 
        type: 'purchase' 
      });
      contact.highestStatus = 'reclaim';
    });

    return Array.from(contactsMap.values()).map(c => {
      c.timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return c;
    }).sort((a, b) => {
      const dateA = a.timeline[0]?.date ? new Date(a.timeline[0].date).getTime() : 0;
      const dateB = b.timeline[0]?.date ? new Date(b.timeline[0].date).getTime() : 0;
      return dateB - dateA;
    });
  }),
});


