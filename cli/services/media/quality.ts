/**
 * Quality scoring and ranking for stock media
 */

import { StockImage, StockVideo, MediaAsset, QualityScore } from '../../lib/media-types';
import * as stringSimilarity from 'string-similarity';

/**
 * Calculate quality score for media asset
 */
export function calculateQualityScore(
  media: StockImage | StockVideo,
  targetAspectRatio: '16:9' | '9:16'
): QualityScore {
  // 1. Resolution Score (0-1)
  const resolution = media.width * media.height;
  const minResolution = targetAspectRatio === '16:9' ? 1920 * 1080 : 1080 * 1920;
  const idealResolution = targetAspectRatio === '16:9' ? 3840 * 2160 : 2160 * 3840; // 4K

  const resolutionScore = resolution < minResolution ? 0.5 :
                          resolution >= idealResolution ? 1.0 :
                          0.5 + (0.5 * ((resolution - minResolution) / (idealResolution - minResolution)));

  // 2. Aspect Ratio Match Score (0-1)
  const actualRatio = media.width / media.height;
  const targetRatio = targetAspectRatio === '16:9' ? 16/9 : 9/16;
  const ratioDiff = Math.abs(actualRatio - targetRatio);
  const aspectRatioScore = Math.max(0, 1 - (ratioDiff * 2)); // Penalize mismatches

  // 3. Relevance Score (default 1.0, will be overridden by tag matching)
  const relevanceScore = 1.0;

  // Combined Score: weighted average
  const totalScore = (resolutionScore * 0.4) + (aspectRatioScore * 0.3) + (relevanceScore * 0.3);

  return {
    total: totalScore,
    resolution: resolutionScore,
    aspectRatio: aspectRatioScore,
    relevance: relevanceScore,
  };
}

/**
 * Rank media by quality score
 */
export function rankByQuality<T extends MediaAsset>(
  media: T[],
  options: { aspectRatio: '16:9' | '9:16'; minQuality?: number }
): T[] {
  const minQuality = options.minQuality ?? 0.6;

  // Calculate quality score for each item
  const scored = media.map(item => ({
    item,
    score: calculateQualityScore(item, options.aspectRatio),
  }));

  // Filter by minimum quality
  const filtered = scored.filter(s => s.score.total >= minQuality);

  // Sort by total score descending
  filtered.sort((a, b) => b.score.total - a.score.total);

  return filtered.map(s => s.item);
}

/**
 * Calculate relevance score based on tag matching
 */
export function calculateRelevanceScore(media: MediaAsset, query: string): number {
  const queryTokens = query.toLowerCase().split(/\s+/);
  const mediaTags = media.tags.map(t => t.toLowerCase());

  let matchCount = 0;
  for (const token of queryTokens) {
    if (mediaTags.some(tag => tag.includes(token) || token.includes(tag))) {
      matchCount++;
    }
  }

  return matchCount / queryTokens.length; // 0-1 score
}

/**
 * Rank media by combined quality and relevance
 */
export function rankByQualityAndRelevance<T extends MediaAsset>(
  media: T[],
  query: string,
  options: { aspectRatio: '16:9' | '9:16' }
): T[] {
  const scored = media.map(item => {
    const qualityScore = calculateQualityScore(item, options.aspectRatio);
    const relevanceScore = calculateRelevanceScore(item, query);

    // Combined: Quality × 0.6 + Relevance × 0.4
    const totalScore = (qualityScore.total * 0.6) + (relevanceScore * 0.4);

    return { item, totalScore, qualityScore, relevanceScore };
  });

  // Sort by total score descending
  scored.sort((a, b) => b.totalScore - a.totalScore);

  return scored.map(s => s.item);
}

/**
 * Fuzzy tag matching with string similarity
 */
export function fuzzyMatchTags<T extends MediaAsset>(
  tags: string[],
  media: T[],
  minScore: number = 0.7
): Array<{ media: T; score: number }> {
  const matches: Array<{ media: T; score: number }> = [];

  for (const item of media) {
    let bestScore = 0;

    for (const tag of tags) {
      for (const mediaTag of item.tags) {
        const similarity = stringSimilarity.compareTwoStrings(
          tag.toLowerCase(),
          mediaTag.toLowerCase()
        );

        if (similarity > bestScore) {
          bestScore = similarity;
        }
      }
    }

    if (bestScore >= minScore) {
      matches.push({ media: item, score: bestScore });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches;
}
