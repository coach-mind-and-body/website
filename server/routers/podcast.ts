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
      // 0. Save natively to Database for native broadcasting!
      try {
        const { getDb } = await import("../db");
        const { podcastSubscribers } = await import("../../drizzle/schema");
        const db = await getDb();
        if (db) {
          await db.insert(podcastSubscribers).values({
            email: input.email,
            firstName: input.firstName,
          }).onDuplicateKeyUpdate({ set: { firstName: input.firstName } });
        }
      } catch (e) {
        console.error("[Podcast Subscribe] Failed to save subscriber natively:", e);
      }

      // 1. Subscribe to Audience
      const result = await resendSubscribe({
        email: input.email,
        firstName: input.firstName,
      });

      if (!result.success) {
        console.error("[Podcast Subscribe] Resend error:", result.error);
      }

      // 2. Fetch latest YouTube videos for Welcome Email
      let episodesHTML = "";
      try {
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;
        const response = await fetch(feedUrl);
        const xml = await response.text();
        const episodes = parseYouTubeRSS(xml).slice(0, 3);
        
        episodesHTML = episodes.map(ep => `
          <div style="margin-bottom: 24px;">
            <a href="https://www.youtube.com/watch?v=${ep.videoId}">
              <img src="${ep.thumbnail}" alt="${ep.title}" style="max-width: 100%; border-radius: 8px;" />
            </a>
            <h3 style="margin-top: 12px; margin-bottom: 4px;"><a href="https://www.youtube.com/watch?v=${ep.videoId}" style="color: #2d3b2d; text-decoration: none; font-size: 18px;">${ep.title}</a></h3>
          </div>
        `).join("");
      } catch (e) {
        console.error("[Podcast Subscribe] Failed to fetch latest YouTube videos:", e);
      }

      // 3. Send Welcome Email
      try {
        const { Resend } = await import("resend");
        const { ENV } = await import("../_core/env");
        if (ENV.resendApiKey) {
          const resend = new Resend(ENV.resendApiKey);
          await resend.emails.send({
            from: ENV.resendFromEmail,
            to: input.email,
            subject: "Welcome to the Reclaim Your Body Podcast! 🎧",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #4a4a4a;">
                <h1 style="color: #2d3b2d;">Welcome to the Podcast!</h1>
                <p>Hi ${input.firstName || "there"},</p>
                <p>Thank you for subscribing to the Reclaim Your Body Podcast! I'm so excited to share these conversations with you.</p>
                <p>Here are some of my most recent episodes to get you started:</p>
                <div style="margin-top: 30px;">
                  ${episodesHTML}
                </div>
                <p>Talk soon,</p>
                <p><strong>Lee Anne Chapman</strong></p>
              </div>
            `,
          });
        }
      } catch (e) {
        console.error("[Podcast Subscribe] Welcome email failed:", e);
      }

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
