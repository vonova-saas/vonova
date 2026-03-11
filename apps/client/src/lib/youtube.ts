"use server";
import axios from "axios";

export async function searchYoutube(searchQuery: string) {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    searchQuery = encodeURIComponent(searchQuery);
    const { data } = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${searchQuery}&videoDuration=medium&videoEmbeddable=true&type=video&maxResults=5`
    );

    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoIds = data.items
      .map((item: any) => item?.id?.videoId)
      .filter(Boolean);
    return videoIds;
  } catch {
    return [];
  }
}
