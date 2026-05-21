/**
 * Chat API Handler
 *
 * Express endpoint for AI SDK streaming chat with tool calling support.
 */

import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { tool } from "ai";
import { google } from "@ai-sdk/google";
import type { Express } from "express";
import { z } from "zod/v4";
import { ENV } from "./env";

/**
 * Example tool registry - customize these for your app.
 */
const tools = {
  getWeather: tool({
    description: "Get the current weather for a location",
    inputSchema: z.object({
      location: z
        .string()
        .describe("The city and country, e.g. 'Tokyo, Japan'"),
      unit: z.enum(["celsius", "fahrenheit"]).optional().default("celsius"),
    }),
    execute: async ({ location, unit }) => {
      // Simulate weather API call
      const temp = Math.floor(Math.random() * 30) + 5;
      const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"][
        Math.floor(Math.random() * 4)
      ] as string;
      return {
        location,
        temperature: unit === "fahrenheit" ? Math.round(temp * 1.8 + 32) : temp,
        unit,
        conditions,
        humidity: Math.floor(Math.random() * 50) + 30,
      };
    },
  }),

  calculate: tool({
    description: "Perform a mathematical calculation",
    inputSchema: z.object({
      expression: z
        .string()
        .describe("The math expression to evaluate, e.g. '2 + 2'"),
    }),
    execute: async ({ expression }) => {
      try {
        // Simple safe eval for basic math
        const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
        const result = Function(
          `"use strict"; return (${sanitized})`
        )() as number;
        return { expression, result };
      } catch {
        return { expression, error: "Invalid expression" };
      }
    },
  }),
};

/**
 * Registers the /api/chat endpoint for streaming AI responses.
 *
 * @example
 * ```ts
 * // In server/_core/index.ts
 * import { registerChatRoutes } from "./chat";
 *
 * registerChatRoutes(app);
 * ```
 */
export function registerChatRoutes(app: Express) {
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "messages array is required" });
        return;
      }

      // Convert UIMessage[] (AI SDK v6 format with parts) to ModelMessage[] for streamText
      const coreMessages = await convertToModelMessages(messages);

      const result = streamText({
        model: google("gemini-2.5-flash"),
        system: `You are a warm, knowledgeable assistant for Mind and Body Reset, Lee Anne Chapman's health and life coaching business.

## STRICT SCOPE RULE
You ONLY answer questions about Lee Anne's programs, coaching philosophy, the podcast, and the free quiz. You do NOT provide general health advice, medical opinions, nutrition plans, diagnoses, or information about other coaches, products, or services. If asked anything outside this scope, warmly redirect: "That's a great question — for personalized guidance on that, I'd recommend booking a free discovery call with Lee Anne directly!"

Do NOT make up details, pricing, dates, or program content beyond what is listed below. If you don't know something specific, say so and direct them to book a call.

## About Lee Anne
- Certified Life Coach and Health Coach specializing in women 40+
- Personally navigated hormone chaos, insulin resistance, and midlife health challenges
- Based in the Wasatch Front area of Utah
- Passionate about helping women stop "starting over" and build real, lasting health

## Services
1. **R.E.C.L.A.I.M. Program** — Lee Anne's signature 6-phase health coaching program for women 40+. Covers mindset, nutrition, movement, hormones, sleep, and stress. Helps women reclaim their body, rewire their mind, and reset their life. Learn more: [View R.E.C.L.A.I.M.](https://www.mindandbodyresetcoach.com/reclaim)
2. **Financial Peace University (FPU)** — Dave Ramsey's 9-lesson financial course taught by Lee Anne. Covers budgeting, debt elimination, saving, investing, and building wealth. Offered as group classes. Learn more: [View FPU](https://www.mindandbodyresetcoach.com/financial-peace)
3. **Midlife Health Podcast** — "Mind and Body Reset" podcast published every other week on YouTube. Covers insulin resistance, GLP-1s, hormones, mindset, strength training, and stopping the cycle of starting over. Listen here: [Visit Podcast](https://www.mindandbodyresetcoach.com/midlife-health-podcast)
4. **Free Quiz** — "What's Really Keeping You Stuck with Food?" — a 60-second quiz to help women understand their food and mindset type. Take it here: [Take the Free Quiz](https://www.mindandbodyresetcoach.com/quiz)

## Key Messages
- This is NOT about willpower — it's about understanding your body
- No extremes, no shame, no diet culture
- Real talk about what actually works in midlife
- Hormones, insulin resistance, and stress are often the real culprits

## Your Role
- Answer questions about Lee Anne's programs, coaching approach, and the podcast warmly and helpfully
- ALWAYS use Markdown link syntax for any URL you mention: [Link Text](https://full-url-here.com)
- NEVER write bare URLs like mindandbodyresetcoach.com/book — always wrap them as [Book a Free Call](https://www.mindandbodyresetcoach.com/book)
- Encourage visitors to book a free discovery call: [Book a Free Call](https://www.mindandbodyresetcoach.com/book)
- Suggest the free quiz as a great starting point: [Take the Free Quiz](https://www.mindandbodyresetcoach.com/quiz)
- Keep responses concise, warm, and conversational — not clinical or overly formal
- End responses with one relevant action link when appropriate`,
        messages: coreMessages,
        stopWhen: stepCountIs(5),
      });

      result.pipeUIMessageStreamToResponse(res);
    } catch (error) {
      console.error("[/api/chat] Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });
}

export { tools };
