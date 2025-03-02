"use client";

import { useEffect, useRef, useState } from "react";
import YouTubePlayerFactory from "youtube-player";
import type { YouTubePlayer } from "youtube-player/dist/types";

interface YouTubePlayerProps {
  videoId: string;
  onEnd?: () => void;
}

export function YouTubePlayer({ videoId, onEnd }: YouTubePlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    playerRef.current = YouTubePlayerFactory(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
      },
    });

    playerRef.current.on("ready", () => {
      setIsReady(true);
    });

    if (onEnd) {
      playerRef.current.on("stateChange", (event) => {
        if (event.data === 0) {
          // 動画終了
          onEnd();
        }
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, onEnd]);

  useEffect(() => {
    if (isReady && playerRef.current) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId, isReady]);

  return (
    <div className="aspect-video w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
