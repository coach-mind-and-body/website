"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Headphones, X } from "lucide-react";
import { useHabitPodcastPlayer } from "@/contexts/HabitPodcastPlayerContext";

/**
 * Always fixed above the bottom glass nav — including on the Podcasts tab —
 * so scrolling never moves the player. One iframe keeps playback continuous
 * when switching between episodes or habit-tracker routes.
 */
export default function HabitPodcastMiniPlayer() {
  const pathname = usePathname();
  const { nowPlaying, stop } = useHabitPodcastPlayer();

  if (!nowPlaying) return null;

  const onPodcastsPage = pathname?.startsWith("/habit-tracker/podcasts") ?? false;
  const youtubeUrl = `https://www.youtube.com/watch?v=${nowPlaying.videoId}`;

  return (
    <div
      className="fixed left-0 right-0 z-[55] flex justify-center pointer-events-none"
      style={{
        // Sit just above the glass bottom nav + safe area — never scrolls with content
        bottom: "max(5.25rem, calc(4.5rem + env(safe-area-inset-bottom, 0px)))",
        paddingLeft: "0.75rem",
        paddingRight: "0.75rem",
        // iOS: keep compositor layer stable while page scrolls
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
      }}
    >
      <div
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/50 shadow-[0_8px_28px_rgba(45,59,45,0.14)] overflow-hidden"
        style={{
          background: "rgba(250, 240, 238, 0.88)",
          backdropFilter: "blur(18px) saturate(1.3)",
          WebkitBackdropFilter: "blur(18px) saturate(1.3)",
        }}
      >
        <div className="relative w-full bg-black" style={{ height: onPodcastsPage ? 120 : 96 }}>
          <iframe
            key={nowPlaying.videoId}
            src={`https://www.youtube.com/embed/${nowPlaying.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={nowPlaying.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <Headphones size={16} className="shrink-0 text-[#2d3b2d]" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9a8a]">
              Now playing
            </p>
            <p className="text-xs font-bold truncate" style={{ color: "#2d3b2d" }}>
              {nowPlaying.title}
            </p>
          </div>
          {!onPodcastsPage && (
            <Link
              href="/habit-tracker/podcasts"
              className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
              style={{ background: "rgba(45,59,45,0.08)", color: "#2d3b2d" }}
            >
              Episodes
            </Link>
          )}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in YouTube for background listening"
            className="p-1.5 rounded-full shrink-0 text-[#8a9a8a] hover:text-[#2d3b2d]"
            title="Best for background / lock screen: open YouTube"
          >
            <ExternalLink size={15} />
          </a>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop podcast"
            className="p-1.5 rounded-full shrink-0 text-[#8a9a8a] hover:text-red-500 hover:bg-white/50"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
