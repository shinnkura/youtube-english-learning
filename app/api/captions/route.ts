import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "Video ID is required" },
      { status: 400 }
    );
  }

  try {
    // 字幕トラックの一覧を取得
    const captionsListResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const captionsData = await captionsListResponse.json();

    // 英語の字幕トラックを探す
    const englishCaption = captionsData.items.find(
      (item: { snippet: { language: string } }) =>
        item.snippet.language === "en"
    );

    if (!englishCaption) {
      return NextResponse.json({ captions: [] });
    }

    // 字幕データを取得
    const captionResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions/${englishCaption.id}?key=${YOUTUBE_API_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.YOUTUBE_ACCESS_TOKEN}`,
        },
      }
    );

    const captionContent = await captionResponse.text();
    const captions = parseCaptions(captionContent);

    return NextResponse.json({ captions });
  } catch (error) {
    console.error("Error fetching captions:", error);
    return NextResponse.json(
      { error: "Failed to fetch captions" },
      { status: 500 }
    );
  }
}

function parseCaptions(
  captionContent: string
): { start: number; text: string }[] {
  // 字幕データをパースして整形
  const lines = captionContent.split("\n");
  const captions = [];
  let currentCaption = { start: 0, text: "" };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("-->")) {
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        const [hours, minutes, seconds] = timeMatch[1].split(":").map(Number);
        currentCaption.start = hours * 3600 + minutes * 60 + seconds;
      }
    } else if (line && !line.match(/^\d+$/)) {
      currentCaption.text = line;
      captions.push({ ...currentCaption });
      currentCaption = { start: 0, text: "" };
    }
  }

  return captions;
}
