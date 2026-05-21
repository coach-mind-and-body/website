import { ENV } from "./_core/env";

const DC = ENV.mailchimpMarketingApiKey.split("-")[1] ?? "us17"; // e.g. "us17"
const BASE = `https://${DC}.api.mailchimp.com/3.0`;

function authHeader() {
  const token = Buffer.from(`anystring:${ENV.mailchimpMarketingApiKey}`).toString("base64");
  return { Authorization: `Basic ${token}`, "Content-Type": "application/json" };
}

export interface SubscribeOptions {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  mergeFields?: Record<string, string>;
}

/**
 * Subscribe (or update) a contact in the Mailchimp audience.
 * Uses PUT upsert so re-subscribing an existing contact works cleanly.
 */
export async function mailchimpSubscribe(opts: SubscribeOptions): Promise<{ success: boolean; error?: string }> {
  const listId = ENV.mailchimpAudienceId;
  if (!listId || !ENV.mailchimpMarketingApiKey) {
    console.warn("[Mailchimp] API key or Audience ID not configured");
    return { success: false, error: "Mailchimp not configured" };
  }

  const emailHash = await md5(opts.email.toLowerCase().trim());
  const url = `${BASE}/lists/${listId}/members/${emailHash}`;

  const body: Record<string, unknown> = {
    email_address: opts.email.toLowerCase().trim(),
    status_if_new: "subscribed",
    status: "subscribed",
  };

  if (opts.firstName || opts.lastName) {
    body.merge_fields = {
      ...(opts.firstName ? { FNAME: opts.firstName } : {}),
      ...(opts.lastName ? { LNAME: opts.lastName } : {}),
      ...(opts.mergeFields ?? {}),
    };
  }

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Mailchimp] Subscribe failed:", err);
      return { success: false, error: (err as { detail?: string }).detail ?? "Subscribe failed" };
    }

    // Apply tags if provided
    if (opts.tags && opts.tags.length > 0) {
      await applyTags(listId, emailHash, opts.tags);
    }

    return { success: true };
  } catch (e) {
    console.error("[Mailchimp] Network error:", e);
    return { success: false, error: "Network error" };
  }
}

async function applyTags(listId: string, emailHash: string, tags: string[]) {
  const url = `${BASE}/lists/${listId}/members/${emailHash}/tags`;
  const body = { tags: tags.map((name) => ({ name, status: "active" })) };
  try {
    await fetch(url, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("[Mailchimp] Tag apply failed:", e);
  }
}

/** Minimal MD5 implementation using Node's built-in crypto */
async function md5(str: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("md5").update(str).digest("hex");
}
