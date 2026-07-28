/**
 * Default habit actions attached to every podcast episode unless admin overrides.
 */
import { eq } from "drizzle-orm";
import { podcastEpisodes } from "../drizzle/schema";

export type HabitAction = {
  title: string;
  type?: "boolean" | "numeric";
  targetValue?: number | null;
  unit?: string | null;
  description?: string | null;
};

/** Applied automatically to new episodes; admin can edit per episode. */
export const DEFAULT_HABIT_ACTIONS: HabitAction[] = [
  {
    title: "Write 3 wins today",
    type: "boolean",
    description: "Victory list — what went right",
  },
  {
    title: "Ask: who is driving?",
    type: "boolean",
    description: "Future you vs craving you",
  },
  {
    title: "One intentional walk or pause",
    type: "boolean",
    description: "Choose the right discomfort",
  },
];

export function defaultHabitActionsJson(): string {
  return JSON.stringify(DEFAULT_HABIT_ACTIONS);
}

export function slugifyEpisodeTitle(title: string, videoId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || `episode-${videoId.slice(0, 8)}`;
}

export type EnsureEpisodeInput = {
  videoId: string;
  title: string;
  thumbnail?: string | null;
  publishedAt?: string | Date | null;
  youtubeDescription?: string | null;
};

/**
 * Ensure a podcast_episodes row exists with default habit actions.
 * Never overwrites non-empty habitActionsJson (preserves admin edits).
 */
export async function ensureEpisodeDefaults(
  db: any,
  input: EnsureEpisodeInput
): Promise<{ id: number; created: boolean; filledDefaults: boolean }> {
  const [existing] = await db
    .select()
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.videoId, input.videoId))
    .limit(1);

  const defaults = defaultHabitActionsJson();
  const publishedAt = input.publishedAt
    ? input.publishedAt instanceof Date
      ? input.publishedAt
      : new Date(input.publishedAt)
    : null;

  if (!existing) {
    // Unique slug: try title, fall back to videoId suffix if collision
    let slug = slugifyEpisodeTitle(input.title, input.videoId);
    const [slugHit] = await db
      .select({ id: podcastEpisodes.id })
      .from(podcastEpisodes)
      .where(eq(podcastEpisodes.slug, slug))
      .limit(1);
    if (slugHit) slug = `${slug}-${input.videoId.slice(0, 6)}`;

    const [result] = await db.insert(podcastEpisodes).values({
      videoId: input.videoId,
      slug,
      title: input.title,
      thumbnail: input.thumbnail || `https://i.ytimg.com/vi/${input.videoId}/hqdefault.jpg`,
      publishedAt,
      youtubeDescription: input.youtubeDescription || null,
      habitActionsJson: defaults,
      // draft until show notes are written — still used for habit actions in app
      status: "draft",
    });
    return {
      id: Number((result as { insertId?: number })?.insertId ?? 0),
      created: true,
      filledDefaults: true,
    };
  }

  // Fill empty actions only — never clobber admin edits
  const empty =
    !existing.habitActionsJson ||
    existing.habitActionsJson.trim() === "" ||
    existing.habitActionsJson.trim() === "[]" ||
    existing.habitActionsJson.trim() === "null";

  if (empty) {
    await db
      .update(podcastEpisodes)
      .set({ habitActionsJson: defaults })
      .where(eq(podcastEpisodes.id, existing.id));
    return { id: existing.id, created: false, filledDefaults: true };
  }

  return { id: existing.id, created: false, filledDefaults: false };
}
