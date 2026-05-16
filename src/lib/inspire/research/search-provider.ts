export interface SearchOptions {
  numResults?: number;
  category?: "research paper" | "company" | "news" | "pdf" | "personal site";
  includeDomains?: string[];
  excludeDomains?: string[];
  contents?: {
    text?: { maxCharacters?: number };
    highlights?: { maxCharacters?: number };
  };
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
