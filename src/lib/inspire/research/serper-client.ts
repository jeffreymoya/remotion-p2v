import type { SearchProvider, SearchHit, SearchOptions } from "./search-provider";
import { SEARCH_TIMEOUT_MS } from "../../config";

const SERPER_SEARCH_URL = "https://google.serper.dev/search";

function buildQuery(query: string, opts?: SearchOptions): string {
  if (!opts?.includeDomains?.length) return query;
  const siteOps = opts.includeDomains.map((d) => `site:${d}`).join(" OR ");
  return `${query} (${siteOps})`;
}

export function makeSerperProvider(apiKey: string): SearchProvider {
  return {
    async search(query: string, opts?: SearchOptions): Promise<SearchHit[]> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

      let data: { organic?: Array<{ link: string; title?: string; snippet?: string }> };
      try {
        const resp = await fetch(SERPER_SEARCH_URL, {
          method: "POST",
          headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ q: buildQuery(query, opts), num: opts?.numResults ?? 5 }),
          signal: controller.signal,
        });
        if (!resp.ok) throw new Error(`Serper HTTP ${resp.status}`);
        data = await resp.json() as typeof data;
      } finally {
        clearTimeout(timer);
      }

      return (data.organic ?? [])
        .slice(0, opts?.numResults ?? 5)
        .map((r) => ({
          url: r.link,
          title: r.title ?? "",
          snippet: r.snippet ?? "",
          text: undefined,
          highlights: undefined,
          score: undefined,
        }));
    },
  };
}
