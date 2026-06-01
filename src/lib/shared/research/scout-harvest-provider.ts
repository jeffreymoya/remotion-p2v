import type { SearchProvider, SearchHit, SearchOptions } from "./search-provider";

// Bound the per-query harvest fan-out; scout may return up to 8 hits.
const HARVEST_TOP_N = 3;

// Composes a discovery-only scout with a content-extraction harvester into a
// single SearchProvider. Scout owns URL ranking; harvester owns full-text
// extraction. Results beyond HARVEST_TOP_N are returned snippet-only.
//
// Use in makeRoutedProvider as the contentProvider argument:
//   makeRoutedProvider(exa, makeScoutHarvestProvider(serper, firecrawl))
export function makeScoutHarvestProvider(
  scout: SearchProvider,
  harvester: SearchProvider,
): SearchProvider {
  if (!harvester.getContents) {
    throw new Error("ScoutHarvest: harvester must implement getContents()");
  }
  return {
    async search(query: string, opts?: SearchOptions): Promise<SearchHit[]> {
      const scouted = await scout.search(query, opts);
      const targets = scouted.slice(0, HARVEST_TOP_N);
      if (targets.length === 0) return scouted;

      const harvested = await harvester.getContents!(targets.map((h) => h.url));
      const byUrl = new Map(harvested.map((h) => [h.url, h]));

      return scouted.map((hit) => {
        const enriched = byUrl.get(hit.url);
        return enriched
          ? { ...hit, text: enriched.text, highlights: enriched.highlights }
          : hit;
      });
    },
    // ScoutHarvest consumes a harvester; it does not expose getContents itself.
  };
}
