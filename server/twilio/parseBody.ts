import { NextRequest } from "next/server";

/**
 * Parses application/x-www-form-urlencoded bodies from Twilio Webhooks
 * natively in the Next.js App Router.
 */
export async function parseTwilioFormData(req: NextRequest): Promise<Record<string, string>> {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const result: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  } catch (err) {
    console.error("[Twilio Parser] Failed to parse x-www-form-urlencoded body:", err);
    return {};
  }
}
