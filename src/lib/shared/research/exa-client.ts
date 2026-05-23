import Exa from "exa-js";
import type { SearchProvider, SearchHit, SearchOptions } from "./search-provider";
import { SEARCH_TIMEOUT_MS } from "../../config";

export function makeExaProvider(apiKey: string): SearchProvider {
  const exa = new Exa(apiKey);

  return {
    async search(query: string, opts?: SearchOptions): Promise<SearchHit[]> {
      const response = await Promise.race([
        exa.search(query, {
          numResults: opts?.numResults ?? 5,
          ...(opts?.category ? { category: opts.category } : {}),
          ...(opts?.includeDomains?.length ? { includeDomains: opts.includeDomains } : {}),
          ...(opts?.excludeDomains?.length ? { excludeDomains: opts.excludeDomains } : {}),
          contents: {
            text: { maxCharacters: opts?.contents?.text?.maxCharacters ?? 5000 },
            highlights: { maxCharacters: opts?.contents?.highlights?.maxCharacters ?? 500 },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Exa search timeout")), SEARCH_TIMEOUT_MS),
        ),
      ]);

      return response.results.map((r) => ({
        url: r.url,
        title: r.title ?? "",
        snippet: ("highlights" in r && Array.isArray(r.highlights)) ? r.highlights.join(" ") : "",
        text: "text" in r ? (r.text as string | undefined) : undefined,
        highlights: "highlights" in r ? (r.highlights as string[] | undefined) : undefined,
        score: r.score,
      }));
    },

    async getContents(urls: string[]): Promise<SearchHit[]> {
      const response = await Promise.race([
        exa.getContents(urls, {
          text: { maxCharacters: 5000 },
          highlights: { maxCharacters: 500 },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Exa getContents timeout")), SEARCH_TIMEOUT_MS),
        ),
      ]);

      return response.results.map((r) => ({
        url: r.url,
        title: r.title ?? "",
        snippet: ("highlights" in r && Array.isArray(r.highlights)) ? r.highlights.join(" ") : "",
        text: "text" in r ? (r.text as string | undefined) : undefined,
        highlights: "highlights" in r ? (r.highlights as string[] | undefined) : undefined,
        score: r.score,
      }));
    },
  };
}
