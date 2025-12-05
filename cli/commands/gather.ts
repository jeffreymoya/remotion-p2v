#!/usr/bin/env node
/**
 * Stage 5: Asset Gathering
 *
 * Extracts tags, searches stock media, downloads music, generates TTS.
 * Outputs: tags.json, assets/images/*, assets/videos/*, assets/audio/*, assets/music/*
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env
import { ConfigManager } from '../lib/config';
import { getProjectPaths, ensureProjectDirs } from '../../src/lib/paths';
import { AIProviderFactory } from '../services/ai';
import { MediaServiceFactory } from '../services/media';
import { generateWithFallback } from '../services/tts';
import { MusicServiceFactory } from '../services/music';
import { deduplicateImages, deduplicateVideos } from '../services/media/deduplication';
import { rankByQuality } from '../services/media/quality';
import { z } from 'zod';
import { extractVisualTagsPrompt, emphasisTaggingPrompt } from '../../config/prompts';
import type { LocalMediaRepo } from '../services/media/local-repo';
import { processAspectRatio, CropConfig } from '../services/media/aspect-processor';
import type { AIProvider } from '../lib/types';
import { removeStageDirections } from '../../src/lib/utils';
import { WebScraperService } from '../services/media/web-scraper';
import { createGoogleSearchClient } from '../services/media/google-search';
import { ImageQualityValidator } from '../services/media/image-validator';
import type { QualityConfig } from '../lib/scraper-types';

export interface AssetTag {
  tag: string;
  segmentId: string;
  confidence: number;
}

export interface EmphasisData {
  wordIndex: number;
  level: 'med' | 'high';
  tone?: 'warm' | 'intense';
}

export interface AssetManifest {
  images: Array<{
    id: string;
    libraryId?: string;
    path: string;
    source: string;
    provider?: string;
    sourceUrl?: string;
    tags: string[];
    metadata?: any;
  }>;
  videos: Array<{
    id: string;
    libraryId?: string;
    path: string;
    source: string;
    provider?: string;
    sourceUrl?: string;
    tags: string[];
    width: number;
    height: number;
    duration: number;
    metadata?: any;
  }>;
  audio: Array<{
    id: string;
    path: string;
    segmentId: string;
    durationMs: number;
    wordTimestamps?: Array<{ word: string; startMs: number; endMs: number }>;
    emphasis?: EmphasisData[];
  }>;
  music: Array<{ id: string; path: string; source: string; genre: string }>;
}

export interface GatherOutput {
  tags: AssetTag[];
  manifest: AssetManifest;
  gatheredAt: string;
}

// Schema for tag extraction
const TagExtractionSchema = z.object({
  tags: z.array(z.object({
    tag: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

const EmphasisSchema = z.object({
  emphases: z.array(z.object({
    wordIndex: z.number().int().nonnegative(),
    level: z.enum(['med', 'high']),
    tone: z.enum(['warm', 'intense']).optional(),
  }))
});

// Alternative schema for prompts that return "emphasisTags" instead of "emphases"
const EmphasisResponseSchema = z.object({
  emphasisTags: z.array(z.object({
    wordIndex: z.number().int().nonnegative(),
    level: z.enum(['med', 'high']),
    tone: z.enum(['warm', 'intense']).optional(),
  }))
});

/**
 * Validates and enforces emphasis constraints
 * - Total emphasis count ≤ 20% of word count
 * - High emphasis count ≤ 5% of word count
 * - No consecutive high-emphasis words (enforce 2+ word gap)
 */
function validateEmphasisConstraints(
  emphases: EmphasisData[],
  wordCount: number
): EmphasisData[] {
  if (emphases.length === 0) return emphases;

  const maxTotal = Math.ceil(wordCount * 0.20); // 20% total
  const maxHigh = Math.ceil(wordCount * 0.05);  // 5% high

  // Sort by wordIndex
  const sorted = [...emphases].sort((a, b) => a.wordIndex - b.wordIndex);

  // Filter out emphases exceeding 20% total cap
  let filtered = sorted.slice(0, maxTotal);

  // Enforce high emphasis cap (5%)
  const highEmphases = filtered.filter(e => e.level === 'high');
  if (highEmphases.length > maxHigh) {
    // Keep first maxHigh high-emphasis words, convert rest to med
    const keptHigh = new Set(highEmphases.slice(0, maxHigh).map(e => e.wordIndex));
    filtered = filtered.map(e => {
      if (e.level === 'high' && !keptHigh.has(e.wordIndex)) {
        return { ...e, level: 'med' as const };
      }
      return e;
    });
  }

  // Enforce 2-word gap between high-emphasis words (at least 2 words in between)
  const finalFiltered: EmphasisData[] = [];
  let lastHighIndex = -4; // Start at -4 so first word can be high (0 - (-4) = 4 >= 3)

  for (const emphasis of filtered) {
    if (emphasis.level === 'high') {
      if (emphasis.wordIndex - lastHighIndex >= 3) {
        finalFiltered.push(emphasis);
        lastHighIndex = emphasis.wordIndex;
      } else {
        // Too close to previous high, convert to med
        finalFiltered.push({ ...emphasis, level: 'med' });
      }
    } else {
      finalFiltered.push(emphasis);
    }
  }

  return finalFiltered;
}

const DEFAULT_CROP_CONFIG: CropConfig = {
  safePaddingPercent: 10,
  maxAspectDelta: 0.3,
  targetWidth: 1920,
  targetHeight: 1080,
};

function getCropConfig(stockConfig: any): CropConfig {
  const cfg = (stockConfig as any)?.cropConfig;
  if (
    cfg &&
    typeof cfg.safePaddingPercent === 'number' &&
    typeof cfg.maxAspectDelta === 'number' &&
    typeof cfg.targetWidth === 'number' &&
    typeof cfg.targetHeight === 'number'
  ) {
    return cfg as CropConfig;
  }
  return DEFAULT_CROP_CONFIG;
}

function getDesiredAspectRatio(defaultAspect: string, videoConfig: any, stockConfig: any): number | undefined {
  const aspectFromVideo = videoConfig.aspectRatios?.[defaultAspect];
  if (aspectFromVideo?.width && aspectFromVideo?.height) {
    return aspectFromVideo.width / aspectFromVideo.height;
  }

  const aspectFromStock = stockConfig.aspectRatios?.[defaultAspect];
  if (aspectFromStock?.width && aspectFromStock?.height) {
    return aspectFromStock.width / aspectFromStock.height;
  }

  const parts = defaultAspect.split(':').map(Number);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return parts[0] / parts[1];
  }

  return undefined;
}

function buildImageMetadata(width: number, height: number, cropConfig: CropConfig) {
  const crop = processAspectRatio(width, height, cropConfig);
  return {
    width,
    height,
    mode: crop.mode,
    scale: crop.scale,
    cropX: crop.x,
    cropY: crop.y,
    cropWidth: crop.width,
    cropHeight: crop.height,
  };
}

function buildVideoMetadata(width: number, height: number, durationSeconds: number, cropConfig: CropConfig) {
  return {
    ...buildImageMetadata(width, height, cropConfig),
    duration: durationSeconds,
  };
}

function mergeTags(...sources: string[][]): string[] {
  const merged = new Set<string>();
  for (const list of sources) {
    for (const tag of list) {
      if (tag) merged.add(tag);
    }
  }
  return Array.from(merged);
}

async function main(projectId?: string, preview = false, scrape = false) {
  let localRepo: LocalMediaRepo | null = null;
  try {
    console.log('[GATHER] Starting asset gathering...');
    const isLibraryTestMode = process.env.STOCK_LIBRARY_TEST_MODE === '1';
    const disableOnlineSearch = process.env.LOCAL_LIBRARY_DISABLE_ONLINE === '1';

    if (!projectId) {
      console.error('[GATHER] ✗ Error: Missing required argument --project <id>');
      console.log('[GATHER] Usage: npm run gather -- --project <project-id> [--preview] [--scrape]');
      console.log('[GATHER] ');
      console.log('[GATHER] Options:');
      console.log('[GATHER]   --project <id>  Project ID (required)');
      console.log('[GATHER]   --preview        Process only first 3 segments');
      console.log('[GATHER]   --scrape         Enable strict web scraping (no fallback to stock media)');
      console.log('[GATHER] ');
      process.exit(1);
    }

    const paths = getProjectPaths(projectId);
    await ensureProjectDirs(projectId);

    // Check if script exists
    const scriptPath = path.join(paths.scripts, 'script-v1.json');
    const scriptExists = await fs.access(scriptPath).then(() => true).catch(() => false);
    if (!scriptExists) {
      console.error(`[GATHER] ✗ Error: script not found at ${scriptPath}`);
      console.log('[GATHER] Please run: npm run script');
      process.exit(1);
    }

    // Load configuration
    const videoConfig = await ConfigManager.loadVideoConfig();
    const stockConfig = await ConfigManager.loadStockAssetsConfig();
    const musicConfig = await ConfigManager.loadMusicConfig();
    const localLibraryConfig = stockConfig.localLibrary;
    const cropConfig = getCropConfig(stockConfig);
    const desiredAspectRatio = getDesiredAspectRatio(
      videoConfig.defaultAspectRatio,
      videoConfig,
      stockConfig
    );

    console.log(`[GATHER] Aspect ratio: ${videoConfig.defaultAspectRatio}`);
    console.log(`[GATHER] Music enabled: ${musicConfig.enabled}`);

    // Validate --scrape requirements early
    if (scrape) {
      console.log('[GATHER] Scrape mode: ENABLED (strict mode - no fallback to stock media)');

      const missingRequirements: string[] = [];

      if (!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY) {
        missingRequirements.push('GOOGLE_CUSTOM_SEARCH_API_KEY');
      }
      if (!process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
        missingRequirements.push('GOOGLE_CUSTOM_SEARCH_ENGINE_ID');
      }

      // Check if Gemini provider is configured
      try {
        const geminiConfig = await ConfigManager.getAIProvider('gemini');
        if (!geminiConfig || !geminiConfig.name) {
          missingRequirements.push('Gemini AI provider configuration');
        }
      } catch (error) {
        missingRequirements.push('Gemini AI provider configuration');
      }

      if (missingRequirements.length > 0) {
        console.error('[GATHER] ✗ Error: Missing required configuration for --scrape mode');
        console.error('[GATHER] ');
        console.error('[GATHER] Missing:');
        for (const req of missingRequirements) {
          console.error(`[GATHER]   - ${req}`);
        }
        console.error('[GATHER] ');
        console.error('[GATHER] Please configure these settings before using --scrape.');
        console.error('[GATHER] See .env.example for configuration details.');
        console.error('[GATHER] ');
        process.exit(1);
      }
    } else {
      console.log('[GATHER] Scrape mode: DISABLED (stock media APIs will be used)');
    }

    // Read script
    const scriptData = JSON.parse(await fs.readFile(scriptPath, 'utf-8'));

    // Preview mode configuration
    const PREVIEW_SEGMENT_LIMIT = 3;
    const PREVIEW_VIDEO_LIMIT = 1;
    const PREVIEW_IMAGE_LIMIT = 2;

    const totalSegments = scriptData.segments?.length || 0;
    const segmentsToProcess = preview ? Math.min(totalSegments, PREVIEW_SEGMENT_LIMIT) : totalSegments;

    if (preview) {
      console.log(`[GATHER] Preview mode: processing first ${segmentsToProcess} segment(s)...`);
    }
    console.log(`[GATHER] Processing ${segmentsToProcess} of ${totalSegments} script segment(s)`);

    if (!scriptData.segments || scriptData.segments.length === 0) {
      throw new Error('Script has no segments');
    }

    // Initialize services
    const aiProvider = isLibraryTestMode ? createMockAIProvider() : await AIProviderFactory.getProviderWithFallback();
    const stockSearch = disableOnlineSearch
      ? createOfflineStockSearch()
      : await MediaServiceFactory.getStockMediaSearch();
    const downloader = MediaServiceFactory.getMediaDownloader();
    const musicService = musicConfig.enabled ? await MusicServiceFactory.getMusicService() : null;
    if (localLibraryConfig.enabled) {
      localRepo = MediaServiceFactory.getLocalMediaRepo({
        preferRecencyBoost: localLibraryConfig.preferRecencyBoost,
        semanticEnabled: localLibraryConfig.semantic?.enabled,
        semanticMinScore: localLibraryConfig.semantic?.minScore,
        semanticCandidateLimit: localLibraryConfig.semantic?.candidateLimit,
        semanticDimensions: localLibraryConfig.semantic?.dimensions,
        optimizeImages: localLibraryConfig.optimization?.images?.enabled,
        optimizeMinSavingsPercent: localLibraryConfig.optimization?.images?.minSavingsPercent,
      });
      await localRepo.ensureAvailable();
      console.log(
        `[GATHER] Local library enabled (minMatches videos=${localLibraryConfig.minMatches.videos}, images=${localLibraryConfig.minMatches.images})`
      );
    } else {
      console.log('[GATHER] Local library disabled via config');
    }

    // Initialize web scraper if scrape mode enabled
    let webScraper: WebScraperService | null = null;
    if (scrape) {
      try {
        console.log('[GATHER] Initializing web scraper (strict mode)...');

        // Import GeminiCLIProvider for web scraper
        const { GeminiCLIProvider } = await import('../services/ai/gemini-cli');
        const geminiConfig = await ConfigManager.getAIProvider('gemini');
        const geminiProvider = new GeminiCLIProvider(geminiConfig);

        // Create Google Search client
        const googleClient = createGoogleSearchClient();

        // Create quality config from stock config
        const webScrapeConfig = (stockConfig as any).webScrape;
        const qualityConfig: QualityConfig = {
          minWidth: webScrapeConfig.quality.minWidth,
          minHeight: webScrapeConfig.quality.minHeight,
          maxWidth: webScrapeConfig.quality.maxWidth,
          maxHeight: webScrapeConfig.quality.maxHeight,
          allowedFormats: webScrapeConfig.quality.allowedFormats,
          minSizeBytes: webScrapeConfig.quality.minSizeBytes,
          maxSizeBytes: webScrapeConfig.quality.maxSizeBytes,
          aspectRatios: {
            target: webScrapeConfig.quality.aspectRatio.target,
            tolerance: webScrapeConfig.quality.aspectRatio.tolerance,
          },
        };

        // Create image validator
        const imageValidator = new ImageQualityValidator(qualityConfig);

        // Create web scraper service
        webScraper = new WebScraperService(
          geminiProvider,
          googleClient,
          imageValidator,
          qualityConfig
        );

        console.log('[GATHER] ✓ Web scraper initialized successfully (strict mode enabled)');
      } catch (error: any) {
        // STRICT MODE: Fail immediately, no fallback
        console.error('[GATHER] ✗ Fatal: Failed to initialize web scraper in strict mode');
        console.error(`[GATHER] Error: ${error.message}`);
        console.error('[GATHER] ');
        console.error('[GATHER] When using --scrape, web scraper initialization must succeed.');
        console.error('[GATHER] Please check:');
        console.error('[GATHER]   - GOOGLE_CUSTOM_SEARCH_API_KEY is set');
        console.error('[GATHER]   - GOOGLE_CUSTOM_SEARCH_ENGINE_ID is set');
        console.error('[GATHER]   - Gemini AI provider credentials are configured');
        console.error('[GATHER]   - Internet connectivity is available');
        console.error('[GATHER] ');

        if (error.stack) {
          console.error('[GATHER] Stack trace:');
          console.error(error.stack);
        }

        await localRepo?.dispose();
        process.exit(1);
      }
    }

    const allTags: AssetTag[] = [];
    const manifest: AssetManifest = {
      images: [],
      videos: [],
      audio: [],
      music: [],
    };

    // Process each segment
    for (let i = 0; i < segmentsToProcess; i++) {
      const segment = scriptData.segments[i];
      const segmentId = segment.id || `segment-${i + 1}`;

      console.log(`[GATHER] Processing segment ${i + 1}/${segmentsToProcess}: ${segmentId}`);

      // 1. Extract tags from segment text using AI
      const prompt = extractVisualTagsPrompt({
        segmentText: segment.text,
        minTags: 3,
        maxTags: 5,
        mediaType: 'both',
      });

      const tagResult = await aiProvider.structuredComplete(prompt, TagExtractionSchema);

      for (const tagItem of tagResult.tags) {
        allTags.push({
          tag: tagItem.tag,
          segmentId,
          confidence: tagItem.confidence,
        });
      }

      console.log(`[GATHER]   → Extracted ${tagResult.tags.length} tags: ${tagResult.tags.map(t => t.tag).join(', ')}`);

      const segmentTags = tagResult.tags.map(t => t.tag);

      // 2. Local library lookup for videos first
      let videoAcquired = false;
      let imagesAcquired = false;

      const minDurationSeconds = stockConfig.providers?.pexels?.videoDefaults?.minDuration;
      const minDurationMs = typeof minDurationSeconds === 'number' ? minDurationSeconds * 1000 : undefined;

      if (localRepo && localLibraryConfig.enabled) {
        try {
          console.log('[GATHER]   → Checking local library for videos...');
          const maxVideos = preview ? PREVIEW_VIDEO_LIMIT : localLibraryConfig.limit.videos;
          const localVideos = await localRepo.searchVideos(segmentTags, {
            minWidth: stockConfig.providers?.pexels?.videoDefaults?.minWidth,
            minHeight: stockConfig.providers?.pexels?.videoDefaults?.minHeight,
            minDurationMs,
            desiredAspectRatio,
            maxResults: maxVideos,
            preferRecencyBoost: localLibraryConfig.preferRecencyBoost,
          });

          const videosToUse = localVideos.slice(0, maxVideos);
          if (videosToUse.length > 0) {
            const usedIds: string[] = [];
            for (const video of videosToUse) {
              try {
                const destPath = path.join(paths.assetsVideos, path.basename(video.path));
                await fs.copyFile(video.path, destPath);
                const durationSeconds = Number((video.durationMs / 1000).toFixed(2));
                manifest.videos.push({
                  id: video.id,
                  libraryId: video.id,
                  path: destPath,
                  source: 'local-library',
                  provider: video.provider,
                  sourceUrl: video.sourceUrl ?? undefined,
                  tags: video.tags,
                  width: video.width,
                  height: video.height,
                  duration: durationSeconds,
                  metadata: buildVideoMetadata(video.width, video.height, durationSeconds, cropConfig),
                });
                usedIds.push(video.id);
              } catch (copyError: any) {
                console.warn(`[GATHER]   ⚠ Failed to reuse local video ${video.id}: ${copyError.message}`);
              }
            }

            if (usedIds.length > 0) {
              await localRepo.markUsed(usedIds, 'video');
              if (usedIds.length >= localLibraryConfig.minMatches.videos) {
                videoAcquired = true;
                console.log(`[GATHER]   ✓ Reused ${usedIds.length} video(s) from local library`);
              } else {
                console.log(`[GATHER]   → Reused ${usedIds.length} local video(s); searching online for more`);
              }
            }
          }
        } catch (error: any) {
          console.warn(`[GATHER]   ⚠ Local video search failed: ${error.message}`);
        }
      }

      // 2b. Search stock videos if local library didn't meet threshold
      if (!videoAcquired) {
        try {
          if (disableOnlineSearch) {
            throw new Error('Online video search disabled via LOCAL_LIBRARY_DISABLE_ONLINE');
          }
          console.log(`[GATHER]   → Searching for videos...`);
          const videoResults = await stockSearch.searchVideos(
            segmentTags,
            {
              perTag: stockConfig.providers?.pexels?.videoDefaults?.perPage || 5,
              orientation: videoConfig.defaultAspectRatio as '16:9' | '9:16',
              minDuration: stockConfig.providers?.pexels?.videoDefaults?.minDuration || 5,
            }
          );

          // Deduplicate and rank by quality
          const maxVideos = preview ? PREVIEW_VIDEO_LIMIT : 3;
          const uniqueVideos = deduplicateVideos(videoResults);
          const rankedVideos = rankByQuality(uniqueVideos, {
            aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
            minQuality: stockConfig.qualityScoring?.minVideoQualityScore || 0.7,
          }).slice(0, maxVideos); // Top N videos per segment

          console.log(`[GATHER]   → Found ${rankedVideos.length} videos (quality threshold: ${stockConfig.qualityScoring?.minVideoQualityScore || 0.7})`);

          // Download videos if quality threshold met
          if (rankedVideos.length > 0) {
            const topVideo = rankedVideos[0];

            // Calculate quality score to check threshold
            const qualityScore = rankByQuality([topVideo], {
              aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
              minQuality: 0,
            });

            if (qualityScore.length > 0) {
              console.log(`[GATHER]   → Downloading top ${Math.min(maxVideos, rankedVideos.length)} video(s)...`);

              // Track videos added for THIS segment
              const videosBeforeSegment = manifest.videos.length;

              for (const video of rankedVideos) {
                try {
                  const { path: cachePath, metadata } = await downloader.downloadVideo(video);
                  const filename = path.basename(cachePath);
                  const projectVideoPath = path.join(paths.assetsVideos, filename);
                  await fs.copyFile(cachePath, projectVideoPath);

                  let libraryId: string | undefined;
                  if (localRepo && localLibraryConfig.enabled) {
                    try {
                      const ingested = await localRepo.ingestDownloaded(
                        { path: cachePath, type: 'video' },
                        mergeTags(video.tags, segmentTags),
                        video.source,
                        video.url
                      );
                      libraryId = ingested.id;
                      await localRepo.markUsed([ingested.id], 'video');
                    } catch (ingestError: any) {
                      console.warn(`[GATHER]   ⚠ Failed to ingest video ${video.id} into local library: ${ingestError.message}`);
                    }
                  }

                  manifest.videos.push({
                    id: video.id,
                    libraryId,
                    path: projectVideoPath,
                    source: video.source,
                    provider: video.source,
                    sourceUrl: video.url,
                    tags: mergeTags(video.tags, segmentTags),
                    width: video.width,
                    height: video.height,
                    duration: video.duration,
                    metadata: metadata,
                  });

                  console.log(`[GATHER]   → Downloaded video: ${video.id} (${video.width}x${video.height}, ${video.duration}s)`);
                } catch (downloadError: any) {
                  console.warn(`[GATHER]   ⚠ Failed to download video ${video.id}: ${downloadError.message}`);
                }
              }

              // Check if THIS segment acquired videos (not global count)
              const segmentVideoCount = manifest.videos.length - videosBeforeSegment;
              if (segmentVideoCount > 0) {
                videoAcquired = true;
                console.log(`[GATHER]   ✓ Acquired ${segmentVideoCount} video(s) for this segment, skipping image search`);
              }
            }
          }
        } catch (videoError: any) {
          console.warn(`[GATHER]   ⚠ Video search failed: ${videoError.message}`);
          console.log(`[GATHER]   → Falling back to image search`);
        }
      }

      // 3. Fall back to image search if video acquisition failed
      if (!videoAcquired) {
        if (localRepo && localLibraryConfig.enabled) {
          try {
            console.log('[GATHER]   → Checking local library for images...');
            const maxImages = preview ? PREVIEW_IMAGE_LIMIT : localLibraryConfig.limit.images;
            const localImages = await localRepo.searchImages(segmentTags, {
              minWidth: stockConfig.providers?.pexels?.searchDefaults?.minWidth,
              minHeight: stockConfig.providers?.pexels?.searchDefaults?.minHeight,
              desiredAspectRatio,
              maxResults: maxImages,
              preferRecencyBoost: localLibraryConfig.preferRecencyBoost,
            });

            const imagesToUse = localImages.slice(0, maxImages);
            if (imagesToUse.length > 0) {
              const usedIds: string[] = [];
              for (const image of imagesToUse) {
                try {
                  const destPath = path.join(paths.assetsImages, path.basename(image.path));
                  await fs.copyFile(image.path, destPath);
                  manifest.images.push({
                    id: image.id,
                    libraryId: image.id,
                    path: destPath,
                    source: 'local-library',
                    provider: image.provider,
                    sourceUrl: image.sourceUrl ?? undefined,
                    tags: image.tags,
                    metadata: buildImageMetadata(image.width, image.height, cropConfig),
                  });
                  usedIds.push(image.id);
                } catch (copyError: any) {
                  console.warn(`[GATHER]   ⚠ Failed to reuse local image ${image.id}: ${copyError.message}`);
                }
              }

              if (usedIds.length > 0) {
                await localRepo.markUsed(usedIds, 'image');
                if (usedIds.length >= localLibraryConfig.minMatches.images) {
                  imagesAcquired = true;
                  console.log(`[GATHER]   ✓ Reused ${usedIds.length} image(s) from local library`);
                } else {
                  console.log(`[GATHER]   → Reused ${usedIds.length} local image(s); searching online for more`);
                }
              }
            }
          } catch (error: any) {
            console.warn(`[GATHER]   ⚠ Local image search failed: ${error.message}`);
          }
        }

        if (!imagesAcquired) {
          // Web scraping path (STRICT MODE)
          if (scrape && webScraper) {
            console.log('[GATHER]   → Searching web for images (strict scrape mode)...');

            try {
              // Define search options
              const webScrapeConfig = (stockConfig as any).webScrape;
              const imageSearchOptions = {
                targetCount: webScrapeConfig?.candidateCount?.target || 5,
                maxAttempts: webScrapeConfig?.candidateCount?.maxAttempts || 10,
                timeout: webScrapeConfig?.download?.totalOperationTimeoutMs || 120000,
              };

              // Search returns already-downloaded and validated candidates
              const candidates = await webScraper.searchImagesForScene(
                segment.text,
                segmentTags,
                imageSearchOptions
              );

              const minCandidatesForSuccess = webScrapeConfig?.search?.minCandidatesForSuccess || 3;

              if (candidates.length < minCandidatesForSuccess) {
                // STRICT MODE: Fail immediately on insufficient candidates
                throw new Error(
                  `Insufficient candidates: found ${candidates.length}, need ${minCandidatesForSuccess}+ ` +
                  `(segment ${i + 1}/${segmentsToProcess}: "${segmentId}")`
                );
              }

              // Define selection criteria
              const selectionCriteria = {
                sceneRelevance: webScrapeConfig?.selection?.weights?.sceneRelevance || 0.4,
                technicalQuality: webScrapeConfig?.selection?.weights?.technicalQuality || 0.3,
                aestheticAppeal: webScrapeConfig?.selection?.weights?.aestheticAppeal || 0.2,
                aspectRatioMatch: webScrapeConfig?.selection?.weights?.aspectRatioMatch || 0.1,
              };

              const bestImage = await webScraper.selectBestImage(
                candidates,
                segment.text,
                selectionCriteria
              );

              // Copy from cache to project (already downloaded during search)
              const projectImagePath = path.join(paths.assetsImages, path.basename(bestImage.downloadedPath!));
              await fs.copyFile(bestImage.downloadedPath!, projectImagePath);

              // Skip local library ingestion for scraped images (project-specific only)
              manifest.images.push({
                id: bestImage.id,
                path: projectImagePath,
                source: 'web-scrape',
                provider: 'gemini-search',
                sourceUrl: bestImage.sourceUrl,
                tags: mergeTags(bestImage.tags, segmentTags),
                metadata: bestImage.metadata,
              });

              imagesAcquired = true;
              console.log(`[GATHER]   ✓ Downloaded scraped image: ${bestImage.url}`);
            } catch (scrapeError: any) {
              // STRICT MODE: Fail immediately, no fallback
              console.error(`[GATHER] ✗ Fatal: Web scraping failed for segment ${i + 1}/${segmentsToProcess}`);
              console.error(`[GATHER] Segment ID: ${segmentId}`);
              console.error(`[GATHER] Segment text: "${segment.text.substring(0, 100)}${segment.text.length > 100 ? '...' : ''}"`);
              console.error(`[GATHER] Error: ${scrapeError.message}`);
              console.error('[GATHER] ');
              console.error('[GATHER] In strict scrape mode (--scrape), all segments must succeed.');
              console.error('[GATHER] No fallback to stock media APIs is allowed.');
              console.error('[GATHER] ');
              console.error('[GATHER] Possible solutions:');
              console.error('[GATHER]   1. Check your internet connection');
              console.error('[GATHER]   2. Verify Google Custom Search API quota');
              console.error('[GATHER]   3. Retry the command (temporary network issues)');
              console.error('[GATHER]   4. Run without --scrape to use stock media fallback');
              console.error('[GATHER] ');

              if (scrapeError.stack) {
                console.error('[GATHER] Stack trace:');
                console.error(scrapeError.stack);
              }

              await localRepo?.dispose();
              process.exit(1);
            }
          }

          // Stock media search path (ONLY when NOT in scrape mode)
          if (!imagesAcquired && !scrape) {
            if (disableOnlineSearch) {
              throw new Error('Online image search disabled via LOCAL_LIBRARY_DISABLE_ONLINE');
            }
            console.log(`[GATHER]   → Searching for images (video fallback)...`);
            const imageResults = await stockSearch.searchImages(
              segmentTags,
              {
                perTag: stockConfig.providers?.pexels?.searchDefaults?.perPage || 10,
                orientation: videoConfig.defaultAspectRatio as '16:9' | '9:16',
              }
            );

            // Deduplicate and rank
            const maxImages = preview ? PREVIEW_IMAGE_LIMIT : 5;
            const uniqueImages = deduplicateImages(imageResults);
            const rankedImages = rankByQuality(uniqueImages, {
              aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
              minQuality: stockConfig.qualityScoring?.minQualityScore || 0.6,
            }).slice(0, maxImages); // Top N images per segment

            console.log(`[GATHER]   → Found ${rankedImages.length} images`);

            // Download images
            for (const image of rankedImages) {
              try {
                const { path: cachePath, metadata } = await downloader.downloadImage(image);

                // Copy from cache to project assets directory
                const filename = path.basename(cachePath);
                const projectImagePath = path.join(paths.assetsImages, filename);
                await fs.copyFile(cachePath, projectImagePath);

                let libraryId: string | undefined;
                if (localRepo && localLibraryConfig.enabled) {
                  try {
                    const ingested = await localRepo.ingestDownloaded(
                      { path: cachePath, type: 'image' },
                      mergeTags(image.tags, segmentTags),
                      image.source,
                      image.url
                    );
                    libraryId = ingested.id;
                    await localRepo.markUsed([ingested.id], 'image');
                  } catch (ingestError: any) {
                    console.warn(`[GATHER]   ⚠ Failed to ingest image ${image.id} into local library: ${ingestError.message}`);
                  }
                }

                manifest.images.push({
                  id: image.id,
                  libraryId,
                  path: projectImagePath,
                  source: image.source,
                  provider: image.source,
                  sourceUrl: image.url,
                  tags: mergeTags(image.tags, segmentTags),
                  metadata: metadata,
                });
              } catch (downloadError: any) {
                console.warn(`[GATHER]   ⚠ Failed to download image ${image.id}: ${downloadError.message}`);
              }
            }
          }

          // STRICT MODE: If we're in scrape mode and still no images, something went wrong
          if (!imagesAcquired && scrape) {
            console.error('[GATHER] ✗ Fatal: Failed to acquire images in strict scrape mode');
            console.error(`[GATHER] Segment ${i + 1}/${segmentsToProcess}: ${segmentId}`);
            await localRepo?.dispose();
            process.exit(1);
          }
        }
      }

      // 4. Generate TTS audio for segment
      console.log(`[GATHER]   → Generating TTS audio...`);

      // Filter stage directions before TTS
      const cleanedText = removeStageDirections(segment.text);
      console.log(`[GATHER]   → Cleaned text: "${cleanedText.substring(0, 80)}${cleanedText.length > 80 ? '...' : ''}"`);

      const ttsGenerator = isLibraryTestMode ? generateStubTTS : generateWithFallback;
      const { audio: ttsResult, provider: ttsProviderUsed } = await ttsGenerator(cleanedText);
      const audioPath = path.join(paths.assetsAudio, `${segmentId}.mp3`);
      await fs.writeFile(audioPath, ttsResult.audioBuffer);
      console.log(`[GATHER]   → TTS generated using ${ttsProviderUsed}`);

      // 5. Detect emphasis for segment (Wave 2A.4)
      let emphasisData: EmphasisData[] = [];
      try {
        console.log(`[GATHER]   → Detecting emphasis...`);
        const emphasisPrompt = emphasisTaggingPrompt(cleanedText);

        // Try to get emphasis from AI
        const emphasisResult = await aiProvider.structuredComplete(
          emphasisPrompt,
          EmphasisResponseSchema
        );

        // Convert emphasisTags to emphases format
        const rawEmphases: EmphasisData[] = emphasisResult.emphasisTags.map(tag => ({
          wordIndex: tag.wordIndex,
          level: tag.level,
          tone: tag.tone,
        }));

        // Count words in segment
        const wordCount = cleanedText.split(/\s+/).filter(w => w.length > 0).length;

        // Validate and enforce constraints
        emphasisData = validateEmphasisConstraints(rawEmphases, wordCount);

        const highCount = emphasisData.filter(e => e.level === 'high').length;
        const medCount = emphasisData.filter(e => e.level === 'med').length;
        console.log(`[GATHER]   → Emphasis detected: ${emphasisData.length} total (${highCount} high, ${medCount} med) from ${wordCount} words`);
      } catch (error: any) {
        // Graceful degradation: continue without emphasis if detection fails
        console.warn(`[GATHER]   ⚠ Emphasis detection failed: ${error.message}`);
        console.log(`[GATHER]   → Continuing without emphasis data`);
        emphasisData = [];
      }

      manifest.audio.push({
        id: segmentId,
        path: audioPath,
        segmentId,
        durationMs: ttsResult.durationMs,
        wordTimestamps: ttsResult.timestamps?.map(ts => ({
          word: ts.word,
          startMs: ts.startMs,
          endMs: ts.endMs,
        })),
        emphasis: emphasisData.length > 0 ? emphasisData : undefined,
      });

      console.log(`[GATHER]   → Generated audio: ${ttsResult.durationMs}ms`);
    }

    // 6. Download background music if enabled
    if (musicService && musicConfig.enabled && !preview) {
      console.log('[GATHER] Searching for background music...');

      const totalDuration = manifest.audio.reduce((sum, a) => sum + a.durationMs, 0) / 1000;
      const musicTrack = await musicService.getDefaultMusic(totalDuration);

      if (musicTrack) {
        console.log(`[GATHER]   → Found music: ${musicTrack.title}`);
        const musicPath = path.join(paths.assetsMusic, 'background.mp3');

        if (musicTrack.source === 'local') {
          // Copy from local library
          await fs.copyFile(musicTrack.url, musicPath);
        } else {
          // Download from Pixabay
          const localPath = await downloader.downloadMusic(musicTrack);
          await fs.copyFile(localPath, musicPath);
        }

        manifest.music.push({
          id: musicTrack.id,
          path: musicPath,
          source: musicTrack.source,
          genre: musicTrack.mood || 'unknown',
        });
      } else {
        console.log('[GATHER]   ⚠ No suitable music found');
      }
    }

    if (preview) {
      console.log('[GATHER] Preview mode: skipping music gathering');
    }

    // Write output
    const output: GatherOutput = {
      tags: allTags,
      manifest,
      gatheredAt: new Date().toISOString(),
    };

    await fs.writeFile(
      paths.tags,
      JSON.stringify(output, null, 2),
      'utf-8'
    );

    console.log(`[GATHER] ✓ Extracted ${output.tags.length} tag(s)`);
    console.log(`[GATHER] ✓ Images: ${output.manifest.images.length}`);
    console.log(`[GATHER] ✓ Videos: ${output.manifest.videos.length}`);
    console.log(`[GATHER] ✓ Audio: ${output.manifest.audio.length}`);
    console.log(`[GATHER] ✓ Music: ${output.manifest.music.length}`);
    console.log(`[GATHER] ✓ Output: ${paths.tags}`);

    if (preview) {
      console.log(`[GATHER] Preview mode: processed ${segmentsToProcess} of ${totalSegments} segments`);
    }

    await localRepo?.dispose();
    process.exit(0);
  } catch (error: any) {
    console.error('[GATHER] ✗ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await localRepo?.dispose();
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const projectIdIndex = args.indexOf('--project');
// Support both --project <id> and positional argument <id>
let projectId = projectIdIndex !== -1 ? args[projectIdIndex + 1] : undefined;
if (!projectId && args.length > 0 && !args[0].startsWith('--')) {
  // First positional argument is project ID
  projectId = args[0];
}
const preview = args.includes('--preview');
const scrape = args.includes('--scrape');

function createMockAIProvider(): AIProvider {
  return {
    name: 'mock-ai',
    complete: async (prompt: string) => `mock:${prompt}`,
    structuredComplete: async <T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> => {
      const words = prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

      if ((schema as any).shape?.tags) {
        const unique = Array.from(new Set(words));
        const selected = unique.slice(0, Math.max(3, Math.min(5, unique.length)));
        const payload: any = {
          tags: selected.map((tag, idx) => ({ tag, confidence: Math.max(0.5, 1 - idx * 0.1) })),
        };
        return schema.parse(payload);
      }

      if ((schema as any).shape?.emphasisTags) {
        return schema.parse({ emphasisTags: [] } as any);
      }

      return schema.parse({} as any);
    },
  };
}

function createOfflineStockSearch() {
  const error = new Error('Online stock search disabled via LOCAL_LIBRARY_DISABLE_ONLINE');
  return {
    searchImages: async () => { throw error; },
    searchVideos: async () => { throw error; },
  };
}

async function generateStubTTS(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const timestamps = words.map((word, idx) => {
    const startMs = idx * 180;
    return { word, startMs, endMs: startMs + 180 };
  });
  const durationMs = timestamps.length ? timestamps[timestamps.length - 1].endMs : 1000;
  return {
    audio: {
      audioBuffer: Buffer.from('mock-tts-audio'),
      durationMs,
      timestamps,
    },
    provider: 'mock-tts',
  };
}

// Run if called directly
if (require.main === module) {
  main(projectId, preview, scrape);
}

export default main;
