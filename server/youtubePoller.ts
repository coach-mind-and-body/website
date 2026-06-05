import { getDb } from "./db";
import { podcastSubscribers, broadcastedEpisodes } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { ENV } from "./_core/env";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // Check every 6 hours
const PLAYLIST_ID = "PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H";

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
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const videoId = videoIdMatch ? videoIdMatch[1].trim() : "";
    if (!videoId) continue;

    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled Episode";

    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const publishedAt = publishedMatch ? publishedMatch[1].trim() : "";

    const descMatch = entry.match(/<media:description>([^<]*)<\/media:description>/);
    const description = descMatch ? descMatch[1].trim() : "";

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

export function startYoutubePoller() {
  console.log("[YouTube Poller] Starting background service to check for new podcast episodes...");
  
  // Run immediately, then on interval
  checkAndBroadcastEpisodes().catch(err => console.error("[YouTube Poller] Error on initial run:", err));
  setInterval(() => {
    checkAndBroadcastEpisodes().catch(err => console.error("[YouTube Poller] Error on interval run:", err));
  }, CHECK_INTERVAL_MS);
}

async function checkAndBroadcastEpisodes() {
  const db = await getDb();
  if (!db) return;

  if (!ENV.resendApiKey) {
    console.warn("[YouTube Poller] Skipping: Resend API Key is not configured.");
    return;
  }

  const resend = new Resend(ENV.resendApiKey);

  // 1. Fetch latest videos from RSS
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;
  const response = await fetch(feedUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MindBodyReset/1.0)" },
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  const episodes = parseYouTubeRSS(xml);
  
  if (episodes.length === 0) return;

  // Since RSS orders from newest to oldest, we only care about the most recent a few episodes.
  // Actually, we should check all returned episodes to make sure we didn't miss any during downtime.
  
  for (const episode of episodes.reverse()) {
    // Reverse so we process oldest un-broadcasted first if there are multiple

    // Check if already broadcasted
    const existing = await db
      .select()
      .from(broadcastedEpisodes)
      .where(eq(broadcastedEpisodes.videoId, episode.videoId))
      .limit(1);

    if (existing.length > 0) {
      continue; // Already broadcasted this episode
    }

    // Found a new episode! 
    console.log(`[YouTube Poller] Found new unbroadcasted episode: ${episode.title}`);

    // Fetch all podcast subscribers
    const subscribers = await db.select().from(podcastSubscribers);
    
    if (subscribers.length > 0) {
      console.log(`[YouTube Poller] Broadcasting to ${subscribers.length} podcast subscribers...`);
      
      const batchPayload = subscribers.map(sub => ({
        from: ENV.resendFromEmail || "coach@mindandbodyresetcoach.com",
        to: sub.email,
        subject: `New Podcast Episode! 🎧 ${episode.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #4a4a4a;">
            <p>Hi ${sub.firstName || "there"},</p>
            <p>A brand new episode of the Reclaim Your Body Podcast is out now!</p>
            
            <h2 style="color: #2d3b2d; margin-top: 30px;">${episode.title}</h2>
            <a href="https://www.youtube.com/watch?v=${episode.videoId}" style="display: block; margin-bottom: 20px;">
              <img src="${episode.thumbnail}" alt="${episode.title}" style="max-width: 100%; border-radius: 8px;" />
            </a>
            
            <p>${episode.description.substring(0, 300)}...</p>
            
            <div style="margin-top: 30px; margin-bottom: 40px;">
              <a href="https://www.youtube.com/watch?v=${episode.videoId}" style="background-color: #2d3b2d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Watch / Listen to Episode
              </a>
            </div>
            
            <p>Talk soon,</p>
            <p><strong>Lee Anne Chapman</strong></p>
          </div>
        `,
      }));

      // Resend allows sending up to 100 emails per batch request
      // We chunk them into groups of 100
      for (let i = 0; i < batchPayload.length; i += 100) {
        const chunk = batchPayload.slice(i, i + 100);
        try {
          const { error } = await resend.batch.send(chunk);
          if (error) {
            console.error(`[YouTube Poller] Resend batch error:`, error);
          } else {
            console.log(`[YouTube Poller] Successfully sent batch of ${chunk.length}`);
          }
        } catch (e) {
          console.error(`[YouTube Poller] Batch send threw an error:`, e);
        }
      }
    } else {
      console.log(`[YouTube Poller] No podcast subscribers found to broadcast to.`);
    }

    // Mark as broadcasted so we never send it again
    await db.insert(broadcastedEpisodes).values({
      videoId: episode.videoId,
      title: episode.title,
    });
    console.log(`[YouTube Poller] Marked ${episode.videoId} as broadcasted.`);
  }
}
