import { ENV } from "./_core/env";
import { Resend } from "resend";

export interface SubscribeOptions {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[]; // Resend audiences are simpler, tags can be ignored for now
}

/**
 * Subscribe a contact to the Resend audience.
 */
export async function resendSubscribe(opts: SubscribeOptions): Promise<{ success: boolean; error?: string }> {
  if (!ENV.resendApiKey || !ENV.resendAudienceId) {
    console.warn("[Resend] API key or Audience ID not configured");
    return { success: false, error: "Resend not configured" };
  }

  const resend = new Resend(ENV.resendApiKey);

  try {
    const { error } = await resend.contacts.create({
      email: opts.email.toLowerCase().trim(),
      firstName: opts.firstName,
      lastName: opts.lastName,
      unsubscribed: false,
      audienceId: ENV.resendAudienceId,
    });

    if (error) {
      console.error("[Resend] Subscribe failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("[Resend] Network error:", e);
    return { success: false, error: e.message || "Network error" };
  }
}
