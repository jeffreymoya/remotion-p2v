import type { SearchProvider, SearchHit, SearchOptions } from "./search-provider";

// Lenses that benefit from Exa's semantic/category-aware search.
const EXA_LENSES = new Set([
  "meta_analysis",
  "review_article",
  "primary_study",
  "critique_or_replication_failure",
  "canonical_book",
]);

// Anchor kinds that require full page text (quote overlap) or are domain-critical.
const EXA_KINDS = new Set(["primary_quote", "book_excerpt", "study", "meta_analysis"]);

function pickProvider(
  exa: SearchProvider,
  serper: SearchProvider,
  opts?: SearchOptions,
): SearchProvider {
  if (opts?.lens) return EXA_LENSES.has(opts.lens) ? exa : serper;
  if (opts?.kind) return EXA_KINDS.has(opts.kind) ? exa : serper;
  if (opts?.category === "research paper" || opts?.category === "pdf") return exa;
  return serper;
}

export function makeRoutedProvider(
  exa: SearchProvider,
  serper: SearchProvider,
): SearchProvider {
  return {
    async search(query: string, opts?: SearchOptions): Promise<SearchHit[]> {
      return pickProvider(exa, serper, opts).search(query, opts);
    },
    getContents: exa.getContents?.bind(exa),
  };
}
