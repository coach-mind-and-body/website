import { SITE_URL } from "@shared/brand";

/**
 * Christmas header for the Holiday program emails and the Metabolic Coaching
 * series while that series runs in the holiday season.
 *
 * Set USE_HOLIDAY_EMAIL_LOGO to false in January. Both series go back to the
 * regular wide logo. Nothing else on the site uses this image.
 */
export const USE_HOLIDAY_EMAIL_LOGO = true;

export const HOLIDAY_EMAIL_LOGO_PATH = "/logo-holiday.jpg";

/** Absolute URL. Email clients do not load a site-relative image path. */
export const HOLIDAY_EMAIL_LOGO_URL = `${SITE_URL}${HOLIDAY_EMAIL_LOGO_PATH}`;

/** Square seal. The regular wide wordmark stays at 280px. */
export const HOLIDAY_EMAIL_LOGO_WIDTH = 200;

/** Matches the logo file's background so the header reads as one piece. */
export const HOLIDAY_EMAIL_LOGO_BAR = "#fccdbd";
