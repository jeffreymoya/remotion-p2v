import type { HighlightBbox } from "./article-text-layout";

export type { HighlightBbox } from "./article-text-layout";

export interface ArticleData {
  category: string;
  headline: string;
  authors: string[];
  date: string;
  time: string;
  tz: string;
  source: string;
}
