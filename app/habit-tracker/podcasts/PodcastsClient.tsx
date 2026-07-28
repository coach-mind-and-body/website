"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  Play,
  Youtube,
  ExternalLink,
  Loader2,
  Smartphone,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";
import { useHabitPodcastPlayer } from "@/contexts/HabitPodcastPlayerContext";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
  habitActionsJson?: string | null;
  linkedBlogSlug?: string | null;
}

type HabitAction = {
  title: string;
  type?: "boolean" | "numeric";
  targetValue?: number | null;
  unit?: string | null;
  description?: string | null;
};

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
  const { nowPlaying, play } = useHabitPodcastPlayer();
  const { isAuthenticated } = useAuth();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const syncHabit = trpc.habit.syncHabit.useMutation({
    onSuccess: () => toast.success("Added to your habits"),
    onError: (e) => toast.error(e.message),
  });

  const addActionAsHabit = (action: HabitAction) => {
    if (isAuthenticated) {
      syncHabit.mutate({
        title: action.title,
        description: action.description || undefined,
        type: action.type || "boolean",
        targetValue: action.targetValue ?? null,
        unit: action.unit ?? null,
        order: 99,
        isActive: true,
      });
    } else {
      try {
        const raw = localStorage.getItem("mbr_habits");
        const habits = raw ? JSON.parse(raw) : [];
        habits.push({
          id: Date.now(),
          title: action.title,
          description: action.description || null,
          type: action.type || "boolean",
          targetValue: action.targetValue ?? null,
          unit: action.unit ?? null,
          isActive: true,
        });
        localStorage.setItem("mbr_habits", JSON.stringify(habits));
        toast.success("Added to your habits on this device");
      } catch {
        toast.error("Could not save habit");
      }
    }
  };

  const { data: podcastData, isLoading: loading } = trpc.podcast.getEpisodes.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );
  const episodes: Episode[] = (podcastData?.episodes ?? []) as Episode[];

  useEffect(() => {
    if (nowPlaying?.videoId) {
      setActiveVideo(nowPlaying.videoId);
      return;
    }
    if (episodes.length > 0 && !activeVideo) {
      setActiveVideo(episodes[0].videoId || episodes[0].id);
    }
  }, [episodes, activeVideo, nowPlaying]);

  const activeEpisode =
    episodes.find((e) => e.videoId === activeVideo || e.id === activeVideo) ??
    episodes[0];

  let episodeActions: HabitAction[] = [];
  if (activeEpisode?.habitActionsJson) {
    try {
      episodeActions = JSON.parse(activeEpisode.habitActionsJson);
    } catch {
      episodeActions = [];
    }
  }

  const selectEpisode = (ep: Episode) => {
    const videoId = ep.videoId || ep.id;
    setActiveVideo(videoId);
    play({ videoId, title: ep.title, thumbnail: ep.thumbnail });
    // Player stays fixed at bottom — no scroll jump
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-48">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-5"
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3"
          style={{ background: "#f0e8e4", color: "#2d3b2d" }}
        >
          <Headphones size={13} />
          Mind &amp; Body Podcast
        </div>
        <h1
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
        >
          Listen with Lee Anne
        </h1>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Player stays docked at the bottom while you browse — pick an episode to play.
        </p>
      </motion.div>

      {/* Status card — actual iframe lives in fixed mini player at bottom */}
      <div
        ref={playerRef}
        className="bg-white rounded-3xl shadow-sm overflow-hidden mb-4 p-4"
        style={{ border: "1px solid #f0e8e4" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin text-[#c9a96e]" size={28} />
          </div>
        ) : activeEpisode || nowPlaying ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#c9a96e] mb-1">
              {nowPlaying ? "Playing at bottom" : "Ready"}
            </p>
            <h2 className="font-bold text-base leading-snug" style={{ color: "#2d3b2d" }}>
              {nowPlaying?.title || activeEpisode?.title}
            </h2>
            {activeEpisode?.publishedAt && (
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(activeEpisode.publishedAt)}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-3">
              {activeEpisode?.slug && activeEpisode.hasShowNotes && (
                <Link
                  href={`/midlife-health-podcast/${activeEpisode.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2d3b2d] hover:text-[#c9a96e] transition-colors"
                >
                  Read show notes <ExternalLink size={14} />
                </Link>
              )}
              {(activeVideo || nowPlaying?.videoId) && (
                <a
                  href={`https://www.youtube.com/watch?v=${nowPlaying?.videoId || activeVideo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8a9a8a] hover:text-[#2d3b2d] transition-colors"
                >
                  <Youtube size={14} /> Open in YouTube
                </a>
              )}
            </div>
            {!nowPlaying && activeEpisode && (
              <button
                type="button"
                onClick={() =>
                  play({
                    videoId: activeEpisode.videoId || activeEpisode.id,
                    title: activeEpisode.title,
                    thumbnail: activeEpisode.thumbnail,
                  })
                }
                className="mt-3 w-full py-3 rounded-full font-bold text-sm text-white"
                style={{ background: "#2d3b2d" }}
              >
                Play in bottom player
              </button>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <Youtube size={32} className="mx-auto mb-2 opacity-40" style={{ color: "#2d3b2d" }} />
            <p className="text-sm text-gray-500">
              Episodes loading… or{" "}
              <a
                href={YOUTUBE_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
                style={{ color: "#c9a96e" }}
              >
                open YouTube
              </a>
            </p>
          </div>
        )}
      </div>

      {episodeActions.length > 0 && (
        <div
          className="mb-6 p-4 rounded-3xl bg-white border space-y-3"
          style={{ borderColor: "#f0e8e4" }}
        >
          <h3 className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
            This episode&apos;s actions
          </h3>
          {episodeActions.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#2d3b2d" }}>
                  {a.title}
                </p>
                {a.description && (
                  <p className="text-xs text-gray-500">{a.description}</p>
                )}
              </div>
              <Button
                size="sm"
                className="rounded-full shrink-0"
                style={{ background: "#c9a96e", color: "white" }}
                disabled={syncHabit.isPending}
                onClick={() => addActionAsHabit(a)}
              >
                Add habit
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Background listening tip */}
      <div
        className="flex gap-3 p-3.5 rounded-2xl mb-6 text-left"
        style={{ background: "#faf5f5", border: "1px solid #f0e8e4" }}
      >
        <Smartphone size={18} className="shrink-0 mt-0.5 text-[#c9a96e]" />
        <div>
          <p className="text-sm font-bold" style={{ color: "#2d3b2d" }}>
            Keep listening while you track
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Play an episode, then switch to Habits, Macros, or Fitness — the mini player keeps
            going inside the app. For lock screen or true background play, tap{" "}
            <strong>Open in YouTube</strong> (phones handle that best).
          </p>
        </div>
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
            const videoId = ep.videoId || ep.id;
            const isActive = activeVideo === videoId || activeVideo === ep.id;
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => selectEpisode(ep)}
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
                  {ep.slug && ep.hasShowNotes && (
                    <span className="text-[10px] font-semibold text-[#8a9a8a]">Show notes</span>
                  )}
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
