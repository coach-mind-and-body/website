import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

function getModel() {
  return google("gemini-2.5-flash");
}

const seoSuggestionsSchema = z.object({
  seoTitle: z.string().describe("Optimized SEO title, 50-60 characters, includes focus keyword naturally"),
  seoDescription: z.string().describe("Optimized meta description, 120-160 characters, compelling and includes focus keyword"),
  suggestedSlug: z.string().describe("URL-friendly slug suggestion that includes the focus keyword"),
  titleSuggestion: z.string().describe("Improved blog post title that is engaging and SEO-friendly"),
  excerptSuggestion: z.string().describe("Compelling excerpt/summary, 1-2 sentences that entice readers"),
  internalLinkSuggestions: z.array(z.object({
    anchorText: z.string().describe("Suggested anchor text for the link"),
    targetPath: z.string().describe("Suggested internal page path to link to"),
    reason: z.string().describe("Why this internal link would be beneficial"),
  })).describe("Suggested internal links to add to the content"),
  contentTips: z.array(z.string()).describe("3-5 specific, actionable tips to improve the content for SEO"),
  focusKeywordSuggestions: z.array(z.string()).describe("3-5 alternative or related focus keywords to consider"),
});

export type SeoSuggestions = z.infer<typeof seoSuggestionsSchema>;

export const seoOptimizerRouter = router({
  generateSuggestions: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(), // HTML content
      excerpt: z.string().optional(),
      slug: z.string(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      focusKeyword: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);

      const model = getModel();

      // Strip HTML for analysis
      const plainContent = input.content
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000); // Limit to avoid token overflow

      const prompt = `You are an expert SEO consultant specializing in health and wellness blogs for women aged 40-60. Analyze the following blog post and generate optimized SEO suggestions.

IMPORTANT CONTEXT:
- This is for "Mind and Body Reset" — a health coaching brand by Lee Anne Chapman
- Target audience: Women 40-60 in the Wasatch Front (Utah) area
- Topics: nutrition, hormones, menopause, mindset, coaching, food freedom, emotional wellness
- Website has these pages that can be linked internally:
  /reclaim (R.E.C.L.A.I.M. coaching program)
  /food-quiz (food freedom quiz)
  /book (discovery call booking)
  /financial-peace (Financial Peace University)
  /midlife-health-podcast (podcast page)
  /health-wellness-blog (blog listing)
  /join (email list sign-up)

BLOG POST DATA:
Title: ${input.title}
Current Slug: ${input.slug}
Category: ${input.category || "Not set"}
Focus Keyword: ${input.focusKeyword || "Not set"}
Current SEO Title: ${input.seoTitle || "Not set"}
Current Meta Description: ${input.seoDescription || "Not set"}
Current Excerpt: ${input.excerpt || "Not set"}

Content (first 5000 chars):
${plainContent}

Generate optimized suggestions. Make the SEO title exactly 50-60 characters. Make the meta description exactly 120-160 characters. Be specific to this content — don't be generic. The tone should be warm, empowering, and relatable for midlife women.`;

      try {
        const result = await generateObject({
          model,
          schema: seoSuggestionsSchema,
          prompt,
        });

        return result.object;
      } catch (error: any) {
        console.error("[SEO Optimizer] AI generation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate SEO suggestions. Please try again.",
        });
      }
    }),
});
