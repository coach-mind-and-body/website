import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { resendSubscribe } from "../resendSubscribe";

const PLAYLIST_ID = "PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H";
const CHANNEL_ID = "UCMindandBodyResetCoach"; // fallback

interface Episode {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  videoId: string;
}

function parseYouTubeRSS(xml: string): Episode[] {
  const episodes: Episode[] = [];

  // Extract all <entry> blocks
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    // Extract video ID from <yt:videoId>
    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const videoId = videoIdMatch ? videoIdMatch[1].trim() : "";
    if (!videoId) continue;

    // Extract title
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled Episode";

    // Extract published date
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const publishedAt = publishedMatch ? publishedMatch[1].trim() : "";

    // Extract description from media:description
    const descMatch = entry.match(/<media:description>([^<]*)<\/media:description>/);
    const description = descMatch ? descMatch[1].trim() : "";

    // Build thumbnail URL from video ID
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    episodes.push({
      id: videoId,
      videoId,
      title,
      description,
      publishedAt,
      thumbnail,
    });
  }

  return episodes;
}

export const podcastRouter = router({
  // Public: subscribe to podcast email list (tagged 'podcast')
  subscribe: publicProcedure
    .input(z.object({
      email: z.string().email("Please enter a valid email address"),
      firstName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await resendSubscribe({
        email: input.email,
        firstName: input.firstName,
      });

      if (!result.success) {
        console.error("[Podcast Subscribe] Resend error:", result.error);
      }
      // Always return success to avoid email enumeration
      return { success: true };
    }),

  getEpisodes: publicProcedure.query(async () => {
    try {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;
      const response = await fetch(feedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MindBodyReset/1.0)",
        },
      });

      if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status}`);
      }

      const xml = await response.text();
      const episodes = parseYouTubeRSS(xml);
      return { episodes };
    } catch (err) {
      console.error("[Podcast RSS] Failed to fetch episodes:", err);
      return { episodes: [] };
    }
  }),
});
