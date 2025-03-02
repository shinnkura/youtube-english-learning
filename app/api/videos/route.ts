import { NextResponse } from "next/server";

interface PlaylistItem {
  snippet: {
    resourceId: {
      videoId: string;
    };
    title: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
}

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json(
      { error: "チャンネルIDが必要です" },
      { status: 400 }
    );
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YouTube API Keyが設定されていません" },
      { status: 500 }
    );
  }

  try {
    // チャンネルIDを取得（@usernameまたはカスタムURL形式の場合は検索APIを使用）
    let actualChannelId = channelId;
    if (channelId.startsWith("@") || channelId.startsWith("c/")) {
      const searchQuery = channelId.startsWith("c/")
        ? channelId.substring(2) // c/を除去
        : channelId;

      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=id&type=channel&q=${encodeURIComponent(
          searchQuery
        )}&key=${YOUTUBE_API_KEY}`
      );
      const searchData = await searchResponse.json();

      if (!searchData.items?.length) {
        return NextResponse.json(
          { error: "チャンネルが見つかりません" },
          { status: 404 }
        );
      }

      actualChannelId = searchData.items[0].id.channelId;
    }

    // チャンネルのアップロード済みプレイリストIDを取得
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${actualChannelId}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelResponse.json();

    if (!channelData.items?.length) {
      return NextResponse.json(
        { error: "チャンネルが見つかりません" },
        { status: 404 }
      );
    }

    const uploadsPlaylistId =
      channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // プレイリストの動画を取得
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}&key=${YOUTUBE_API_KEY}`
    );
    const playlistData = await playlistResponse.json();

    if (!playlistData.items?.length) {
      return NextResponse.json({ videoId: null });
    }

    const videos = playlistData.items.map((item: PlaylistItem) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.default.url,
    }));

    // サーバーサイドでランダム選択
    const randomIndex = Math.floor(Math.random() * videos.length);
    const selectedVideo = videos[randomIndex];

    return NextResponse.json({ videoId: selectedVideo.id });
  } catch (error) {
    console.error("YouTube API error:", error);
    return NextResponse.json(
      { error: "YouTube APIの呼び出しに失敗しました" },
      { status: 500 }
    );
  }
}
