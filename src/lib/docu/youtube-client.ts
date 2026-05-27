const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface VideoCandidate {
  videoId: string;
  title: string;
  channelTitle: string;
}

export interface SearchResult {
  candidates: VideoCandidate[];
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY ?? process.env.GOOGLE_CLOUD_API_KEY;
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY or GOOGLE_CLOUD_API_KEY is required for YouTube search. Set it in .env.",
    );
  }
  return key;
}

export async function searchVideos(query: string, maxResults = 5): Promise<SearchResult> {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: query,
    type: "video",
    videoCaption: "closedCaption",
    relevanceLanguage: "en",
    maxResults: String(maxResults),
  });

  const url = `${YOUTUBE_API_BASE}/search?${params.toString()}`;
  // biome-ignore lint/suspicious/noConsoleLog: <spike log>
  console.log(`[youtube] Searching: "${query}"`);

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API search failed (${res.status}): ${body.slice(0, 500)}`);
  }

  const json = await res.json() as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: { title?: string; channelTitle?: string };
    }>;
  };

  const candidates: VideoCandidate[] = (json.items ?? [])
    .filter(
      (item): item is {
        id: { videoId: string };
        snippet: { title: string; channelTitle: string };
      } => {
        return (
          !!item.id?.videoId &&
          !!item.snippet?.title
        );
      },
    )
    .map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle ?? "unknown",
    }));

  // biome-ignore lint/suspicious/noConsoleLog: <spike log>
  console.log(`[youtube] Found ${candidates.length} video(s)`);

  return { candidates };
}
