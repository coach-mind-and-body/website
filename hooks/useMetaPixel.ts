/**
 * useMetaPixel - lightweight wrapper around the Meta Pixel (fbq) global.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

interface LeadParams {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

interface ViewContentParams {
  content_name?: string;
  content_category?: string;
  content_type?: string;
  value?: number;
  currency?: string;
}

export function useMetaPixel() {
  function track(event: string, params?: Record<string, unknown>, eventId?: string) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      if (eventId) {
        window.fbq("track", event, params ?? {}, { eventID: eventId });
      } else if (params) {
        window.fbq("track", event, params);
      } else {
        window.fbq("track", event);
      }
    }
  }

  function trackLead(params?: LeadParams, eventId?: string) {
    track("Lead", params as Record<string, unknown>, eventId);
  }

  function trackViewContent(params?: ViewContentParams) {
    track("ViewContent", params as Record<string, unknown>);
  }

  function trackInitiateCheckout(params?: Record<string, unknown>, eventId?: string) {
    track("InitiateCheckout", params, eventId);
  }

  function trackPurchase(params?: { value: number; currency: string }, eventId?: string) {
    track("Purchase", params as Record<string, unknown>, eventId);
  }

  return { track, trackLead, trackViewContent, trackInitiateCheckout, trackPurchase };
}
