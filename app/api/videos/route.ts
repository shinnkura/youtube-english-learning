import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const MAX_RESULTS = 50;

// メモリキャッシュ
const CACHE_DURATION = 1000 * 60 * 60; // 1時間
const cache = new Map<string, { data: any; timestamp: number }>();

interface PlaylistItem {
  contentDetails: {
    videoId: string;
  };
}

function getCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function resolveChannelId(channelIdentifier: string): Promise<string> {
  const cacheKey = `channel:${channelIdentifier}`;
  const cached = getCache<string>(cacheKey);
  if (cached) return cached;

  // 既にチャンネルIDの形式（UCで始まる）の場合はそのまま返す
  if (channelIdentifier.startsWith("UC") && channelIdentifier.length > 20) {
    setCache(cacheKey, channelIdentifier);
    return channelIdentifier;
  }

  // @usernameの場合
  if (channelIdentifier.startsWith("@")) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${encodeURIComponent(
      channelIdentifier.substring(1)
    )}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("Channel API エラー:", data);
      throw new Error(data.error?.message || "チャンネルの検索に失敗しました");
    }

    if (data.items?.[0]?.id) {
      setCache(cacheKey, data.items[0].id);
      return data.items[0].id;
    }
  }

  // 通常の検索
  const url = `https://www.googleapis.com/youtube/v3/search?part=id&type=channel&q=${encodeURIComponent(
    channelIdentifier
  )}&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error("Channel search API エラー:", data);
    throw new Error(data.error?.message || "チャンネルの検索に失敗しました");
  }

  if (!data.items?.[0]?.id?.channelId) {
    throw new Error(`チャンネル "${channelIdentifier}" が見つかりません`);
  }

  const channelId = data.items[0].id.channelId;
  setCache(cacheKey, channelId);
  return channelId;
}

async function getChannelUploadsPlaylistId(channelId: string): Promise<string> {
  const cacheKey = `playlist:${channelId}`;
  const cached = getCache<string>(cacheKey);
  if (cached) return cached;

  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error("Channel API エラーレスポンス:", data);
    throw new Error(
      data.error?.message || "チャンネル情報の取得に失敗しました"
    );
  }

  if (!data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads) {
    throw new Error("チャンネルのアップロードプレイリストが見つかりません");
  }

  const playlistId = data.items[0].contentDetails.relatedPlaylists.uploads;
  setCache(cacheKey, playlistId);
  return playlistId;
}

async function fetchPlaylistVideos(playlistId: string): Promise<string[]> {
  const cacheKey = `videos:${playlistId}`;
  const cached = getCache<string[]>(cacheKey);
  if (cached) return cached;

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=${MAX_RESULTS}&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error("Playlist API エラーレスポンス:", data);
    throw new Error(data.error?.message || "プレイリストの取得に失敗しました");
  }

  if (!data.items || !Array.isArray(data.items)) {
    throw new Error("プレイリストが空です");
  }

  const videos = data.items.map(
    (item: PlaylistItem) => item.contentDetails.videoId
  );
  setCache(cacheKey, videos);
  return videos;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "チャンネルIDが指定されていません" },
        { status: 400 }
      );
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: "YouTube API キーが設定されていません" },
        { status: 500 }
      );
    }

    const actualChannelId = await resolveChannelId(channelId);
    const playlistId = await getChannelUploadsPlaylistId(actualChannelId);
    const videos = await fetchPlaylistVideos(playlistId);

    if (videos.length === 0) {
      return NextResponse.json(
        { error: "このチャンネルには動画がありません" },
        { status: 404 }
      );
    }

    const randomIndex = Math.floor(Math.random() * videos.length);
    const videoId = videos[randomIndex];

    return NextResponse.json({ videoId });
  } catch (error) {
    console.error("Videos API エラー:", {
      error,
      message: error instanceof Error ? error.message : "不明なエラー",
      channelId: searchParams.get("channelId"),
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "動画の取得に失敗しました",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
