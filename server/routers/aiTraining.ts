// @ts-nocheck
import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { aiKnowledge } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const aiTrainingRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return await db.query.aiKnowledge.findMany({
      orderBy: (aiKnowledge, { desc }) => [desc(aiKnowledge.createdAt)],
    });
  }),

  create: adminProcedure
    .input(z.object({
      category: z.string().min(1),
      title: z.string().min(1),
      content: z.string().min(1),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      
      const result = await db.insert(aiKnowledge).values({
        category: input.category,
        title: input.title,
        content: input.content,
        isActive: input.isActive,
      });
      
      return { id: result[0].insertId };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      category: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      
      const { id, ...data } = input;
      await db.update(aiKnowledge)
        .set(data)
        .where(eq(aiKnowledge.id, id));
        
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      
      await db.delete(aiKnowledge).where(eq(aiKnowledge.id, input.id));
      return { success: true };
    }),

  getPersona: adminProcedure.query(async () => {
    const { getAiPersona } = await import("../crm/ai");
    return { persona: await getAiPersona() };
  }),

  setPersona: adminProcedure
    .input(z.object({ persona: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { systemSettings } = await import("../../drizzle/schema");
      
      const existing = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, "AI_PERSONA")
      });

      if (existing) {
        await db.update(systemSettings).set({ value: input.persona }).where(eq(systemSettings.key, "AI_PERSONA"));
      } else {
        await db.insert(systemSettings).values({ key: "AI_PERSONA", value: input.persona });
      }
      return { success: true };
    }),

  magicImport: adminProcedure
    .input(z.object({ notes: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { invokeLLM } = { invokeLLM: async () => ({}) };
      
      const prompt = `You are an expert technical writer. The user is providing raw notes from a training or conference. 
Extract key business facts, policies, pricing, and advice from these notes and format them as individual AI knowledge rules.
Return ONLY a JSON array of objects, where each object has:
- "category" (string: e.g., "Disney", "Universal", "Cruises", "Policies", or "General")
- "title" (string: a short clear title for the fact, e.g., "Aulani Character Breakfast")
- "content" (string: the actual detail, written clearly. You may use markdown like bolding or bullet points).

Notes to extract:
${input.notes}`;

      const result = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 2000
      });

      try {
        const rawContent = result.choices?.[0]?.message?.content || "[]";
        const raw = typeof rawContent === 'string' ? rawContent : "[]";
        const cleanJson = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const facts = JSON.parse(cleanJson);

        let count = 0;
        for (const fact of facts) {
          if (fact.title && fact.content) {
            await db.insert(aiKnowledge).values({
              category: fact.category || "General",
              title: fact.title,
              content: fact.content,
              isActive: false // Always set to false for manual review
            });
            count++;
          }
        }
        return { success: true, count };
      } catch(e) {
        throw new Error("Failed to parse AI extraction");
      }
    }),

  triggerExtraction: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    
    const { conversations, messages } = await import("../../drizzle/schema");
    const { extractKnowledgeFromHistory } = await import("../crm/ai");
    const { and, gt } = await import("drizzle-orm");

    // Get conversations closed in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const closedConvs = await db.query.conversations.findMany({
      where: and(
        eq(conversations.status, "closed"),
        gt(conversations.updatedAt, yesterday)
      )
    });

    let newFactsCount = 0;
    for (const conv of closedConvs) {
      const thread = await db.query.messages.findMany({
        where: eq(messages.conversationId, conv.id),
        orderBy: (msgs, { asc }) => [asc(msgs.createdAt)]
      });

      if (thread.length < 5) continue;
      
      const transcript = thread.map((m: any) => `${m.direction === 'inbound' ? 'Customer' : 'Carter'}: ${m.content}`).join("\n");
      
      try {
        const facts = await extractKnowledgeFromHistory(transcript);
        for (const fact of facts) {
          await db.insert(aiKnowledge).values({
            category: fact.category || "General",
            title: fact.title,
            content: fact.content,
            isActive: false
          });
          newFactsCount++;
        }
      } catch(e) {
        console.error("Failed to extract facts for conv", conv.id, e);
      }
    }

    return { success: true, processed: closedConvs.length, newFactsCount };
  }),
});
