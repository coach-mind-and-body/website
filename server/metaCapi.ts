import crypto from "crypto";
import { ENV } from "./_core/env";

interface LeadParams {
  customerEmail: string;
  customerName?: string | null;
  contentName: string;
}

/**
 * Fire a server-side Lead event via Meta Conversions API.
 * This connects your custom database/CRM directly to Meta,
 * ensuring 100% accurate conversion reporting even if the user has ad blockers.
 */
export async function fireMetaPixelLead(params: LeadParams) {
  try {
    if (!ENV.metaConversionsApiToken) {
      console.warn('[Meta CAPI] No access token configured — skipping Lead event');
      return;
    }

    const hashValue = (val: string) =>
      crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');

    const userData: Record<string, string | string[]> = {
      em: [hashValue(params.customerEmail)],
    };

    if (params.customerName) {
      const parts = params.customerName.trim().split(' ');
      if (parts[0]) userData.fn = [hashValue(parts[0])];
      if (parts.length > 1) userData.ln = [hashValue(parts.slice(1).join(' '))];
    }

    const payload = {
      data: [{
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: 'https://mindandbodyresetcoach.com/snack-hack',
        user_data: userData,
        custom_data: {
          content_name: params.contentName,
          content_category: 'Lead Generation',
        },
      }],
    };

    const url = `https://graph.facebook.com/v18.0/${ENV.metaPixelId}/events?access_token=${ENV.metaConversionsApiToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const result = (await response.json()) as {
      events_received?: number;
      error?: { message: string };
    };

    if (result.error) {
      console.error('[Meta CAPI] API error:', result.error.message);
    } else {
      console.log(
        `[Meta CAPI] Lead event sent — events_received: ${result.events_received} | ${params.contentName}`
      );
    }
  } catch (err) {
    console.error('[Meta CAPI] Failed to fire Lead event:', err);
  }
}
