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

export interface ArticleCardSpec extends ArticleData {
  id: string;
  startFrame: number;
  durationInFrames: number;
}

export interface DocuArticleCard {
  article: ArticleData;
  id: string;
  startFrame: number;
  durationInFrames: number;
}

export function runArticleCardPipeline(
  _slug: string,
  specs: ArticleCardSpec[],
): DocuArticleCard[] {
  return specs.map(({ id, startFrame, durationInFrames, ...article }) => ({
    article,
    id,
    startFrame,
    durationInFrames,
  }));
}
