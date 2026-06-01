// Firecrawl content-extraction provider.
// Requires: npm install @mendable/firecrawl-js
// Env var: FIRECRAWL_API_KEY
//
// This is a harvest-only provider — it implements getContents() but NOT search().
// Wire it as the harvester in makeScoutHarvestProvider(serper, firecrawl), then
// pass that as the contentProvider in makeRoutedProvider(exa, scoutHarvest).
//
// To activate, update resolveProvider() in research-pipeline.ts.
import type { SearchProvider, SearchHit } from "./search-provider";

export function makeFirecrawlProvider(apiKey: string): SearchProvider {
  return {
    async search(): Promise<SearchHit[]> {
      throw new Error(
        "Firecrawl is harvest-only — use as the harvester arg to makeScoutHarvestProvider(), not as a standalone search provider",
      );
    },

    async getContents(urls: string[]): Promise<SearchHit[]> {
      // Dynamic import so the package is only required when this path is active.
      // Run `npm install @mendable/firecrawl-js` to activate.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { default: Firecrawl } = await import("@mendable/firecrawl-js" as any);
      const app = new Firecrawl({ apiKey });

      return Promise.all(
        urls.map(async (url): Promise<SearchHit> => {
          try {
            const res = await app.scrape(url, { formats: ["markdown"] });
            const text = (res as { markdown?: string }).markdown ?? undefined;
            const title = (res as { metadata?: { title?: string } }).metadata?.title ?? "";
            return {
              url,
              title,
              snippet: "",
              text,
              highlights: text ? [text.slice(0, 500)] : undefined,
            };
          } catch {
            // Fail-soft per URL so one blocked page doesn't abort the batch.
            return { url, title: "", snippet: "", text: undefined };
          }
        }),
      );
    },
  };
}
