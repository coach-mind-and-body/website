import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { podcastEpisodes } from "@/drizzle/schema";
import { absoluteUrl, SITE_URL } from "@shared/brand";
import EpisodeClient from "./EpisodeClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getDb();
  if (!db) return { title: "Podcast Episode" };

  const [ep] = await db
    .select()
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.slug, slug))
    .limit(1);

  if (!ep || ep.status !== "published") {
    return { title: "Episode Not Found", robots: { index: false, follow: false } };
  }

  const title = ep.seoTitle || ep.title;
  const description =
    ep.seoDescription ||
    `Show notes for ${ep.title} — Mind and Body Reset midlife health podcast.`;

  return {
    title: { absolute: title.includes("Mind and Body") ? title : `${title} | Mind and Body Reset` },
    description,
    alternates: { canonical: `/midlife-health-podcast/${ep.slug}` },
    openGraph: {
      title,
      description,
      url: `/midlife-health-podcast/${ep.slug}`,
      type: "article",
      images: ep.thumbnail ? [{ url: ep.thumbnail }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ep.thumbnail ? [ep.thumbnail] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const db = await getDb();
  if (!db) notFound();

  const [ep] = await db
    .select()
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.slug, slug))
    .limit(1);

  if (!ep || ep.status !== "published") notFound();

  const pageUrl = absoluteUrl(`/midlife-health-podcast/${ep.slug}`);
  const videoUrl = `https://www.youtube.com/watch?v=${ep.videoId}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "PodcastEpisode",
      name: ep.title,
      description: ep.seoDescription || ep.youtubeDescription || "",
      url: pageUrl,
      datePublished: ep.publishedAt
        ? new Date(ep.publishedAt).toISOString()
        : undefined,
      image: ep.thumbnail || undefined,
      associatedMedia: {
        "@type": "VideoObject",
        name: ep.title,
        contentUrl: videoUrl,
        embedUrl: `https://www.youtube.com/embed/${ep.videoId}`,
        thumbnailUrl: ep.thumbnail || undefined,
        uploadDate: ep.publishedAt
          ? new Date(ep.publishedAt).toISOString()
          : undefined,
      },
      partOfSeries: {
        "@type": "PodcastSeries",
        name: "Mind and Body Reset Podcast",
        url: absoluteUrl("/midlife-health-podcast"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Podcast",
          item: absoluteUrl("/midlife-health-podcast"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: ep.title,
          item: pageUrl,
        },
      ],
    },
  ];

  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <EpisodeClient
        title={ep.title}
        videoId={ep.videoId}
        thumbnail={ep.thumbnail}
        publishedAt={ep.publishedAt ? new Date(ep.publishedAt).toISOString() : null}
        showNotesHtml={ep.showNotesHtml}
        transcript={ep.transcript}
      />
    </>
  );
}
