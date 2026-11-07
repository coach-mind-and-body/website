export type EpisodeShareImage = {
  url: string;
  width?: number;
  height?: number;
};

/**
 * Open Graph and schema image for a show-notes page.
 * Permission to Be a Beginner has a 1280×720 maxres frame on i.ytimg.com.
 * Other episodes keep the thumbnail already stored for them.
 */
const PERMISSION_TO_BE_A_BEGINNER_VIDEO_ID = "mL6fCK4SvwE";

export function episodeShareImage(
  videoId: string,
  thumbnail: string | null | undefined
): EpisodeShareImage | undefined {
  if (videoId === PERMISSION_TO_BE_A_BEGINNER_VIDEO_ID) {
    return {
      url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      width: 1280,
      height: 720,
    };
  }
  if (!thumbnail) return undefined;
  return { url: thumbnail };
}
