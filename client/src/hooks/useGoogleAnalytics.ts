declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * useGoogleAnalytics — lightweight wrapper around the Google Analytics (gtag) global.
 */
export function useGoogleAnalytics() {
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      if (params) {
        window.gtag("event", eventName, params);
      } else {
        window.gtag("event", eventName);
      }
    } else if (import.meta.env.DEV) {
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
