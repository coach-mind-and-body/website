/** Same-origin address for a private food-log photo. Cookies or no URL at all. */
export function privateFoodLogPhotoSrc(imageUrl?: string | null): string | null {
  if (!imageUrl || !/^food-logs\/\d+\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(imageUrl)) return null;
  return `/api/food-log-photo?key=${encodeURIComponent(imageUrl)}`;
}

/**
 * What the coach should open for a meal photo.
 * Handwritten-page scans stay on the private route. Older public links still open.
 */
export function coachFoodLogPhotoSrc(imageUrl?: string | null): string | null {
  const privateSrc = privateFoodLogPhotoSrc(imageUrl);
  if (privateSrc) return privateSrc;
  if (!imageUrl || imageUrl.startsWith("food-logs/")) return null;
  if (imageUrl.startsWith("/") || imageUrl.startsWith("https://") || imageUrl.startsWith("http://")) {
    return imageUrl;
  }
  return null;
}
