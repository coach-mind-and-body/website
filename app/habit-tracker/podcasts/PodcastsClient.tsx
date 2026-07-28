"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Headphones, Play, Youtube, ExternalLink, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";

const YOUTUBE_CHANNEL = "https://www.youtube.com/@MindandBodyResetCoach";
const YOUTUBE_PLAYLIST =
  "https://www.youtube.com/playlist?list=PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H";

interface Episode {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  videoId: string;
  slug?: string | null;
  hasShowNotes?: boolean;
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PodcastsClient() {
  usePageTitle({
    title: "Podcast | Mind & Body Reset Coaches",
    description:
      "Listen to Lee Anne's Mind and Body Reset podcast right from your habit tracker.",
  });

  const playerRef = useRef<HTMLDivElement>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const { data: podcastData, isLoading: loading } = trpc.podcast.getEpisodes.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );
  const episodes: Episode[] = (podcastData?.episodes ?? []) as Episode[];

  useEffect(() => {
    if (episodes.length > 0 && !activeVideo) {
      setActiveVideo(episodes[0].id);
    }
  }, [episodes, activeVideo]);

  const activeEpisode = episodes.find((e) => e.id === activeVideo) ?? episodes[0];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3"
          style={{ background: "#f0e8e4", color: "#2d3b2d" }}
        >
          <Headphones size={13} />
          Mind &amp; Body Podcast
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
        >
          Listen with Lee Anne
        </h1>
        <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto">
          Real strategy for midlife health, hormones, food freedom, and consistency —
          new episodes every other week.
        </p>
      </motion.div>

      {/* Player */}
      <div
        ref={playerRef}
        className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6"
        style={{ border: "1px solid #f0e8e4" }}
      >
        {loading ? (
          <div className="aspect-video w-full flex items-center justify-center bg-[#faf5f5]">
            <Loader2 className="animate-spin text-[#c9a96e]" size={32} />
          </div>
        ) : activeVideo ? (
          <>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}?rel=0&modestbranding=1`}
                title={activeEpisode?.title ?? "Podcast episode"}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {activeEpisode && (
              <div className="p-4 md:p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#c9a96e] mb-1">
                  Now playing
                </p>
                <h2 className="font-bold text-lg leading-snug" style={{ color: "#2d3b2d" }}>
                  {activeEpisode.title}
                </h2>
                {activeEpisode.publishedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(activeEpisode.publishedAt)}
                  </p>
                )}
                {activeEpisode.slug && activeEpisode.hasShowNotes && (
                  <Link
                    href={`/midlife-health-podcast/${activeEpisode.slug}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#2d3b2d] hover:text-[#c9a96e] transition-colors"
                  >
                    Read show notes <ExternalLink size={14} />
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="aspect-video w-full flex flex-col items-center justify-center bg-[#faf5f5] p-6 text-center">
            <Youtube size={40} className="mb-3 opacity-40" style={{ color: "#2d3b2d" }} />
            <p className="text-sm text-gray-500 mb-3">
              Episodes are loading. You can also watch on YouTube.
            </p>
            <a
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold underline"
              style={{ color: "#c9a96e" }}
            >
              Open YouTube channel
            </a>
          </div>
        )}
      </div>

      {/* Episode list */}
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="font-bold text-xl"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
        >
          All episodes
        </h3>
        <a
          href={YOUTUBE_PLAYLIST}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold flex items-center gap-1 hover:opacity-70"
          style={{ color: "#8a9a8a" }}
        >
          Full playlist <ExternalLink size={12} />
        </a>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl animate-pulse"
              style={{ background: "#f0e8e4" }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep) => {
            const isActive = activeVideo === ep.id;
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => {
                  setActiveVideo(ep.id);
                  playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="w-full text-left flex gap-3 p-3 rounded-2xl transition-all bg-white hover:shadow-md"
                style={{
                  border: `2px solid ${isActive ? "#c9a96e" : "#f0e8e4"}`,
                  boxShadow: isActive ? "0 4px 16px rgba(201, 169, 110, 0.2)" : undefined,
                }}
              >
                <div className="relative w-24 h-16 shrink-0 rounded-xl overflow-hidden bg-[#f0e8e4]">
                  <img
                    src={ep.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: isActive ? "#c9a96e" : "rgba(255,255,255,0.9)" }}
                    >
                      <Play
                        size={14}
                        fill={isActive ? "white" : "#2d3b2d"}
                        style={{ color: isActive ? "white" : "#2d3b2d", marginLeft: 1 }}
                      />
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  {isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#c9a96e]">
                      Playing
                    </span>
                  )}
                  <p
                    className="font-bold text-sm leading-snug line-clamp-2"
                    style={{ color: "#2d3b2d" }}
                  >
                    {ep.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(ep.publishedAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8 mb-2">
        Prefer the full site experience?{" "}
        <Link href="/midlife-health-podcast" className="underline font-medium text-[#8a9a8a]">
          Open podcast page
        </Link>
      </p>
    </div>
  );
}
