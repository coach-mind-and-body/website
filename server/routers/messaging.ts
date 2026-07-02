import { adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { conversations, messages, users, leads, callLogs, messageTemplates, enrollments } from "../../drizzle/schema";
import { eq, desc, and, sql, like, or, inArray, gt, isNull } from "drizzle-orm";
import { ENV } from "../_core/env";
import twilio from "twilio";
import { shortenLink } from "../crm/automations";
import { resolveContactByPhone } from "../crm/contactResolver";
import { searchContactsForCompose } from "../crm/searchContactsForCompose";
import { getMetaPageAccessToken } from "../meta/pageToken";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID || "AC_placeholder", process.env.TWILIO_AUTH_TOKEN || "auth_placeholder");

export const messagingRouter = router({
  // Fetch all conversations for the inbox sidebar
  listConversations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    // Fuzzy match phone numbers: strip formatting from lead, and match against last 10 digits of twilio phone
    const phoneMatchSql = sql`REPLACE(REPLACE(REPLACE(REPLACE(${leads.phone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${conversations.contactPhone}, 10))`;
    const userPhoneMatchSql = sql`REPLACE(REPLACE(REPLACE(REPLACE(${users.phone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${conversations.contactPhone}, 10))`;

    const raw = await db.select({
      conv: conversations,
      matchedUserId: users.id,
      userName: users.name,
      userEmail: users.email,
      isPremium: sql`false`,
      leadName: leads.name
    })
      .from(conversations)
      .leftJoin(users, or(eq(conversations.userId, users.id), userPhoneMatchSql))
      .leftJoin(leads, phoneMatchSql)
      .orderBy(desc(conversations.lastMessageAt));
    
    // De-duplicate if a phone number matches multiple leads, just group them
    const uniqueMap = new Map();
    raw.forEach(r => {
      let key = `id_${r.conv.id}`;
      if (r.conv.contactPhone && (r.conv.platform === "sms" || r.conv.platform === "whatsapp")) {
        const cleanPhone = r.conv.contactPhone.replace(/\D/g, "").replace(/^1/, "");
        if (cleanPhone.length >= 10) {
          key = `phone_${cleanPhone}`;
        }
      }

      const resolvedUserId = r.conv.userId ?? r.matchedUserId ?? null;

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, { 
          ...r.conv,
          userId: resolvedUserId,
          contactEmail: r.conv.contactEmail || r.userEmail,
          userName: r.userName || r.leadName, 
          isPremium: r.isPremium 
        });
      } else {
        const existing = uniqueMap.get(key);
        const combinedUnread = (existing.unreadCount || 0) + (r.conv.unreadCount || 0);
        if (new Date(r.conv.lastMessageAt || 0).getTime() > new Date(existing.lastMessageAt || 0).getTime()) {
           uniqueMap.set(key, { 
            ...r.conv,
            userId: resolvedUserId ?? existing.userId,
            contactEmail: r.conv.contactEmail || r.userEmail || existing.contactEmail,
            userName: r.userName || r.leadName || existing.userName, 
            isPremium: r.isPremium || existing.isPremium,
            unreadCount: combinedUnread
          });
        } else {
           existing.unreadCount = combinedUnread;
           if (!existing.userId && resolvedUserId) existing.userId = resolvedUserId;
           if (!existing.contactEmail) existing.contactEmail = r.conv.contactEmail || r.userEmail;
           if (!existing.userName) existing.userName = r.userName || r.leadName;
           if (!existing.isPremium) existing.isPremium = r.isPremium;
        }
      }
    });
    const results = Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    );

    const convIds = results.map(c => c.id);
    const previewMap = new Map<number, string>();
    if (convIds.length > 0) {
      const latestMessages = await db
        .select({
          conversationId: messages.conversationId,
          content: messages.content,
          mediaUrl: messages.mediaUrl,
          direction: messages.direction,
        })
        .from(messages)
        .where(inArray(messages.conversationId, convIds))
        .orderBy(desc(messages.createdAt));

      for (const m of latestMessages) {
        if (previewMap.has(m.conversationId)) continue;
        let preview = m.content?.trim() || (m.mediaUrl ? "📷 Image" : "");
        if (!preview) preview = m.direction === "inbound" ? "New message" : "Sent";
        previewMap.set(m.conversationId, preview.slice(0, 120));
      }
    }

    return results.map(c => ({
      ...c,
      lastMessagePreview: previewMap.get(c.id) || null,
    }));
  }),

  listScheduledForConversation: adminProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(messages)
        .where(and(
          eq(messages.conversationId, input.conversationId),
          eq(messages.status, "queued"),
          gt(messages.scheduledAt, new Date())
        ))
        .orderBy(messages.scheduledAt);
    }),

  listRemindersForContact: adminProcedure
    .input(z.object({
      userId: z.number().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const reminders: { label: string; date: Date | null; type: string }[] = [];

      const leadWhere = input.phone && input.email
        ? or(eq(leads.phone, input.phone), eq(leads.email, input.email))
        : input.phone
          ? eq(leads.phone, input.phone)
          : input.email
            ? eq(leads.email, input.email)
            : undefined;

      if (leadWhere) {
        const leadResults = await db
          .select()
          .from(leads)
          .where(leadWhere)
          .orderBy(desc(leads.updatedAt))
          .limit(3);

        for (const lead of leadResults) {
          if (lead.createdAt) {
            const start = new Date(lead.createdAt);
            if (start > new Date()) {
              reminders.push({
                label: `Lead created: ${lead.name}`,
                date: start,
                type: "lead",
              });
            }
          }
        }
      }

      if (input.userId) {
        const [user] = await db
          .select({
            subscriptionExpiresAt: users.createdAt,
            isPremium: sql`false`,
          })
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);

        if (user?.isPremium && user.subscriptionExpiresAt) {
          const exp = new Date(user.subscriptionExpiresAt);
          const daysUntil = (exp.getTime() - Date.now()) / 86400000;
          if (daysUntil > 0 && daysUntil <= 30) {
            reminders.push({
              label: "Premium subscription renews",
              date: exp,
              type: "renewal",
            });
          }
        }
      }

      return reminders.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.getTime() - b.date.getTime();
      });
    }),

  listPaymentsForContact: adminProcedure
    .input(z.object({
      userId: z.number().optional(),
      email: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const payments: { label: string; amount: string | null; date: Date; status: string }[] = [];

      if (input.userId) {
        // Look up enrollments for this user
        const userEnrollments = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.userId, input.userId))
          .orderBy(desc(enrollments.createdAt))
          .limit(10);

        for (const e of userEnrollments) {
          payments.push({
            label: `Enrollment: ${e.program}`,
            amount: null,
            date: e.createdAt,
            status: e.status,
          });
        }
      }

      // Stripe integration not available in this project

      return payments
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 10);
    }),

  // Fetch a specific conversation's chat history
  getConversation: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const convoRaw = await db.select({
        conv: conversations,
        matchedUserId: users.id,
        userName: users.name,
        userEmail: users.email,
        isPremium: sql`false`,
        leadName: leads.name
      }).from(conversations)
      .leftJoin(users, or(eq(conversations.userId, users.id), sql`REPLACE(REPLACE(REPLACE(REPLACE(${users.phone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${conversations.contactPhone}, 10))`))
      .leftJoin(leads, sql`REPLACE(REPLACE(REPLACE(REPLACE(${leads.phone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${conversations.contactPhone}, 10))`)
      .where(eq(conversations.id, input.id))
      .orderBy(desc(sql`false`), desc(leads.createdAt))
      .limit(1);
      
      const convo = convoRaw[0];
      const resolvedUserId = convo?.conv.userId ?? convo?.matchedUserId ?? null;

      if (convo && !convo.conv.userId && convo.matchedUserId) {
        await db
          .update(conversations)
          .set({ userId: convo.matchedUserId })
          .where(and(eq(conversations.id, input.id), isNull(conversations.userId)));
      }

      let allConvIds = [input.id];
      if (convo?.conv?.contactPhone && (convo.conv.platform === 'sms' || convo.conv.platform === 'whatsapp')) {
        const cleanPhone = convo.conv.contactPhone.replace(/\D/g, "").replace(/^1/, "");
        if (cleanPhone.length >= 10) {
          const matches = await db.select({ id: conversations.id }).from(conversations).where(
              like(conversations.contactPhone, `%${cleanPhone}%`)
          );
          allConvIds = matches.map(m => m.id);
        }
      }

      const history = await db.select()
        .from(messages)
        .where(inArray(messages.conversationId, allConvIds))
        .orderBy(desc(messages.createdAt)); // Or asc based on UI needs
        


      let callsHistory: any[] = [];
      if (convo?.conv?.contactPhone) {
        const phone = convo.conv.contactPhone;
        // Match last 10 digits
        const cleanPhone = phone.replace(/\D/g, "").replace(/^1/, "");
        if (cleanPhone.length >= 10) {
          callsHistory = await db.select()
            .from(callLogs)
            .where(or(
              like(callLogs.fromNumber, `%${cleanPhone}%`),
              like(callLogs.toNumber, `%${cleanPhone}%`)
            ));
        }
      }

      // Merge messages and calls, sorting oldest first
      const combined = [
        ...history.map(m => ({ ...m, type: "message" as const })),
        ...callsHistory.map(c => ({ 
          type: "call" as const, 
          id: c.id + 1000000, // offset id so react keys don't collide
          createdAt: c.createdAt, 
          direction: c.direction, 
          status: c.status, 
          durationSeconds: c.durationSeconds, 
          content: [
            c.aiSummary ? `**AI Summary:**\n${c.aiSummary}` : null,
            c.transcript ? `**Transcript:**\n${c.transcript}` : null
          ].filter(Boolean).join("\n\n") || null,
          isAutomated: true // Calls are typically AI interactions here
        }))
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return {
        conversation: {
          ...convo.conv,
          userId: resolvedUserId,
          contactEmail: convo.conv.contactEmail || convo.userEmail,
          userName: convo.userName || convo.leadName,
          isPremium: convo.isPremium,
        },
        messages: combined,
      };
    }),

  // Upsert a client lead contact
  updateContact: adminProcedure
    .input(z.object({
      conversationId: z.number().optional(),
      phone: z.string(),
      name: z.string(),
      email: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const phoneMatchSql = sql`REPLACE(REPLACE(REPLACE(REPLACE(${leads.phone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${input.phone}, 10))`;
      
      const existingRows = await db
        .select()
        .from(leads)
        .where(phoneMatchSql)
        .orderBy(desc(leads.createdAt))
        .limit(1);
      const existing = existingRows[0] ?? null;

      if (existing) {
        await db.update(leads)
          .set({ name: input.name, email: input.email, phone: input.phone })
          .where(eq(leads.id, existing.id));
      } else {
        await db.insert(leads).values({
          phone: input.phone,
          name: input.name,
          email: input.email || "",
          status: "new"
        });
      }

      if (input.conversationId) {
        // Also ensure a user account exists to allow tagging
        const existingUserRows = await db
          .select()
          .from(users)
          .where(eq(users.phone, input.phone))
          .limit(1);
        const existingUser = existingUserRows[0] ?? null;

        let userId = existingUser?.id;
        if (!userId) {
          const [uRes] = await db.insert(users).values({
            openId: `sms-${input.phone.replace(/\D/g, '')}`,
            name: input.name,
            email: input.email,
            phone: input.phone,
            role: "user"
          });
          userId = uRes.insertId;
        } else {
           await db.update(users).set({ name: input.name, email: input.email }).where(eq(users.id, userId));
        }

        await db.update(conversations)
          .set({ contactPhone: input.phone, contactEmail: input.email, userId: userId })
          .where(eq(conversations.id, input.conversationId));
      }

      return { success: true };
    }),

  // Close a conversation
  closeConversation: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(conversations)
        .set({ status: 'closed' })
        .where(eq(conversations.id, input.id));
        
      return { success: true };
    }),

  listAdmins: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.role, "admin"));
  }),

  listTemplates: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(messageTemplates).orderBy(messageTemplates.name);
  }),

  assignConversation: adminProcedure
    .input(z.object({ conversationId: z.number(), adminId: z.number().nullable() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(conversations)
        .set({ assignedToId: input.adminId })
        .where(eq(conversations.id, input.conversationId));
        
      return { success: true };
    }),

  // Send outbound message (handles Meta Graph API for FB/IG, mocks for SMS)
  mockSendSms: adminProcedure
    .input(z.object({
      conversationId: z.number(),
      content: z.string().optional(),
      mediaUrl: z.string().optional(),
      isInternal: z.boolean().optional(),
      scheduledAt: z.string().optional(), // ISO string
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const convos = await db.select().from(conversations).where(eq(conversations.id, input.conversationId)).limit(1);
      const convo = convos[0];
      if (!convo) throw new Error("Conversation not found");

      if (!input.content && !input.mediaUrl) {
        throw new Error("Must provide either content or mediaUrl");
      }

      let finalContent = input.content ? input.content.replace(/\(\(review_link\)\)/g, "https://coachmindandbody.com/reviews").replace(/\(\(payment_link\)\)/g, "https://coachmindandbody.com/premium") : "";

      const { shortenLinksInText } = await import("../crm/automations");
      finalContent = await shortenLinksInText(finalContent);

      const isScheduled = !!input.scheduledAt && new Date(input.scheduledAt).getTime() > Date.now();
      const isInternal = !!input.isInternal;

      // Only send immediately if it's not internal and not scheduled
      let twilioSidToSave: string | null = null;
      let messageStatus: "queued" | "sent" | "failed" = isScheduled && !isInternal ? "queued" : "sent";
      
      if (!isInternal && !isScheduled) {
        // If it's a Meta channel, actually send it to Facebook/Instagram Graph API
        if ((convo.platform === "facebook" || convo.platform === "instagram") && convo.contactPhone) {
          try {
            const metaToken = await getMetaPageAccessToken();
            if (!metaToken) throw new Error("Meta Page is not connected");
            const metaRes = await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(metaToken)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipient: { id: convo.contactPhone },
                message: { text: finalContent }
              })
            });
            
            if (!metaRes.ok) {
              const errData = await metaRes.text();
              console.error("[Meta Graph API Error]", errData);
              throw new Error(`Failed to send Meta message: ${errData}`);
            }
          } catch (e) {
            console.error("[Meta Messaging Error]", e);
            throw e;
          }
        } else if (process.env.TWILIO_ACCOUNT_SID && convo.contactPhone) {
           let clean = convo.contactPhone.replace(/\D/g, "");
           if (clean.length === 10) clean = "1" + clean;
           if (!clean.startsWith("+")) clean = "+" + clean;
           let toTarget = clean;
           if (convo.platform === "whatsapp") toTarget = `whatsapp:${clean}`;
           
           try {
              const msgOpts: any = {
                body: finalContent,
                to: toTarget,
              };
              if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
                msgOpts.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
              } else {
                msgOpts.from = process.env.TWILIO_PHONE_NUMBER;
              }
              
              if (input.mediaUrl) {
                msgOpts.mediaUrl = [input.mediaUrl];
              }
              const twilioMsg = await twilioClient.messages.create(msgOpts);
              twilioSidToSave = twilioMsg.sid;
           } catch (e) {
              console.error("[Twilio SMS Error]", e);
              messageStatus = "failed";
           }
        }
      }

      // Save outbound message to DB
      await db.insert(messages).values({
        conversationId: input.conversationId,
        direction: "outbound",
        content: finalContent || null,
        mediaUrl: input.mediaUrl || null,
        twilioSid: twilioSidToSave,
        senderName: "Admin",
        status: messageStatus,
        isAutomated: false,
        isInternal: isInternal,
        scheduledAt: isScheduled ? new Date(input.scheduledAt!) : null,
      });

      // Update conversation's last active time
      await db.update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      return { success: true };
    }),

  // Start a new outbound conversation
  sendNewMessage: adminProcedure
    .input(z.object({
      phone: z.string(),
      content: z.string().optional(),
      mediaUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const phoneMatchSql = sql`REPLACE(REPLACE(REPLACE(REPLACE(${conversations.contactPhone}, '-', ''), ' ', ''), '(', ''), ')', '') LIKE CONCAT('%', RIGHT(${input.phone}, 10))`;
      
      const convRows = await db
        .select()
        .from(conversations)
        .where(phoneMatchSql)
        .limit(1);
      let conv: typeof convRows[0] | undefined = convRows[0];

      if (!conv) {
        const [result] = await db.insert(conversations).values({
          contactPhone: input.phone,
          status: 'open',
          platform: 'sms'
        });
        conv = { id: result.insertId } as any;
      }

      let finalContent = input.content
        ? input.content
            .replace(/\(\(review_link\)\)/g, "https://coachmindandbody.com/reviews")
            .replace(/\(\(payment_link\)\)/g, "https://coachmindandbody.com/premium")
        : "";

      const { shortenLinksInText } = await import("../crm/automations");
      finalContent = await shortenLinksInText(finalContent);

      let twilioSidToSave: string | null = null;
      let messageStatus: "sent" | "failed" = "sent";

      if (process.env.TWILIO_ACCOUNT_SID && input.phone) {
        let clean = input.phone.replace(/\D/g, "");
        if (clean.length === 10) clean = "1" + clean;
        if (!clean.startsWith("+")) clean = "+" + clean;

        try {
          const msgOpts: Record<string, unknown> = {
            body: finalContent || "",
            to: clean,
          };
          if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
            msgOpts.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
          } else {
            msgOpts.from = process.env.TWILIO_PHONE_NUMBER;
          }
          if (input.mediaUrl) {
            msgOpts.mediaUrl = [input.mediaUrl];
          }
          const twilioMsg = await twilioClient.messages.create(msgOpts as any);
          twilioSidToSave = twilioMsg.sid;
        } catch (e) {
          console.error("[Twilio New Message Error]", e);
          messageStatus = "failed";
        }
      } else if (!process.env.TWILIO_ACCOUNT_SID) {
        messageStatus = "failed";
      }

      await db.insert(messages).values({
        conversationId: conv!.id,
        content: finalContent || null,
        mediaUrl: input.mediaUrl || null,
        direction: "outbound",
        senderName: "Admin",
        status: messageStatus,
        twilioSid: twilioSidToSave,
      });

      await db.update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conv!.id));

      if (messageStatus === "failed") {
        throw new Error("Failed to send SMS — check Twilio configuration");
      }

      return { success: true, conversationId: conv!.id };
    }),

  retryFailedMessage: adminProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const msgRows = await db.select().from(messages).where(eq(messages.id, input.messageId)).limit(1);
      const msg = msgRows[0];
      if (!msg) throw new Error("Message not found");
      if (msg.direction !== "outbound") throw new Error("Only outbound messages can be retried");
      if (msg.status !== "failed") throw new Error("Only failed messages can be retried");

      const convos = await db.select().from(conversations).where(eq(conversations.id, msg.conversationId)).limit(1);
      const convo = convos[0];
      if (!convo?.contactPhone) throw new Error("No phone number for this conversation");

      let twilioSidToSave: string | null = msg.twilioSid;
      let messageStatus: "sent" | "failed" = "sent";

      if (process.env.TWILIO_ACCOUNT_SID && convo.contactPhone) {
        let clean = convo.contactPhone.replace(/\D/g, "");
        if (clean.length === 10) clean = "1" + clean;
        if (!clean.startsWith("+")) clean = "+" + clean;
        let toTarget = clean;
        if (convo.platform === "whatsapp") toTarget = `whatsapp:${clean}`;

        try {
          const msgOpts: Record<string, unknown> = {
            body: msg.content || "",
            to: toTarget,
          };
          if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
            msgOpts.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
          } else {
            msgOpts.from = process.env.TWILIO_PHONE_NUMBER;
          }
          if (msg.mediaUrl) {
            msgOpts.mediaUrl = [msg.mediaUrl];
          }
          const twilioMsg = await twilioClient.messages.create(msgOpts as any);
          twilioSidToSave = twilioMsg.sid;
        } catch (e) {
          console.error("[Twilio Retry Error]", e);
          messageStatus = "failed";
        }
      } else {
        messageStatus = "failed";
      }

      await db.update(messages)
        .set({ status: messageStatus, twilioSid: twilioSidToSave })
        .where(eq(messages.id, input.messageId));

      if (messageStatus === "failed") {
        throw new Error("Retry failed — check Twilio logs");
      }

      await db.update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, msg.conversationId));

      return { success: true };
    }),

  markAsRead: adminProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const convos = await db.select().from(conversations).where(eq(conversations.id, input.conversationId)).limit(1);
      const convo = convos[0];
      if (!convo) return { success: false };

      let allConvIds = [input.conversationId];
      if (convo.contactPhone && (convo.platform === 'sms' || convo.platform === 'whatsapp')) {
        const cleanPhone = convo.contactPhone.replace(/\D/g, "").replace(/^1/, "");
        if (cleanPhone.length >= 10) {
          const matches = await db.select({ id: conversations.id }).from(conversations).where(
              like(conversations.contactPhone, `%${cleanPhone}%`)
          );
          allConvIds = matches.map(m => m.id);
        }
      }

      await db.update(conversations)
        .set({ unreadCount: 0 })
        .where(inArray(conversations.id, allConvIds));
        
      return { success: true };
    }),

  toggleBotActive: adminProcedure
    .input(z.object({ conversationId: z.number(), botActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(conversations)
        .set({ botActive: input.botActive })
        .where(eq(conversations.id, input.conversationId));
      return { success: true };
    }),

  resolveContactByPhone: adminProcedure
    .input(z.object({ phone: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { name: null, userId: null, phone: input.phone };
      return resolveContactByPhone(db, input.phone);
    }),

  searchContactsForCompose: adminProcedure
    .input(z.object({ query: z.string().min(2).max(100) }))
    .query(async ({ input }) => {
      return searchContactsForCompose(input.query);
    }),
});
