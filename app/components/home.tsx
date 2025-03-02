"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { YouTubePlayer } from "./youtube-player";
import { getChannelIdFromUrl } from "../lib/utils";

export function Home() {
  const [channelUrl, setChannelUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const channelId = getChannelIdFromUrl(channelUrl);
    if (!channelId) {
      setError("有効なYouTubeチャンネルURLを入力してください");
      return;
    }

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
      setError("エラーが発生しました。もう一度お試しください。");
    }
  };

  const handleVideoEnd = () => {
    // 動画終了時に新しいランダム動画を再生
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        ランダムYouTube動画プレーヤー
      </h1>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-8">
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
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            再生
          </button>
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </form>

      {videoId && (
        <div className="max-w-3xl mx-auto">
          <YouTubePlayer videoId={videoId} onEnd={handleVideoEnd} />
        </div>
      )}
    </main>
  );
}
