/**
 * Read-time SEO for one published episode.
 * The root layout title template appends " | Mind and Body Reset",
 * so the title segment must not include the brand.
 * Stored seoTitle / seoDescription stay in the database for other tools.
 */
export const PERMISSION_TO_BE_A_BEGINNER_SLUG = "permission-to-be-a-beginner";

export const PERMISSION_TO_BE_A_BEGINNER_SEO = {
  title: "Podcast: Permission to Be a Beginner – Building New Habits After 40",
  description:
    "A new habit is a skill. This episode gives permission to be a beginner after 40: expect the wobble, cheer the reps, and practice something small every day.",
} as const;

export function editorialEpisodeTitle(slug: string): string | null {
  if (slug !== PERMISSION_TO_BE_A_BEGINNER_SLUG) return null;
  return PERMISSION_TO_BE_A_BEGINNER_SEO.title;
}

export function editorialEpisodeDescription(slug: string): string | null {
  if (slug !== PERMISSION_TO_BE_A_BEGINNER_SLUG) return null;
  return PERMISSION_TO_BE_A_BEGINNER_SEO.description;
}
