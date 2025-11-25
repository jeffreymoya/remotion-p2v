# Media Pipeline Implementation Specification

This document provides detailed technical specifications for stock media handling, including search algorithms, deduplication, quality scoring, and media-to-segment matching.

---

## Table of Contents

1. [Stock Media Search Strategy](#1-stock-media-search-strategy)
2. [Deduplication Algorithm](#2-deduplication-algorithm)
3. [Quality Scoring & Ranking](#3-quality-scoring--ranking)
4. [Media-to-Segment Matching](#4-media-to-segment-matching)
5. [Download & Caching](#5-download--caching)
6. [Video Handling Specifics](#6-video-handling-specifics)
7. [Fallback Strategies](#7-fallback-strategies)

---

## 1. Stock Media Search Strategy

### 1.1 Multi-Service Parallel Search

```typescript
export class StockMediaSearch {
  constructor(
    private pexelsService: PexelsService,
    private unsplashService: UnsplashService,
    private pixabayService: PixabayService
  ) {}

  async searchImages(tags: string[], options: ImageSearchOptions): Promise<StockImage[]> {
    // Search all three services in parallel
    const searchPromises = tags.map(async (tag) => {
      const results = await Promise.allSettled([
        this.searchPexelsImages(tag, options),
        this.searchUnsplashImages(tag, options),
        this.searchPixabayImages(tag, options),
      ]);

      // Collect all successful results
      const images: StockImage[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          images.push(...result.value);
        } else {
          logger.warn(`Stock image search failed for tag: ${tag}`, { error: result.reason });
        }
      }

      return images;
    });

    const allResults = await Promise.all(searchPromises);
    const flattenedResults = allResults.flat();

    // Deduplicate and rank
    const deduplicated = this.deduplicateImages(flattenedResults);
    const ranked = this.rankByQuality(deduplicated, options);

    return ranked;
  }

  async searchVideos(tags: string[], options: VideoSearchOptions): Promise<StockVideo[]> {
    // Only Pexels and Pixabay have videos (Unsplash doesn't)
    const searchPromises = tags.map(async (tag) => {
      const results = await Promise.allSettled([
        this.searchPexelsVideos(tag, options),
        this.searchPixabayVideos(tag, options),
      ]);

      const videos: StockVideo[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          videos.push(...result.value);
        }
      }

      return videos;
    });

    const allResults = await Promise.all(searchPromises);
    const flattenedResults = allResults.flat();

    const deduplicated = this.deduplicateVideos(flattenedResults);
    const ranked = this.rankByQuality(deduplicated, options);

    return ranked;
  }

  private async searchPexelsImages(tag: string, options: ImageSearchOptions): Promise<StockImage[]> {
    return await rateLimiter.execute('pexels', () =>
      this.pexelsService.searchImages(tag, options)
    );
  }

  private async searchUnsplashImages(tag: string, options: ImageSearchOptions): Promise<StockImage[]> {
    return await rateLimiter.execute('unsplash', () =>
      this.unsplashService.searchImages(tag, options)
    );
  }

  private async searchPixabayImages(tag: string, options: ImageSearchOptions): Promise<StockImage[]> {
    return await rateLimiter.execute('pixabay', () =>
      this.pixabayService.searchImages(tag, options)
    );
  }
}
```

### 1.2 Tag Expansion Strategy

```typescript
export function expandTags(originalTags: string[]): string[] {
  // Use AI to expand tags with related terms
  const expandedTags = new Set(originalTags);

  // Add synonyms and related terms
  for (const tag of originalTags) {
    const relatedTerms = getRelatedTerms(tag);
    relatedTerms.forEach(term => expandedTags.add(term));
  }

  return Array.from(expandedTags);
}

function getRelatedTerms(tag: string): string[] {
  // Predefined synonym mappings
  const synonymMap: Record<string, string[]> = {
    'stressed': ['anxious', 'worried', 'overwhelmed', 'pressure'],
    'happy': ['joyful', 'cheerful', 'smiling', 'celebrating'],
    'brain': ['neuroscience', 'mind', 'cognitive', 'mental'],
    'laptop': ['computer', 'workspace', 'desk setup', 'working'],
    // ... more mappings
  };

  const related: string[] = [];

  // Direct synonyms
  if (synonymMap[tag.toLowerCase()]) {
    related.push(...synonymMap[tag.toLowerCase()]);
  }

  // Word variations (singular/plural)
  if (tag.endsWith('s')) {
    related.push(tag.slice(0, -1)); // Remove 's'
  } else {
    related.push(tag + 's'); // Add 's'
  }

  return related;
}
```

---

## 2. Deduplication Algorithm

### 2.1 Perceptual Hash-Based Deduplication

```typescript
import * as phash from 'imghash'; // Perceptual hashing library

export class ImageDeduplicator {
  private hashCache: Map<string, string> = new Map(); // URL -> hash

  async deduplicateImages(images: StockImage[]): Promise<StockImage[]> {
    const deduplicated: StockImage[] = [];
    const seenHashes: Map<string, StockImage> = new Map();

    for (const image of images) {
      // Calculate perceptual hash
      const hash = await this.getPerceptualHash(image.url);

      // Check for duplicates (similarity threshold: 0.90)
      let isDuplicate = false;
      for (const [seenHash, seenImage] of seenHashes.entries()) {
        const similarity = this.hammingDistance(hash, seenHash);

        if (similarity >= 0.90) {
          isDuplicate = true;

          // Keep higher quality version
          if (this.compareQuality(image, seenImage) > 0) {
            // Replace with higher quality
            const index = deduplicated.indexOf(seenImage);
            deduplicated[index] = image;
            seenHashes.delete(seenHash);
            seenHashes.set(hash, image);
          }

          break;
        }
      }

      if (!isDuplicate) {
        deduplicated.push(image);
        seenHashes.set(hash, image);
      }
    }

    return deduplicated;
  }

  private async getPerceptualHash(url: string): Promise<string> {
    if (this.hashCache.has(url)) {
      return this.hashCache.get(url)!;
    }

    const hash = await phash.hash(url);
    this.hashCache.set(url, hash);
    return hash;
  }

  private hammingDistance(hash1: string, hash2: string): number {
    // Calculate Hamming distance between two hashes
    let distance = 0;
    const maxLength = Math.max(hash1.length, hash2.length);

    for (let i = 0; i < maxLength; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }

    // Convert to similarity score (0-1)
    return 1 - (distance / maxLength);
  }

  private compareQuality(image1: StockImage, image2: StockImage): number {
    // Higher resolution = higher quality
    const resolution1 = image1.width * image1.height;
    const resolution2 = image2.width * image2.height;

    if (resolution1 > resolution2) return 1;
    if (resolution1 < resolution2) return -1;
    return 0;
  }
}
```

### 2.2 Video Deduplication

```typescript
export function deduplicateVideos(videos: StockVideo[]): StockVideo[] {
  // For videos, use simpler deduplication based on URL and dimensions
  const seen = new Set<string>();
  const deduplicated: StockVideo[] = [];

  for (const video of videos) {
    // Create unique key: source + dimensions + duration
    const key = `${video.source}:${video.width}x${video.height}:${Math.round(video.duration)}s`;

    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(video);
    } else {
      // If duplicate, check if this one is higher quality
      const existingIndex = deduplicated.findIndex(v =>
        v.source === video.source &&
        v.width === video.width &&
        v.height === video.height &&
        Math.abs(v.duration - video.duration) < 1
      );

      if (existingIndex >= 0) {
        const existing = deduplicated[existingIndex];

        // Prefer higher resolution or longer duration
        if (video.width * video.height > existing.width * existing.height ||
            video.duration > existing.duration) {
          deduplicated[existingIndex] = video;
        }
      }
    }
  }

  return deduplicated;
}
```

---

## 3. Quality Scoring & Ranking

### 3.1 Quality Scoring Formula

```typescript
export interface QualityScore {
  total: number;          // 0-1
  resolution: number;     // 0-1
  aspectRatio: number;    // 0-1
  relevance: number;      // 0-1 (from API)
}

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

  // 3. API Relevance Score (0-1)
  // Pexels/Unsplash/Pixabay don't provide relevance scores, so we estimate based on position
  // Assume first result is most relevant, score decreases linearly
  const relevanceScore = 1.0; // Placeholder, would need to track position in results

  // Combined Score: weighted average
  const totalScore = (resolutionScore * 0.4) + (aspectRatioScore * 0.3) + (relevanceScore * 0.3);

  return {
    total: totalScore,
    resolution: resolutionScore,
    aspectRatio: aspectRatioScore,
    relevance: relevanceScore,
  };
}
```

### 3.2 Ranking Algorithm

```typescript
export function rankByQuality(
  media: (StockImage | StockVideo)[],
  options: { aspectRatio: '16:9' | '9:16'; minQuality?: number }
): (StockImage | StockVideo)[] {
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
```

### 3.3 Combined Ranking (Quality + Relevance)

```typescript
export function rankByQualityAndRelevance(
  media: (StockImage | StockVideo)[],
  query: string,
  options: { aspectRatio: '16:9' | '9:16' }
): (StockImage | StockVideo)[] {
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

function calculateRelevanceScore(media: StockImage | StockVideo, query: string): number {
  // Calculate relevance based on tag matching
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
```

---

## 4. Media-to-Segment Matching

### 4.1 Fuzzy Tag Matching

```typescript
import * as stringSimilarity from 'string-similarity';

export function findMediaForSegment(
  segment: ScriptSegment,
  images: StockImage[],
  videos: StockVideo[],
  options: { targetCount: number; minMatchScore: number }
): MediaAsset[] {
  const targetCount = options.targetCount ?? 5;
  const minMatchScore = options.minMatchScore ?? 0.7;

  // 1. Match segment visual suggestions to media tags (fuzzy match)
  const allMedia = [...images, ...videos];
  const tagMatches = fuzzyMatchTags(segment.visualSuggestions, allMedia, minMatchScore);

  // 2. If fewer than target, expand search with related terms
  if (tagMatches.length < targetCount) {
    const relatedTags = expandTags(segment.visualSuggestions);
    const expandedMatches = fuzzyMatchTags(relatedTags, allMedia, minMatchScore * 0.8);

    // Add unique matches
    for (const match of expandedMatches) {
      if (!tagMatches.find(m => m.media.id === match.media.id)) {
        tagMatches.push(match);
      }
    }
  }

  // 3. Fallback to generic category images if still insufficient
  if (tagMatches.length < 3) {
    const category = classifySegmentCategory(segment.type);
    const genericMedia = getGenericMediaByCategory(category, allMedia);

    for (const media of genericMedia) {
      tagMatches.push({ media, score: 0.5 });
    }
  }

  // 4. Prioritize videos for "action" segments, images for "explanation"
  const hasActionKeywords = /\b(action|moving|dynamic|active|motion)\b/i.test(segment.speakingNotes);
  const prioritized = prioritizeMediaType(tagMatches, hasActionKeywords ? 'video' : 'image');

  // 5. Return top matches (target: targetCount)
  return prioritized.slice(0, targetCount).map(m => m.media);
}

interface MediaMatch {
  media: MediaAsset;
  score: number;
}

function fuzzyMatchTags(
  tags: string[],
  media: MediaAsset[],
  minScore: number
): MediaMatch[] {
  const matches: MediaMatch[] = [];

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
```

### 4.2 Category Classification

```typescript
export function classifySegmentCategory(segmentType: string): string {
  // Map segment types to generic categories
  const categoryMap: Record<string, string> = {
    'hook': 'attention-grabbing',
    'intro': 'overview',
    'body': 'informative',
    'transition': 'connecting',
    'conclusion': 'summary',
    'cta': 'engagement',
  };

  return categoryMap[segmentType] || 'general';
}

export function getGenericMediaByCategory(category: string, media: MediaAsset[]): MediaAsset[] {
  // Generic fallback tags for each category
  const genericTags: Record<string, string[]> = {
    'attention-grabbing': ['dramatic', 'colorful', 'eye-catching', 'vibrant'],
    'overview': ['landscape', 'wide angle', 'panoramic', 'establishing'],
    'informative': ['close-up', 'detail', 'focused', 'clear'],
    'connecting': ['transition', 'movement', 'flow', 'bridge'],
    'summary': ['conclusion', 'ending', 'final', 'wrap-up'],
    'engagement': ['people', 'interaction', 'community', 'social'],
    'general': ['abstract', 'background', 'minimal', 'clean'],
  };

  const tags = genericTags[category] || genericTags['general'];

  // Return media with any matching tags
  return media.filter(item =>
    item.tags.some(tag =>
      tags.some(genericTag => tag.toLowerCase().includes(genericTag))
    )
  ).slice(0, 10);
}
```

### 4.3 Media Type Prioritization

```typescript
function prioritizeMediaType(matches: MediaMatch[], preferredType: 'image' | 'video'): MediaMatch[] {
  // Sort matches with preferred type first, then by score
  return matches.sort((a, b) => {
    const aIsPreferred = a.media.type === preferredType;
    const bIsPreferred = b.media.type === preferredType;

    if (aIsPreferred && !bIsPreferred) return -1;
    if (!aIsPreferred && bIsPreferred) return 1;

    // Same type preference, sort by score
    return b.score - a.score;
  });
}
```

---

## 5. Download & Caching

### 5.1 Asset Download

```typescript
import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

export class MediaDownloader {
  constructor(private cacheDir: string = 'cache/media') {}

  async downloadMedia(media: StockImage | StockVideo): Promise<string> {
    // Generate cache key from URL
    const hash = crypto.createHash('md5').update(media.downloadUrl).digest('hex');
    const extension = this.getExtension(media.downloadUrl);
    const cacheKey = `${hash}${extension}`;
    const cachePath = path.join(this.cacheDir, cacheKey);

    // Check cache first
    if (await fs.pathExists(cachePath)) {
      logger.debug(`Cache hit for media: ${media.id}`);
      return cachePath;
    }

    // Download
    logger.info(`Downloading media: ${media.id} from ${media.source}`);
    const response = await axios.get(media.downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });

    // Save to cache
    await fs.ensureDir(this.cacheDir);
    await fs.writeFile(cachePath, response.data);

    // Save metadata
    await this.saveMetadata(cacheKey, media);

    return cachePath;
  }

  private async saveMetadata(cacheKey: string, media: StockImage | StockVideo): Promise<void> {
    const metadataPath = path.join(this.cacheDir, `${cacheKey}.metadata.json`);

    await fs.writeJSON(metadataPath, {
      id: media.id,
      source: media.source,
      url: media.url,
      downloadUrl: media.downloadUrl,
      tags: media.tags,
      width: media.width,
      height: media.height,
      attribution: media.attribution,
      licenseUrl: media.licenseUrl,
      downloadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
  }

  private getExtension(url: string): string {
    const match = url.match(/\.(\w+)(\?|$)/);
    return match ? `.${match[1]}` : '.jpg';
  }
}
```

### 5.2 Parallel Download with Concurrency Control

```typescript
export async function downloadMediaBatch(
  mediaList: MediaAsset[],
  options: { maxConcurrent: number; onProgress?: (current: number, total: number) => void }
): Promise<string[]> {
  const downloader = new MediaDownloader();
  const results: string[] = [];
  let completed = 0;

  // Download in batches
  for (let i = 0; i < mediaList.length; i += options.maxConcurrent) {
    const batch = mediaList.slice(i, i + options.maxConcurrent);

    const batchResults = await Promise.all(
      batch.map(media => downloader.downloadMedia(media))
    );

    results.push(...batchResults);
    completed += batch.length;

    options.onProgress?.(completed, mediaList.length);
  }

  return results;
}
```

---

## 6. Video Handling Specifics

### 6.1 Video Validation

```typescript
export async function validateVideo(videoPath: string, options: VideoOptions): Promise<boolean> {
  // Use ffprobe to get video metadata
  const metadata = await getVideoMetadata(videoPath);

  // Check minimum duration
  if (metadata.duration < options.minDuration) {
    logger.warn(`Video too short: ${metadata.duration}s < ${options.minDuration}s`);
    return false;
  }

  // Check resolution
  if (metadata.width < 1080 || metadata.height < 1080) {
    logger.warn(`Video resolution too low: ${metadata.width}x${metadata.height}`);
    return false;
  }

  // Check aspect ratio compatibility
  const ratio = metadata.width / metadata.height;
  const targetRatio = options.aspectRatio === '16:9' ? 16/9 : 9/16;
  if (Math.abs(ratio - targetRatio) > 0.2) {
    logger.warn(`Video aspect ratio mismatch: ${ratio.toFixed(2)} vs ${targetRatio.toFixed(2)}`);
    // Still return true, we can crop/scale
  }

  return true;
}

async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  const { stdout } = await execAsync(
    `ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`
  );

  const data = JSON.parse(stdout);
  const videoStream = data.streams.find((s: any) => s.codec_type === 'video');

  return {
    duration: parseFloat(data.format.duration),
    width: videoStream.width,
    height: videoStream.height,
    fps: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
    codec: videoStream.codec_name,
  };
}
```

### 6.2 Video Preprocessing

```typescript
export async function preprocessVideo(
  videoPath: string,
  options: { aspectRatio: '16:9' | '9:16'; maxDuration?: number }
): Promise<string> {
  const outputPath = videoPath.replace(/(\.\w+)$/, '_processed$1');

  // Build ffmpeg command
  const commands: string[] = [];

  // 1. Crop/scale to target aspect ratio
  const targetRatio = options.aspectRatio === '16:9' ? '16:9' : '9:16';
  commands.push(`-vf "scale=iw*min(1920/iw\\,1080/ih):ih*min(1920/iw\\,1080/ih),crop=1920:1080"`);

  // 2. Trim if too long
  if (options.maxDuration) {
    commands.push(`-t ${options.maxDuration}`);
  }

  // 3. Mute audio
  commands.push('-an');

  // Execute ffmpeg
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  await execAsync(
    `ffmpeg -i "${videoPath}" ${commands.join(' ')} "${outputPath}"`
  );

  return outputPath;
}
```

---

## 7. Fallback Strategies

### 7.1 Insufficient Media Handling

```typescript
export function handleInsufficientMedia(
  availableMedia: MediaAsset[],
  targetCount: number,
  segmentDuration: number
): MediaAsset[] {
  if (availableMedia.length === 0) {
    throw new Error('No media available for segment. Check API keys and search tags.');
  }

  if (availableMedia.length < targetCount) {
    logger.warn(`Insufficient media: ${availableMedia.length} < ${targetCount}. Reusing with extended duration.`);

    // Reuse media with extended display duration
    const extended: MediaAsset[] = [];
    const extendedDuration = segmentDuration / targetCount;

    for (let i = 0; i < targetCount; i++) {
      const media = availableMedia[i % availableMedia.length];
      extended.push({
        ...media,
        displayDuration: extendedDuration,
      });
    }

    return extended;
  }

  return availableMedia;
}
```

### 7.2 Fallback to Generic Stock

```typescript
export async function fallbackToGenericStock(segment: ScriptSegment): Promise<MediaAsset[]> {
  // Ultra-generic fallback tags
  const genericTags = [
    'abstract background',
    'minimal design',
    'simple pattern',
    'solid color',
    'texture',
  ];

  const stockSearch = new StockMediaSearch(/* ... */);
  const images = await stockSearch.searchImages(genericTags, {
    aspectRatio: '16:9',
    perTag: 5,
  });

  if (images.length === 0) {
    throw new Error('Critical: Cannot find any stock media. Check API keys and internet connection.');
  }

  return images;
}
```

---

## Summary

This media pipeline implementation provides:

1. **Multi-service parallel search** across Pexels, Unsplash, and Pixabay
2. **Perceptual hash-based deduplication** (0.90 similarity threshold)
3. **Quality scoring formula**: Resolution (40%) + Aspect Ratio (30%) + Relevance (30%)
4. **Ranking algorithm**: Quality × 0.6 + Relevance × 0.4
5. **Fuzzy tag matching** with 0.7 minimum score
6. **Category-based fallbacks** for insufficient media
7. **Download caching** with 30-day expiry
8. **Video validation** and preprocessing with ffmpeg
9. **Graceful degradation** with multiple fallback strategies

All algorithms are optimized for:
- Performance (parallel searches, caching)
- Quality (deduplication, scoring)
- Reliability (fallbacks, error handling)
- Cost (free services only, caching)
