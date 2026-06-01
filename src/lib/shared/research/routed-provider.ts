import type { SearchProvider, SearchHit, SearchOptions } from "./search-provider";

// Lenses where Exa's neural/academic index is specifically superior.
// This is an optimization hint, not a content-contract gate — every path
// through this router must point at a content-honoring provider.
const EXA_PREFERRED_LENSES = new Set([
  "meta_analysis",
  "review_article",
  "primary_study",
  "critique_or_replication_failure",
  "canonical_book",
]);

// Anchor kinds where Exa's neural search is specifically superior.
const EXA_PREFERRED_KINDS = new Set([
  "primary_quote",
  "book_excerpt",
  "study",
  "meta_analysis",
]);

function pickProvider(
  exa: SearchProvider,
  contentProvider: SearchProvider,
  opts?: SearchOptions,
): SearchProvider {
  if (opts?.lens) return EXA_PREFERRED_LENSES.has(opts.lens) ? exa : contentProvider;
  if (opts?.kind) return EXA_PREFERRED_KINDS.has(opts.kind) ? exa : contentProvider;
  if (opts?.category === "research paper" || opts?.category === "pdf") return exa;
  return contentProvider;
}

// `contentProvider` is the default for all non-Exa-preferred lenses/kinds.
// It MUST honor the SearchProvider content contract (text/highlights populated).
// Pre-ScoutHarvest: pass `exa` as contentProvider.
// Post-ScoutHarvest: pass makeScoutHarvestProvider(serper, firecrawl).
export function makeRoutedProvider(
  exa: SearchProvider,
  contentProvider: SearchProvider,
): SearchProvider {
  return {
    async search(query: string, opts?: SearchOptions): Promise<SearchHit[]> {
      return pickProvider(exa, contentProvider, opts).search(query, opts);
    },
    getContents: exa.getContents?.bind(exa),
  };
}
