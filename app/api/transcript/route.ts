import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import he from "he";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "動画IDが指定されていません" },
      { status: 400 }
    );
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const formattedText = transcript
      .map((item) => decodeText(item.text))
      .join("\n");

    return NextResponse.json({ transcript: formattedText });
  } catch (error) {
    console.error("Transcript取得エラー:", error);
    return NextResponse.json(
      { error: "字幕の取得に失敗しました" },
      { status: 500 }
    );
  }
}
