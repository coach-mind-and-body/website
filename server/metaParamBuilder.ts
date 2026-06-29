import {
  ParamBuilder,
  PlainDataObject,
  type CookieSettings,
} from "capi-param-builder-nodejs";

const TRACKING_DOMAINS = ["mindandbodyresetcoach.com", "localhost"];

export interface MetaRequestParams {
  fbc: string | null;
  fbp: string | null;
  clientIp: string | null;
  userAgent: string | null;
  eventSourceUrl: string | null;
  referrerUrl: string | null;
}

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

function buildPlainDataFromRequest(req: Request): PlainDataObject {
  const url = new URL(req.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  return new PlainDataObject(
    url.host,
    queryParams,
    parseCookieHeader(req.headers.get("cookie")),
    req.headers.get("referer"),
    req.headers.get("x-forwarded-for"),
    null,
    url.protocol.replace(":", ""),
    url.pathname + url.search
  );
}

function createBuilder(): ParamBuilder {
  return new ParamBuilder(TRACKING_DOMAINS);
}

export function extractMetaParamsFromRequest(
  req: Request,
  overrides?: { fbc?: string | null; fbp?: string | null }
): MetaRequestParams {
  const builder = createBuilder();
  builder.processRequestFromContext(buildPlainDataFromRequest(req));

  return {
    fbc: overrides?.fbc ?? builder.getFbc(),
    fbp: overrides?.fbp ?? builder.getFbp(),
    clientIp: builder.getClientIpAddress(),
    userAgent: req.headers.get("user-agent"),
    eventSourceUrl: builder.getEventSourceUrl(),
    referrerUrl: builder.getReferrerUrl(),
  };
}

export function buildPlainDataFromUrl(
  host: string,
  pathname: string,
  search: string,
  cookies: Record<string, string>,
  headers: {
    referer?: string | null;
    xForwardedFor?: string | null;
    protocol?: string;
  }
): PlainDataObject {
  const queryParams: Record<string, string> = {};
  const params = new URLSearchParams(search);
  params.forEach((value, key) => {
    queryParams[key] = value;
  });

  return new PlainDataObject(
    host,
    queryParams,
    cookies,
    headers.referer ?? null,
    headers.xForwardedFor ?? null,
    null,
    headers.protocol?.replace(":", "") ?? "https",
    pathname + search
  );
}

// Re-implement processRequestAndGetCookies for the Edge runtime
export function processRequestAndGetCookies(
  plainData: any
): { name: string; value: string; maxAge: number; domain: string }[] {
  const cookiesToSet: { name: string; value: string; maxAge: number; domain: string }[] = [];
  const now = Date.now();
  const domain = "mindandbodyresetcoach.com";
  const maxAge = 60 * 60 * 24 * 90; // 90 days

  // Handle _fbp (Facebook Browser ID)
  let fbp = plainData.cookies?.["_fbp"];
  if (!fbp) {
    const random = Math.floor(Math.random() * 10000000000);
    fbp = `fb.1.${now}.${random}`;
    cookiesToSet.push({ name: "_fbp", value: fbp, maxAge, domain });
  }

  // Handle _fbc (Facebook Click ID)
  let fbc = plainData.cookies?.["_fbc"];
  const fbclid = plainData.queryParams?.["fbclid"];
  if (fbclid) {
    fbc = `fb.1.${now}.${fbclid}`;
    cookiesToSet.push({ name: "_fbc", value: fbc, maxAge, domain });
  }

  return cookiesToSet;
}

export function getParamBuilderForPii(): ParamBuilder {
  return createBuilder();
}

export function metaParamsToStripeMetadata(
  params: MetaRequestParams,
  eventId?: string
): Record<string, string> {
  const metadata: Record<string, string> = {};
  if (params.fbc) metadata.meta_fbc = params.fbc;
  if (params.fbp) metadata.meta_fbp = params.fbp;
  if (eventId) metadata.meta_event_id = eventId;
  return metadata;
}

export function metaParamsFromStripeMetadata(
  metadata: Record<string, string> | null | undefined
): Pick<MetaRequestParams, "fbc" | "fbp"> & { eventId?: string } {
  return {
    fbc: metadata?.meta_fbc ?? null,
    fbp: metadata?.meta_fbp ?? null,
    eventId: metadata?.meta_event_id,
  };
}
