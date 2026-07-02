/**
 * Routes vacation quote submissions to the appropriate nurture sequence
 * based on destination text and vacation type.
 */

export const QUOTE_SEQUENCE_NAMES = {
  UNIVERSAL: "Universal Orlando Nurture",
  DISNEY_WORLD: "Disney World Nurture",
  DISNEYLAND: "Disneyland Nurture",
  CRUISE: "Cruise Quote Nurture",
  BEACH: "Beach / All-Inclusive Nurture",
  INTERNATIONAL: "International Nurture",
  THEME_PARK: "Theme Park Nurture",
  GENERIC: "Generic Quote Nurture",
} as const;

export type QuoteRoutingInput = {
  destination?: string | null;
  vacationType?: string | null;
};

/** All quote-triggered nurture sequence names (for reply-cancel logic). */
export const QUOTE_NURTURE_SEQUENCE_NAMES: string[] = Object.values(QUOTE_SEQUENCE_NAMES);

/**
 * Priority ladder:
 * 1. Destination contains Universal → Universal
 * 2. Disneyland / Anaheim → Disneyland
 * 3. Walt Disney World / Disney World → Disney World
 * 4. vacationType cruise → Cruise
 * 5. vacationType beach → Beach
 * 6. vacationType international → International
 * 7. vacationType theme-park → Theme Park generic
 * 8. Fallback → Generic Quote Nurture
 */
export function resolveSequenceNameForQuote(quote: QuoteRoutingInput): string {
  const dest = (quote.destination || "").toLowerCase();
  const type = (quote.vacationType || "").toLowerCase();

  if (dest.includes("universal") || type === "universal") {
    return QUOTE_SEQUENCE_NAMES.UNIVERSAL;
  }

  if (dest.includes("disneyland") || dest.includes("anaheim")) {
    return QUOTE_SEQUENCE_NAMES.DISNEYLAND;
  }

  if (
    dest.includes("walt disney") ||
    dest.includes("disney world") ||
    (dest.includes("disney") && dest.includes("orlando"))
  ) {
    return QUOTE_SEQUENCE_NAMES.DISNEY_WORLD;
  }

  if (type === "cruise" || dest.includes("cruise line")) {
    return QUOTE_SEQUENCE_NAMES.CRUISE;
  }

  if (type === "beach") {
    return QUOTE_SEQUENCE_NAMES.BEACH;
  }

  if (type === "international") {
    return QUOTE_SEQUENCE_NAMES.INTERNATIONAL;
  }

  if (type === "theme-park") {
    return QUOTE_SEQUENCE_NAMES.THEME_PARK;
  }

  return QUOTE_SEQUENCE_NAMES.GENERIC;
}