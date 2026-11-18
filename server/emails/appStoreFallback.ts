import { BRAND } from "@shared/brand";
import { escapeHtml } from "../../lib/htmlEscape";

/** App Store listing. Universal-link buttons keep this as the line underneath. */
export const APP_STORE_URL = BRAND.appStoreUrl;

/**
 * One plain line under a button that opens the app through a site URL.
 * The App Store link is the way in for someone who does not have the app yet.
 */
export function appStoreFallbackLine(): string {
  const href = escapeHtml(APP_STORE_URL);
  return `<p style="margin:0;font-size:13px;line-height:1.5;color:#8a9a8a;font-weight:400;">Don't have the app yet? <a href="${href}" style="color:#8a7060;font-weight:600;text-decoration:underline;">Get it on the App Store.</a></p>`;
}
