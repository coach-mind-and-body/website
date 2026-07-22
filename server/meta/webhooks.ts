const GRAPH_API_VERSION = "v20.0";

const PAGE_SUBSCRIBED_FIELDS = [
  "messages",
  "message_echoes",
  "messaging_postbacks",
  "message_deliveries",
  "message_reads",
].join(",");

export type MetaWebhookSubscribeResult = {
  pageId: string;
  instagramAccountId: string | null;
  pageSubscribed: boolean;
  instagramSubscribed: boolean;
  errors: string[];
  pageResponse?: unknown;
  instagramResponse?: unknown;
};

export async function fetchInstagramBusinessAccountId(
  pageId: string,
  pageAccessToken: string
): Promise<string | null> {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(pageAccessToken)}`
  );
  const data = await res.json();
  if (!res.ok) {
    console.error("[Meta Webhooks] Failed to fetch IG business account:", data);
    return null;
  }
  return data.instagram_business_account?.id ?? null;
}

export async function subscribeMetaWebhooks(
  pageId: string,
  pageAccessToken: string
): Promise<MetaWebhookSubscribeResult> {
  const result: MetaWebhookSubscribeResult = {
    pageId,
    instagramAccountId: null,
    pageSubscribed: false,
    instagramSubscribed: false,
    errors: [],
  };

  result.instagramAccountId = await fetchInstagramBusinessAccountId(pageId, pageAccessToken);

  const pageSubRes = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps?subscribed_fields=${PAGE_SUBSCRIBED_FIELDS}&access_token=${encodeURIComponent(pageAccessToken)}`,
    { method: "POST" }
  );
  result.pageResponse = await pageSubRes.json();
  result.pageSubscribed = pageSubRes.ok && (result.pageResponse as { success?: boolean })?.success === true;
  if (!result.pageSubscribed) {
    result.errors.push(`Page webhook subscribe failed: ${JSON.stringify(result.pageResponse)}`);
  }

  if (result.instagramAccountId) {
    const igSubRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${result.instagramAccountId}/subscribed_apps?subscribed_fields=messages&access_token=${encodeURIComponent(pageAccessToken)}`,
      { method: "POST" }
    );
    result.instagramResponse = await igSubRes.json();
    result.instagramSubscribed =
      igSubRes.ok && (result.instagramResponse as { success?: boolean })?.success === true;
    if (!result.instagramSubscribed) {
      result.errors.push(`Instagram webhook subscribe failed: ${JSON.stringify(result.instagramResponse)}`);
    }
  } else {
    result.errors.push(
      "No Instagram Business account is linked to this Facebook Page. Link IG in Meta Business Suite, then reconnect."
    );
  }

  return result;
}

export async function getMetaWebhookStatus(
  pageId: string,
  pageAccessToken: string,
  instagramAccountId?: string | null
): Promise<{
  pageSubscribed: boolean;
  instagramSubscribed: boolean;
  instagramAccountId: string | null;
}> {
  const igId =
    instagramAccountId ?? (await fetchInstagramBusinessAccountId(pageId, pageAccessToken));

  let pageSubscribed = false;
  let instagramSubscribed = false;

  try {
    const pageRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps?access_token=${encodeURIComponent(pageAccessToken)}`
    );
    const pageData = await pageRes.json();
    if (pageRes.ok && Array.isArray(pageData.data)) {
      pageSubscribed = pageData.data.some((app: { id?: string }) => app.id === process.env.META_APP_ID);
    }
  } catch (e) {
    console.error("[Meta Webhooks] Page subscription check failed", e);
  }

  if (igId) {
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${igId}/subscribed_apps?access_token=${encodeURIComponent(pageAccessToken)}`
      );
      const igData = await igRes.json();
      if (igRes.ok && Array.isArray(igData.data)) {
        instagramSubscribed = igData.data.some((app: { id?: string }) => app.id === process.env.META_APP_ID);
      }
    } catch (e) {
      console.error("[Meta Webhooks] Instagram subscription check failed", e);
    }
  }

  return { pageSubscribed, instagramSubscribed, instagramAccountId: igId };
}
