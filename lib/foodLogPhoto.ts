/** Same-origin address for a private food-log photo. Cookies or no URL at all. */
export function privateFoodLogPhotoSrc(imageUrl?: string | null): string | null {
  if (!imageUrl || !/^food-logs\/\d+\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(imageUrl)) return null;
  return `/api/food-log-photo?key=${encodeURIComponent(imageUrl)}`;
}
