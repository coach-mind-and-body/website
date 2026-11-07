/** Public podcast dates are the America/Denver calendar day. Schema keeps the UTC instant. */
export const EPISODE_PUBLICATION_TIME_ZONE = "America/Denver";

export function formatEpisodePublicationDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: EPISODE_PUBLICATION_TIME_ZONE,
  });
}
