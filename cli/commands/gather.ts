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
import { TTSProviderFactory, generateWithFallback } from '../services/tts';
import { MusicServiceFactory } from '../services/music';
import { deduplicateImages, deduplicateVideos } from '../services/media/deduplication';
import { rankByQuality } from '../services/media/quality';
import { z } from 'zod';
import { extractVisualTagsPrompt, emphasisTaggingPrompt } from '../../config/prompts';

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
  images: Array<{ id: string; path: string; source: string; tags: string[]; metadata?: any }>;
  videos: Array<{
    id: string;
    path: string;
    source: string;
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

async function main(projectId?: string) {
  try {
    console.log('[GATHER] Starting asset gathering...');

    if (!projectId) {
      console.error('[GATHER] ✗ Error: Missing required argument --project <id>');
      console.log('[GATHER] Usage: npm run gather -- --project <project-id>');
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

    console.log(`[GATHER] Aspect ratio: ${videoConfig.defaultAspectRatio}`);
    console.log(`[GATHER] Music enabled: ${musicConfig.enabled}`);

    // Read script
    const scriptData = JSON.parse(await fs.readFile(scriptPath, 'utf-8'));
    console.log(`[GATHER] Processing ${scriptData.segments?.length || 0} script segment(s)`);

    if (!scriptData.segments || scriptData.segments.length === 0) {
      throw new Error('Script has no segments');
    }

    // Initialize services
    const aiProvider = await AIProviderFactory.getProviderWithFallback();
    const stockSearch = await MediaServiceFactory.getStockMediaSearch();
    const downloader = MediaServiceFactory.getMediaDownloader();
    const musicService = musicConfig.enabled ? await MusicServiceFactory.getMusicService() : null;

    const allTags: AssetTag[] = [];
    const manifest: AssetManifest = {
      images: [],
      videos: [],
      audio: [],
      music: [],
    };

    // Process each segment
    for (let i = 0; i < scriptData.segments.length; i++) {
      const segment = scriptData.segments[i];
      const segmentId = segment.id || `segment-${i + 1}`;

      console.log(`[GATHER] Processing segment ${i + 1}/${scriptData.segments.length}: ${segmentId}`);

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

      // 2. Search stock videos FIRST (Wave 2A.3)
      let videoAcquired = false;
      try {
        console.log(`[GATHER]   → Searching for videos...`);
        const videoResults = await stockSearch.searchVideos(
          tagResult.tags.map(t => t.tag),
          {
            perTag: stockConfig.providers?.pexels?.videoDefaults?.perPage || 5,
            orientation: videoConfig.defaultAspectRatio as '16:9' | '9:16',
            minDuration: stockConfig.providers?.pexels?.videoDefaults?.minDuration || 5,
          }
        );

        // Deduplicate and rank by quality
        const uniqueVideos = deduplicateVideos(videoResults);
        const rankedVideos = rankByQuality(uniqueVideos, {
          aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
          minQuality: stockConfig.qualityScoring?.minVideoQualityScore || 0.7,
        }).slice(0, 3); // Top 3 videos per segment

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
            console.log(`[GATHER]   → Downloading top ${Math.min(3, rankedVideos.length)} video(s)...`);

            // Track videos added for THIS segment
            const videosBeforeSegment = manifest.videos.length;

            for (const video of rankedVideos) {
              try {
                const { path: cachePath, metadata } = await downloader.downloadVideo(video);
                const filename = path.basename(cachePath);
                const projectVideoPath = path.join(paths.assetsVideos, filename);
                await fs.copyFile(cachePath, projectVideoPath);

                manifest.videos.push({
                  id: video.id,
                  path: projectVideoPath,
                  source: video.source,
                  tags: video.tags,
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

      // 3. Fall back to image search if video acquisition failed
      if (!videoAcquired) {
        console.log(`[GATHER]   → Searching for images (video fallback)...`);
        const imageResults = await stockSearch.searchImages(
          tagResult.tags.map(t => t.tag),
          {
            perTag: stockConfig.providers?.pexels?.searchDefaults?.perPage || 10,
            orientation: videoConfig.defaultAspectRatio as '16:9' | '9:16',
          }
        );

        // Deduplicate and rank
        const uniqueImages = deduplicateImages(imageResults);
        const rankedImages = rankByQuality(uniqueImages, {
          aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
          minQuality: stockConfig.qualityScoring?.minQualityScore || 0.6,
        }).slice(0, 5); // Top 5 images per segment

        console.log(`[GATHER]   → Found ${rankedImages.length} images`);

        // Download images
        for (const image of rankedImages) {
          try {
            const { path: cachePath, metadata } = await downloader.downloadImage(image);

            // Copy from cache to project assets directory
            const filename = path.basename(cachePath);
            const projectImagePath = path.join(paths.assetsImages, filename);
            await fs.copyFile(cachePath, projectImagePath);

            manifest.images.push({
              id: image.id,
              path: projectImagePath,
              source: image.source,
              tags: image.tags,
              metadata: metadata,
            });
          } catch (downloadError: any) {
            console.warn(`[GATHER]   ⚠ Failed to download image ${image.id}: ${downloadError.message}`);
          }
        }
      }

      // 4. Generate TTS audio for segment
      console.log(`[GATHER]   → Generating TTS audio...`);
      const { audio: ttsResult, provider: ttsProviderUsed } = await generateWithFallback(segment.text);
      const audioPath = path.join(paths.assetsAudio, `${segmentId}.mp3`);
      await fs.writeFile(audioPath, ttsResult.audioBuffer);
      console.log(`[GATHER]   → TTS generated using ${ttsProviderUsed}`);

      // 5. Detect emphasis for segment (Wave 2A.4)
      let emphasisData: EmphasisData[] = [];
      try {
        console.log(`[GATHER]   → Detecting emphasis...`);
        const emphasisPrompt = emphasisTaggingPrompt(segment.text);

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
        const wordCount = segment.text.split(/\s+/).filter(w => w.length > 0).length;

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
    if (musicService && musicConfig.enabled) {
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

    process.exit(0);
  } catch (error: any) {
    console.error('[GATHER] ✗ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const projectIdIndex = args.indexOf('--project');
const projectId = projectIdIndex !== -1 ? args[projectIdIndex + 1] : undefined;

// Run if called directly
if (require.main === module) {
  main(projectId);
}

export default main;
