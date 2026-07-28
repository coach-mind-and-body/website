"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type NowPlaying = {
  videoId: string;
  title: string;
  thumbnail?: string | null;
};

type HabitPodcastPlayerContextValue = {
  nowPlaying: NowPlaying | null;
  play: (episode: NowPlaying) => void;
  stop: () => void;
  isMiniVisible: boolean;
  setIsMiniVisible: (v: boolean) => void;
};

const HabitPodcastPlayerContext =
  createContext<HabitPodcastPlayerContextValue | null>(null);

export function HabitPodcastPlayerProvider({ children }: { children: ReactNode }) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isMiniVisible, setIsMiniVisible] = useState(true);

  const play = useCallback((episode: NowPlaying) => {
    setNowPlaying(episode);
    setIsMiniVisible(true);
  }, []);

  const stop = useCallback(() => {
    setNowPlaying(null);
  }, []);

  const value = useMemo(
    () => ({ nowPlaying, play, stop, isMiniVisible, setIsMiniVisible }),
    [nowPlaying, play, stop, isMiniVisible]
  );

  return (
    <HabitPodcastPlayerContext.Provider value={value}>
      {children}
    </HabitPodcastPlayerContext.Provider>
  );
}

export function useHabitPodcastPlayer() {
  const ctx = useContext(HabitPodcastPlayerContext);
  if (!ctx) {
    throw new Error("useHabitPodcastPlayer must be used within HabitPodcastPlayerProvider");
  }
  return ctx;
}
