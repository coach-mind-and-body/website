/**
 * useMetaPixel — lightweight wrapper around the Meta Pixel (fbq) global.
 *
 * Usage:
 *   const { trackLead, trackViewContent } = useMetaPixel();
 *   trackLead({ content_name: "Food Quiz" });
 *   trackViewContent({ content_name: "R.E.C.L.A.I.M. Program", content_category: "Coaching" });
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
  function track(event: string, params?: Record<string, unknown>) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      if (params) {
        window.fbq("track", event, params);
      } else {
        window.fbq("track", event);
      }
    }
  }

  function trackLead(params?: LeadParams) {
    track("Lead", params as Record<string, unknown>);
  }

  function trackViewContent(params?: ViewContentParams) {
    track("ViewContent", params as Record<string, unknown>);
  }

  function trackInitiateCheckout(params?: Record<string, unknown>) {
    track("InitiateCheckout", params);
  }

  function trackPurchase(params?: { value: number; currency: string }) {
    track("Purchase", params as Record<string, unknown>);
  }

  return { track, trackLead, trackViewContent, trackInitiateCheckout, trackPurchase };
}
