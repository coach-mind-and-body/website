/**
 * Meta Conversions API (server-side) — primary ad attribution path.
 * Browser pixel + event_id dedupe for Leads; Purchase from Stripe webhooks.
 * No Manus / CAPIG dependency — posts directly to graph.facebook.com.
 */
import { ENV } from "./_core/env";
import {
  extractMetaParamsFromRequest,
  getParamBuilderForPii,
  type MetaRequestParams,
} from "./metaParamBuilder";

/** Graph API version for Conversions API */
const META_GRAPH_VERSION = "v21.0";

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
  clientIp?: string | null;
  userAgent?: string | null;
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
    if (hashed) {
      userData.em = [hashed];
      // external_id = hashed email improves match quality when cookie/fbp missing
      userData.external_id = [hashed];
    }
  }

  if (params.name) {
    const parts = params.name.trim().split(/\s+/);
    if (parts[0]) {
      const fn = builder.getNormalizedAndHashedPII(parts[0], "first_name");
      if (fn) userData.fn = [fn];
    }
    if (parts.length > 1) {
      const ln = builder.getNormalizedAndHashedPII(
        parts.slice(1).join(" "),
        "last_name"
      );
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

function hasUsefulUserData(userData: UserData): boolean {
  return Boolean(
    userData.em ||
      userData.ph ||
      userData.fbc ||
      userData.fbp ||
      userData.external_id
  );
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
}): Promise<boolean> {
  if (!ENV.metaConversionsApiToken) {
    console.warn(
      `[Meta CAPI] No META_CONVERSIONS_API_TOKEN — skipping ${payload.event_name}`
    );
    return false;
  }

  if (!hasUsefulUserData(payload.user_data)) {
    console.warn(
      `[Meta CAPI] Insufficient user_data for ${payload.event_name} — need email, phone, fbc, or fbp`
    );
    return false;
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${ENV.metaPixelId}/events?access_token=${ENV.metaConversionsApiToken}`;

  const body: {
    data: unknown[];
    test_event_code?: string;
  } = {
    data: [payload],
  };

  // Optional: set META_TEST_EVENT_CODE in Railway to verify in Events Manager Test Events
  const testCode = process.env.META_TEST_EVENT_CODE?.trim();
  if (testCode) {
    body.test_event_code = testCode;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message: string; code?: number; error_subcode?: number };
    };

    if (!response.ok || result.error) {
      console.error(
        `[Meta CAPI] ${payload.event_name} failed HTTP ${response.status}:`,
        result.error?.message ?? JSON.stringify(result)
      );
      return false;
    }

    console.log(
      `[Meta CAPI] ${payload.event_name} ok — events_received=${result.events_received}` +
        (payload.event_id ? ` event_id=${payload.event_id}` : "")
    );
    return true;
  } catch (err) {
    console.error(`[Meta CAPI] Network error (${payload.event_name}):`, err);
    return false;
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
        params.eventSourceUrl ??
        tracking?.eventSourceUrl ??
        "https://mindandbodyresetcoach.com",
      referrer_url: tracking?.referrerUrl,
      // Same event_id as browser fbq(..., { eventID }) for dedupe
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
      clientIp: params.clientIp,
      userAgent: params.userAgent,
    });

    // Prefer real match keys; do NOT invent fake IP/UA (hurts Event Match Quality)
    if (!hasUsefulUserData(userData)) {
      console.warn(
        "[Meta CAPI] Purchase skipped — no email/phone/fbc/fbp for matching"
      );
      return;
    }

    await sendMetaEvent({
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url:
        params.eventSourceUrl ?? "https://mindandbodyresetcoach.com",
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

    if (!hasUsefulUserData(userData)) {
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
