import { YoutubeTranscript } from "youtube-transcript";
import he from "he";

export interface Transcript {
  text: string;
  duration: number;
  offset: number;
}

export class TranscriptError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "TranscriptError";
  }
}

function decodeText(text: string): string {
  try {
    return he.decode(
      text
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
    );
  } catch (error) {
    throw new TranscriptError("テキストのデコードに失敗しました", error);
  }
}

export async function getTranscript(videoId: string): Promise<Transcript[]> {
  try {
    if (!videoId) {
      throw new TranscriptError("動画IDが指定されていません");
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      throw new TranscriptError("字幕が見つかりませんでした");
    }

    return transcript;
  } catch (error) {
    if (error instanceof TranscriptError) {
      throw error;
    }
    console.error("Transcript取得エラー:", error);
    throw new TranscriptError("字幕の取得に失敗しました", error);
  }
}

export function formatTranscript(transcript: Transcript[]): string {
  try {
    if (!transcript || transcript.length === 0) {
      throw new TranscriptError("フォーマットする字幕データがありません");
    }

    return transcript.map((item) => decodeText(item.text)).join("\n");
  } catch (error) {
    if (error instanceof TranscriptError) {
      throw error;
    }
    throw new TranscriptError("字幕のフォーマットに失敗しました", error);
  }
}
