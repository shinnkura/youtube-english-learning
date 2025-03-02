"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { YouTubePlayer } from "./youtube-player";
import { getChannelIdFromUrl } from "../lib/utils";

export function Home() {
  const [channelUrl, setChannelUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUrlSubmitted, setIsUrlSubmitted] = useState(false);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const channelId = getChannelIdFromUrl(channelUrl);
    if (!channelId) {
      setError("有効なYouTubeチャンネルURLを入力してください");
      return;
    }

    setIsUrlSubmitted(true);
  };

  const handlePlayVideo = async () => {
    setError(null);
    const channelId = getChannelIdFromUrl(channelUrl);

    try {
      const response = await fetch(`/api/videos?channelId=${channelId}`);
      if (!response.ok) throw new Error("動画の取得に失敗しました");

      const data = await response.json();
      if (!data.videoId) {
        setError("このチャンネルには動画がありません");
        return;
      }

      setVideoId(data.videoId);
    } catch (err) {
      console.error(err);
      setError("エラーが発生しました。もう一度お試しください。");
    }
  };

  const handleVideoEnd = () => {
    handlePlayVideo();
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        ランダムYouTube動画プレーヤー
      </h1>

      <form onSubmit={handleUrlSubmit} className="max-w-xl mx-auto mb-8">
        <div className="flex gap-4">
          <Input
            type="url"
            placeholder="YouTubeチャンネルのURLを入力"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            className="flex-1"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            URL確認
          </button>
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </form>

      {isUrlSubmitted && !error && (
        <div className="text-center mb-8">
          <button
            onClick={handlePlayVideo}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-lg font-semibold"
          >
            ランダム動画を再生
          </button>
        </div>
      )}

      {videoId && (
        <div className="max-w-3xl mx-auto">
          <YouTubePlayer videoId={videoId} onEnd={handleVideoEnd} />
        </div>
      )}
    </main>
  );
}
