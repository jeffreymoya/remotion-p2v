export const TRUSTED_DOMAINS = {
  quotes: [
    "loc.gov",
    "gutenberg.org",
    "archive.org",
    "wikiquote.org",
    "jstor.org",
    "newyorker.com",
    "theatlantic.com",
    "harpers.org",
    "lrb.co.uk",
    "nybooks.com",
  ],
  books: [
    "gutenberg.org",
    "archive.org",
    "penguinrandomhouse.com",
    "us.macmillan.com",
    "hbr.org",
  ],
  papers: [
    "doi.org",
    "arxiv.org",
    "pubmed.ncbi.nlm.nih.gov",
    "psychnet.apa.org",
    "sciencedirect.com",
    "nature.com",
    "science.org",
  ],
  journalism: [
    "nytimes.com",
    "washingtonpost.com",
    "newyorker.com",
    "theatlantic.com",
    "npr.org",
    "bbc.com",
    "reuters.com",
    "ft.com",
    "economist.com",
  ],
  encyclopedia: [
    "wikipedia.org",
    "britannica.com",
    "plato.stanford.edu",
  ],
} as const;

/** Suffix-based domain patterns (e.g. .edu) that can't be passed to Exa's includeDomains. */
export const TRUSTED_SUFFIXES = {
  quotes: [".edu"],
  books: [".edu"],
  papers: [".edu"],
  journalism: [],
  encyclopedia: [],
} as const;

export type TrustCategory = keyof typeof TRUSTED_DOMAINS;

/**
 * Return the trust category for an anchor kind.
 */
export function trustCategoryForKind(
  kind: string,
): TrustCategory {
  switch (kind) {
    case "primary_quote":
      return "quotes";
    case "book_excerpt":
      return "books";
    case "study":
    case "meta_analysis":
      return "papers";
    case "case_study":
    case "historical_event":
      return "journalism";
    case "named_person_anecdote":
      return "encyclopedia";
    default:
      return "encyclopedia";
  }
}

/**
 * Check whether a URL belongs to a trusted domain (exact match or suffix match).
 */
export function isTrustedUrl(url: string, category: TrustCategory): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }

  const domains = TRUSTED_DOMAINS[category];
  for (const d of domains) {
    if (hostname === d || hostname.endsWith(`.${d}`)) return true;
  }

  const suffixes = TRUSTED_SUFFIXES[category];
  for (const s of suffixes) {
    if (hostname.endsWith(s)) return true;
  }

  return false;
}
