import { ENV } from "./_core/env";
import {
  extractMetaParamsFromRequest,
  getParamBuilderForPii,
  type MetaRequestParams,
} from "./metaParamBuilder";

export interface MetaLeadParams {
  customerEmail: string;
  customerName?: string | null;
  customerPhone?: string | null;
  contentName: string;
  eventSourceUrl?: string;
  eventId?: string;
  req?: Request;
  fbc?: string | null;
  fbp?: string | null;
}

export interface MetaPurchaseParams {
  value: number;
  currency: string;
  content_name: string;
  content_category: string;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  eventSourceUrl?: string;
  eventId?: string;
  fbc?: string | null;
  fbp?: string | null;
}

type UserData = Record<string, string | string[]>;

function buildUserData(params: {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
}): UserData {
  const builder = getParamBuilderForPii();
  const userData: UserData = {};

  if (params.email) {
    const hashed = builder.getNormalizedAndHashedPII(params.email, "email");
    if (hashed) userData.em = [hashed];
  }

  if (params.name) {
    const parts = params.name.trim().split(/\s+/);
    if (parts[0]) {
      const fn = builder.getNormalizedAndHashedPII(parts[0], "first_name");
      if (fn) userData.fn = [fn];
    }
    if (parts.length > 1) {
      const ln = builder.getNormalizedAndHashedPII(parts.slice(1).join(" "), "last_name");
      if (ln) userData.ln = [ln];
    }
  }

  if (params.phone) {
    const ph = builder.getNormalizedAndHashedPII(params.phone, "phone");
    if (ph) userData.ph = [ph];
  }

  if (params.fbc) userData.fbc = params.fbc;
  if (params.fbp) userData.fbp = params.fbp;
  if (params.clientIp) userData.client_ip_address = params.clientIp;
  if (params.userAgent) userData.client_user_agent = params.userAgent;

  return userData;
}

function resolveTracking(
  req: Request | undefined,
  overrides: { fbc?: string | null; fbp?: string | null }
): MetaRequestParams | null {
  if (!req) {
    return {
      fbc: overrides.fbc ?? null,
      fbp: overrides.fbp ?? null,
      clientIp: null,
      userAgent: null,
      eventSourceUrl: null,
      referrerUrl: null,
    };
  }
  return extractMetaParamsFromRequest(req, overrides);
}

async function sendMetaEvent(payload: {
  event_name: string;
  event_time: number;
  action_source: string;
  event_source_url?: string;
  referrer_url?: string | null;
  event_id?: string;
  user_data: UserData;
  custom_data?: Record<string, string>;
}) {
  if (!ENV.metaConversionsApiToken) {
    console.warn(`[Meta CAPI] No access token configured - skipping ${payload.event_name} event`);
    return;
  }

  if (Object.keys(payload.user_data).length === 0) {
    console.warn(`[Meta CAPI] No user_data for ${payload.event_name} - skipping`);
    return;
  }

  const url = `https://graph.facebook.com/v18.0/${ENV.metaPixelId}/events?access_token=${ENV.metaConversionsApiToken}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [payload] }),
  });

  const result = (await response.json()) as {
    events_received?: number;
    error?: { message: string };
  };

  if (result.error) {
    console.error(`[Meta CAPI] API error (${payload.event_name}):`, result.error.message);
  } else {
    console.log(`[Meta CAPI] ${payload.event_name} sent - events_received: ${result.events_received}`);
  }
}

export async function fireMetaPixelLead(params: MetaLeadParams) {
  try {
    const tracking = resolveTracking(params.req, {
      fbc: params.fbc,
      fbp: params.fbp,
    });

    const userData = buildUserData({
      email: params.customerEmail,
      name: params.customerName,
      phone: params.customerPhone,
      fbc: tracking?.fbc,
      fbp: tracking?.fbp,
      clientIp: tracking?.clientIp,
      userAgent: tracking?.userAgent,
    });

    await sendMetaEvent({
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url:
        params.eventSourceUrl ?? tracking?.eventSourceUrl ?? "https://mindandbodyresetcoach.com",
      referrer_url: tracking?.referrerUrl,
      event_id: params.eventId,
      user_data: userData,
      custom_data: {
        content_name: params.contentName,
        content_category: "Lead Generation",
      },
    });
  } catch (err) {
    console.error("[Meta CAPI] Failed to fire Lead event:", err);
  }
}

export async function fireMetaPixelPurchase(params: MetaPurchaseParams) {
  try {
    const userData = buildUserData({
      email: params.customerEmail,
      name: params.customerName,
      phone: params.customerPhone,
      fbc: params.fbc,
      fbp: params.fbp,
    });

    if (Object.keys(userData).length === 0) {
      userData.client_ip_address = "0.0.0.0";
      userData.client_user_agent = "Mozilla/5.0";
    }

    await sendMetaEvent({
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: params.eventSourceUrl ?? "https://mindandbodyresetcoach.com",
      event_id: params.eventId,
      user_data: userData,
      custom_data: {
        value: (params.value / 100).toFixed(2),
        currency: params.currency,
        content_name: params.content_name,
        content_category: params.content_category,
        content_type: "product",
      },
    });
  } catch (err) {
    console.error("[Meta CAPI] Failed to fire Purchase event:", err);
  }
}

export interface MetaCrmParams {
  eventName: string;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  eventId?: string;
}

export async function fireMetaCrmEvent(params: MetaCrmParams) {
  try {
    const userData = buildUserData({
      email: params.customerEmail,
      name: params.customerName,
      phone: params.customerPhone,
    });

    if (Object.keys(userData).length === 0) {
      console.warn("[Meta CAPI] No user data for CRM event");
      return;
    }

    await sendMetaEvent({
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "system_generated",
      event_id: params.eventId,
      user_data: userData,
      custom_data: {
        event_source: "crm",
        lead_event_source: "Mind & Body Reset CRM",
      },
    });
  } catch (err) {
    console.error("[Meta CAPI] Failed to fire CRM event:", err);
  }
}
