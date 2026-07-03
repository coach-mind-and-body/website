"use client";

import { useEffect, useRef, useState } from "react";
import { PlayCircle } from "lucide-react";

interface Interval {
  startTime: number;
  endTime: number;
  title: string;
  description: string;
}

interface Props {
  videoUrl: string;
  intervalsJson?: string | null;
}

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio beep failed", e);
  }
};

export default function InteractiveVideoPlayer({ videoUrl, intervalsJson }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeInterval, setActiveInterval] = useState<Interval | null>(null);
  const [nextInterval, setNextInterval] = useState<Interval | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const prevIntervalRef = useRef<Interval | null>(null);

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  };

  const ytId = extractYouTubeId(videoUrl);

  // Parse intervals once
  useEffect(() => {
    if (intervalsJson) {
      try {
        const parsed = JSON.parse(intervalsJson) as Interval[];
        setIntervals(parsed.sort((a, b) => a.startTime - b.startTime));
      } catch (e) {
        setIntervals([]);
      }
    } else {
      setIntervals([]);
    }
  }, [intervalsJson]);

  // Load YouTube API
  useEffect(() => {
    if (!ytId) return;

    // Create a unique ID for the player div
    const playerId = `yt-player-${Math.random().toString(36).substr(2, 9)}`;
    if (containerRef.current) {
      containerRef.current.id = playerId;
    }

    const initPlayer = () => {
      playerRef.current = new (window as any).YT.Player(playerId, {
        videoId: ytId,
        playerVars: {
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            // Player is ready
          },
        },
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else if (!(window as any).YT.Player) {
      // Script is loaded but not ready?
      const old = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (old) old();
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [ytId]);

  // Polling loop for current time
  useEffect(() => {
    if (intervals.length === 0) return;

    let intervalId: any;
    const pollTime = () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        
        // Find current interval
        const current = intervals.find(inv => time >= inv.startTime && time < inv.endTime);
        
        if (current) {
          // If interval just changed to a new one, beep!
          if (prevIntervalRef.current?.title !== current.title) {
            playBeep();
            prevIntervalRef.current = current;
          }
          
          setActiveInterval(current);
          setTimeRemaining(Math.ceil(current.endTime - time));
          
          // Find next interval
          const currentIndex = intervals.findIndex(inv => inv === current);
          if (currentIndex !== -1 && currentIndex < intervals.length - 1) {
            setNextInterval(intervals[currentIndex + 1]);
          } else {
            setNextInterval(null);
          }
        } else {
          setActiveInterval(null);
          setNextInterval(null);
          setTimeRemaining(0);
        }
      }
    };

    intervalId = setInterval(pollTime, 200); // 5 times a second for smooth UI
    return () => clearInterval(intervalId);
  }, [intervals]);

  if (!ytId) {
    return (
      <div className="relative w-full aspect-video bg-gray-100 flex items-center justify-center text-sm text-gray-500 rounded-t-3xl">
        Non-YouTube Video (Link: <a href={videoUrl} target="_blank" rel="noreferrer" className="underline ml-1">Open</a>)
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .ivp-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          border-radius: 1.5rem;
          overflow: hidden;
          border: 1px solid #f3f4f6;
          background: white;
        }
        .ivp-video {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: black;
          flex-shrink: 0;
        }
        .ivp-timer {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 1.25rem;
          min-height: 140px;
        }
        @media (orientation: landscape) and (max-height: 600px) {
          /* Kill all page scrolling and backgrounds */
          body {
            overflow: hidden !important;
            background: black !important;
          }
          .ivp-wrapper {
            flex-direction: row;
            border-radius: 0;
            border: none;
            height: 100vh;
            width: 100vw;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            margin: 0;
            background: black;
          }
          .ivp-video {
            width: 80%;
            aspect-ratio: unset;
            height: 100%;
            background: black;
          }
          .ivp-video iframe {
            width: 100% !important;
            height: 100% !important;
          }
          .ivp-timer {
            width: 20%;
            padding: 0.75rem;
            min-height: unset;
          }
          .ivp-timer h4 {
            font-size: 0.6rem !important;
            margin-bottom: 0.25rem !important;
          }
          .ivp-timer h2 {
            font-size: 1.25rem !important;
            margin-bottom: 0.25rem !important;
          }
          .ivp-timer .ivp-countdown {
            font-size: 2.5rem !important;
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }
          .ivp-timer .ivp-next {
            font-size: 0.65rem !important;
            padding: 0.25rem 0.5rem !important;
            margin-top: 0.5rem !important;
          }
        }
      `}</style>
      <div className="ivp-wrapper">
        {/* Video Container */}
        <div className="ivp-video">
          <div ref={containerRef} className="absolute top-0 left-0 w-full h-full"></div>
        </div>
        
        {/* Interactive Timer UI */}
        {intervals.length > 0 && (
          <div className="ivp-timer" style={{ background: activeInterval ? "#2d3b2d" : "#fcfaf9" }}>
            {activeInterval ? (
              <>
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#c9a96e] mb-1">Current Exercise</h4>
                <h2 className="text-3xl font-bold text-white mb-2">{activeInterval.title}</h2>
                
                <div className="ivp-countdown text-5xl font-bold text-white tracking-tighter my-2 drop-shadow-md">
                  00:{timeRemaining.toString().padStart(2, '0')}
                </div>
                
                {nextInterval && (
                  <div className="ivp-next mt-4 px-4 py-2 rounded-full bg-white/10 text-sm font-bold text-white">
                    Next: {nextInterval.title}
                  </div>
                )}
              </>
            ) : (
              <div className="py-6">
                <PlayCircle size={40} className="mx-auto mb-2 text-gray-300" />
                <p className="font-bold text-gray-500 text-sm uppercase tracking-wider">Ready to begin</p>
                <p className="text-xs text-gray-400 mt-1">Play the video to start the timer.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
