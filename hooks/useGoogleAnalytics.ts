import { isClientAnalyticsDisabled, isAnalyticsExcludedPath } from "@/lib/analyticsExclude";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
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

/**
 * useGoogleAnalytics — lightweight wrapper around the Google Analytics (gtag) global.
 * No-ops on /admin (and other excluded paths).
 */
export function useGoogleAnalytics() {
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (analyticsBlocked()) return;
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      if (params) {
        window.gtag("event", eventName, params);
      } else {
        window.gtag("event", eventName);
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.log(`[GA4 Mock] Event: ${eventName}`, params);
    }
  };

  const trackLead = (params?: Record<string, any>) => {
    trackEvent("generate_lead", params);
  };

  const trackInitiateCheckout = (params?: Record<string, any>) => {
    trackEvent("begin_checkout", params);
  };

  const trackPurchase = (params?: Record<string, any>) => {
    trackEvent("purchase", params);
  };

  const trackViewContent = (params?: Record<string, any>) => {
    trackEvent("view_item", params);
  };

  return {
    trackEvent,
    trackLead,
    trackInitiateCheckout,
    trackPurchase,
    trackViewContent,
  };
}
