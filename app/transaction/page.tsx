import React from "react";
import { getTranscript, formatTranscript } from "../lib/youtube/transcript";

export default async function TranscriptPage() {
  try {
    const transcript = await getTranscript("yzRFA0wyZjY");
    const formattedText = formatTranscript(transcript);

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">YouTube字幕</h1>
        <div className="whitespace-pre-wrap">{formattedText}</div>
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
