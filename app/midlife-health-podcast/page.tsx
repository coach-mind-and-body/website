import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import PodcastClient from "./PodcastClient";
import { getDb } from "@/server/db";
import { podcastEpisodes } from "@/drizzle/schema";

// Published rows change between deploys. The full link list has to be fresh.
export const dynamic = "force-dynamic";

export type InitialEpisode = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  videoId: string;
  slug: string;
  hasShowNotes: true;
};

async function getPublishedEpisodes(): Promise<InitialEpisode[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        videoId: podcastEpisodes.videoId,
        slug: podcastEpisodes.slug,
        title: podcastEpisodes.title,
        thumbnail: podcastEpisodes.thumbnail,
        publishedAt: podcastEpisodes.publishedAt,
        youtubeDescription: podcastEpisodes.youtubeDescription,
      })
      .from(podcastEpisodes)
      .where(eq(podcastEpisodes.status, "published"))
      .orderBy(desc(podcastEpisodes.publishedAt), desc(podcastEpisodes.id));

    return rows
      .filter(row => row.slug.trim())
      .map(row => ({
        id: row.videoId,
        videoId: row.videoId,
        slug: row.slug,
        title: row.title,
        description: (row.youtubeDescription || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 280),
        thumbnail:
          row.thumbnail ||
          `https://i.ytimg.com/vi/${row.videoId}/hqdefault.jpg`,
        publishedAt: row.publishedAt
          ? new Date(row.publishedAt).toISOString()
          : "",
        hasShowNotes: true as const,
      }));
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  // Segment title only. Root layout template appends " | Mind and Body Reset".
  title: "Midlife Health Podcast for Women Over 40",
  description:
    "Listen to the Mind and Body Reset podcast — real strategy for midlife health, hormones, insulin resistance, weight loss mindset, and food freedom for women 40+.",
  keywords: [
    "midlife health podcast",
    "perimenopause podcast",
    "women over 40 health podcast",
    "insulin resistance podcast",
  ],
  alternates: { canonical: "/midlife-health-podcast" },
  openGraph: {
    title: "Midlife Health Podcast | Mind and Body Reset",
    description:
      "Real strategy for midlife health, hormones, weight loss mindset, and food freedom — with Lee Anne Chapman.",
    url: "/midlife-health-podcast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Midlife Health Podcast | Mind and Body Reset",
    description:
      "Hormones, GLP-1s, food noise, and midlife health — episodes for women 40+.",
  },
};

export default async function Page() {
  const initialEpisodes = await getPublishedEpisodes();
  return <PodcastClient initialEpisodes={initialEpisodes} />;
}
