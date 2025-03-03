"use client";

import React, { useEffect, useRef } from "react";
import YouTube, {
  YouTubeEvent,
  YouTubePlayer as YTPlayer,
} from "react-youtube";

interface YouTubePlayerProps {
  videoId: string;
  onEnd?: () => void;
}

export function YouTubePlayer({ videoId, onEnd }: YouTubePlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    // クリーンアップ関数
    return () => {
      if (playerRef.current?.getIframe()) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.warn("YouTube player cleanup warning:", error);
        }
      }
    };
  }, []);

  const opts = {
    height: "500",
    width: "100%",
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
    },
  } as const;

  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const handleError = (error: YouTubeEvent) => {
    console.warn("YouTube player error:", error);
    // エラーが発生した場合でも動画の再生を試みる
    if (playerRef.current?.getIframe()) {
      try {
        playerRef.current.playVideo();
      } catch (e) {
        console.error("Failed to recover from error:", e);
      }
    }
  };

  return (
    <div className="relative pt-[56.25%]">
      <div className="absolute top-0 left-0 w-full h-full">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={handleReady}
          onEnd={onEnd}
          onError={handleError}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
