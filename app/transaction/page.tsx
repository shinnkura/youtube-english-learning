import React from "react";
import { YoutubeTranscript } from "youtube-transcript";
import he from "he";

interface Transcript {
  text: string;
  duration: number;
  offset: number;
}

function decodeText(text: string): string {
  return he.decode(
    text
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

async function getTranscript(videoId: string): Promise<Transcript[]> {
  try {
    return await YoutubeTranscript.fetchTranscript(videoId);
  } catch (error) {
    console.error("Transcript取得エラー:", error);
    throw new Error("字幕の取得に失敗しました");
  }
}

export default async function TranscriptPage() {
  try {
    const transcript = await getTranscript("yzRFA0wyZjY");
    const allText = transcript.map((item) => decodeText(item.text)).join("\n");

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">YouTube字幕</h1>
        <div className="whitespace-pre-wrap">{allText}</div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 text-red-500">
        エラーが発生しました:
        {error instanceof Error ? error.message : "不明なエラー"}
      </div>
    );
  }
}
