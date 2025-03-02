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
  const [transcript, setTranscript] = useState<string>("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTranscript("");
    setIsVideoPlaying(false);

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

      // 字幕を取得
      const transcriptResponse = await fetch(
        `/api/transcript?videoId=${data.videoId}`
      );
      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        throw new Error(errorData.error || "字幕の取得に失敗しました");
      }

      const transcriptData = await transcriptResponse.json();
      setTranscript(transcriptData.transcript);
      setIsUrlSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "エラーが発生しました。もう一度お試しください。"
      );
    }
  };

  const handlePlayVideo = () => {
    setIsVideoPlaying(true);
  };

  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
    handleUrlSubmit({ preventDefault: () => {} } as React.FormEvent);
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
            字幕を取得
          </button>
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </form>

      {isUrlSubmitted && transcript && !isVideoPlaying && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">字幕プレビュー</h2>
            <div className="whitespace-pre-wrap">{transcript}</div>
          </div>
          <div className="text-center">
            <button
              onClick={handlePlayVideo}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-lg font-semibold"
            >
              動画を再生
            </button>
          </div>
        </div>
      )}

      {isVideoPlaying && videoId && (
        <div className="max-w-3xl mx-auto">
          <YouTubePlayer videoId={videoId} onEnd={handleVideoEnd} />
        </div>
      )}
    </main>
  );
}
