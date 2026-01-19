import { XMLParser } from "fast-xml-parser";

/** News item associated with a trending topic */
export type NewsItem = {
  title: string;
  snippet?: string;
  url?: string;
  source?: string;
  picture?: string;
};

/** Raw trending topic from RSS */
export type TrendingTopic = {
  query: string;
  traffic: string | null;
  exploreUrl: string | null;
  picture?: string;
  pictureSource?: string;
  newsItems: NewsItem[];
};

/** A generalized video suggestion */
export type TopicSuggestion = {
  id: string;
  title: string;
  angle: string;
  description: string;
  viralPotential: number;
};

/** Trending topic with generalized suggestions */
export type GeneralizedTrendingTopic = {
  id: string;
  originalTrend: string;
  traffic: string | null;
  picture?: string;
  newsHeadlines: string[];
  suggestions: TopicSuggestion[];
};

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

type CacheEntry = {
  geo: string;
  category?: number;
  expiresAt: number;
  topics: TrendingTopic[];
};

let cache: CacheEntry | null = null;

function parseNewsItems(item: Record<string, unknown>): NewsItem[] {
  const newsItemsRaw = item?.["ht:news_item"];
  if (!newsItemsRaw) return [];

  const items = Array.isArray(newsItemsRaw) ? newsItemsRaw : [newsItemsRaw];
  return items
    .map((ni: unknown) => {
      const newsItem = ni as Record<string, unknown>;
      return {
        title: String(newsItem?.["ht:news_item_title"] || ""),
        snippet: newsItem?.["ht:news_item_snippet"] ? String(newsItem["ht:news_item_snippet"]) : undefined,
        url: newsItem?.["ht:news_item_url"] ? String(newsItem["ht:news_item_url"]) : undefined,
        source: newsItem?.["ht:news_item_source"] ? String(newsItem["ht:news_item_source"]) : undefined,
        picture: newsItem?.["ht:news_item_picture"] ? String(newsItem["ht:news_item_picture"]) : undefined,
      };
    })
    .filter((ni: NewsItem) => ni.title);
}

function parseRssTopics(xml: string): TrendingTopic[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "text",
  });

  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? [];
  const list = Array.isArray(items) ? items : items ? [items] : [];

  return list
    .map((item: unknown) => {
      const topic = item as Record<string, unknown>;
      const title = topic?.title as Record<string, unknown> | string | undefined;
      return {
        query: typeof title === "object" ? String(title?.text ?? "") : String(title ?? ""),
        traffic: topic?.["ht:approx_traffic"] ? String(topic["ht:approx_traffic"]) : null,
        exploreUrl: topic?.link ? String(topic.link) : null,
        picture: topic?.["ht:picture"] ? String(topic["ht:picture"]) : undefined,
        pictureSource: topic?.["ht:picture_source"] ? String(topic["ht:picture_source"]) : undefined,
        newsItems: parseNewsItems(topic),
      };
    })
    .filter((item) => item.query);
}

export async function fetchTrendingTopics(
  geo = "US",
  category?: number
): Promise<TrendingTopic[]> {
  const now = Date.now();
  if (
    cache &&
    cache.geo === geo &&
    cache.category === category &&
    cache.expiresAt > now
  ) {
    return cache.topics;
  }

  try {
    const params = new URLSearchParams({ geo });
    if (typeof category === "number") {
      params.set("cat", String(category));
    }
    const rssUrl = `https://trends.google.com/trending/rss?${params.toString()}`;
    const response = await fetch(rssUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`RSS returned ${response.status}`);
    }

    const xml = await response.text();
    const topics = parseRssTopics(xml);

    cache = {
      geo,
      category,
      topics,
      expiresAt: now + CACHE_TTL_MS,
    };

    return topics;
  } catch (error) {
    console.warn("Google Trends RSS unavailable:", error);
    cache = {
      geo,
      category,
      topics: [],
      expiresAt: now + CACHE_TTL_MS / 3,
    };
    return [];
  }
}
