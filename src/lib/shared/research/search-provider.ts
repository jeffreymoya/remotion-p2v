export type SearchLens =
  | "meta_analysis"
  | "review_article"
  | "primary_study"
  | "critique_or_replication_failure"
  | "definition_or_mechanism"
  | "statistics_or_distribution"
  | "framework_or_model"
  | "canonical_book"
  | "contrarian_essay"
  | "historical_context"
  | "narrative_case_study"
  | "protagonist_arc"
  | "institutional_report"
  | "expert_testimony"
  | "personal_impact";

export type SearchKind =
  | "primary_quote"
  | "book_excerpt"
  | "study"
  | "meta_analysis"
  | "case_study"
  | "historical_event"
  | "named_person_anecdote"
  | "narrative";

export interface SearchOptions {
  numResults?: number;
  category?: "research paper" | "company" | "news" | "pdf" | "personal site";
  includeDomains?: string[];
  excludeDomains?: string[];
  contents?: {
    text?: { maxCharacters?: number };
    highlights?: { maxCharacters?: number };
  };
  lens?: SearchLens;
  kind?: SearchKind;
}

export interface SearchHit {
  url: string;
  title: string;
  snippet: string;
  text?: string;
  highlights?: string[];
  score?: number;
}

export interface SearchProvider {
  search(query: string, opts?: SearchOptions): Promise<SearchHit[]>;
  getContents?(urls: string[]): Promise<SearchHit[]>;
}
