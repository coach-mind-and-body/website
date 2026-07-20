/**
 * useMetaPixel - lightweight wrapper around the Meta Pixel (fbq) global.
 * No-ops on /admin (and other excluded paths).
 */

import { isClientAnalyticsDisabled, isAnalyticsExcludedPath } from "@/lib/analyticsExclude";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function analyticsBlocked(): boolean {
  if (typeof window === "undefined") return true;
  if (isClientAnalyticsDisabled()) return true;
  try {
    return isAnalyticsExcludedPath(window.location.pathname);
  } catch {
    return false;
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
    if (analyticsBlocked()) return;
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
