import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getChannelIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname === "youtube.com"
    ) {
      const paths = urlObj.pathname.split("/").filter(Boolean);

      // @username形式のURLに対応
      if (paths[0]?.startsWith("@")) {
        return paths[0]; // @usernameをそのまま返す
      }

      // channel/ID形式のURLに対応
      if (paths[0] === "channel" && paths[1]) {
        return paths[1];
      }

      // カスタムURL（c/）に対応
      if (paths[0] === "c" && paths[1]) {
        return `c/${paths[1]}`; // c/カスタム名の形式で返す
      }

      // 動画ページからのチャンネルID取得
      if (urlObj.pathname === "/watch") {
        const channelId = urlObj.searchParams.get("channel_id");
        return channelId;
      }
    }
    return null;
  } catch {
    return null;
  }
}
