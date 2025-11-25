#!/usr/bin/env node
/**
 * Stage 5: Asset Gathering
 *
 * Extracts tags, searches stock media, downloads music, generates TTS.
 * Outputs: tags.json, assets/images/*, assets/videos/*, assets/audio/*, assets/music/*
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigManager } from '../lib/config';
import { getProjectPaths, ensureProjectDirs } from '../../src/lib/paths';
import { AIProviderFactory } from '../services/ai';
import { MediaServiceFactory } from '../services/media';
import { TTSProviderFactory } from '../services/tts';
import { MusicServiceFactory } from '../services/music';
import { deduplicateImages, deduplicateVideos } from '../services/media/deduplication';
import { rankByQuality } from '../services/media/quality';
import { z } from 'zod';
import { extractVisualTagsPrompt } from '../../config/prompts';

export interface AssetTag {
  tag: string;
  segmentId: string;
  confidence: number;
}

export interface AssetManifest {
  images: Array<{ id: string; path: string; source: string; tags: string[] }>;
  videos: Array<{ id: string; path: string; source: string; tags: string[] }>;
  audio: Array<{ id: string; path: string; segmentId: string; durationMs: number }>;
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
    const downloader = MediaServiceFactory.getMediaDownloader('cache/media');
    const ttsProvider = await TTSProviderFactory.getTTSProvider();
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

      // 2. Search stock images
      const imageResults = await stockSearch.searchImages(
        tagResult.tags.map(t => t.tag),
        {
          perTag: stockConfig.perTag || 10,
          orientation: videoConfig.defaultAspectRatio as '16:9' | '9:16',
        }
      );

      // Deduplicate and rank
      const uniqueImages = deduplicateImages(imageResults);
      const rankedImages = rankByQuality(uniqueImages, {
        aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
        minQuality: stockConfig.minQuality || 0.6,
      }).slice(0, 5); // Top 5 images per segment

      console.log(`[GATHER]   → Found ${rankedImages.length} images`);

      // 3. Download images
      for (const image of rankedImages) {
        const localPath = await downloader.downloadImage(image);
        manifest.images.push({
          id: image.id,
          path: localPath,
          source: image.source,
          tags: image.tags,
        });
      }

      // 4. Generate TTS audio for segment
      console.log(`[GATHER]   → Generating TTS audio...`);
      const ttsResult = await ttsProvider.generateAudio(segment.text);
      const audioPath = path.join(paths.audio, `${segmentId}.mp3`);
      await fs.writeFile(audioPath, ttsResult.audioBuffer);

      manifest.audio.push({
        id: segmentId,
        path: audioPath,
        segmentId,
        durationMs: ttsResult.durationMs,
      });

      console.log(`[GATHER]   → Generated audio: ${ttsResult.durationMs}ms`);
    }

    // 5. Download background music if enabled
    if (musicService && musicConfig.enabled) {
      console.log('[GATHER] Searching for background music...');

      const totalDuration = manifest.audio.reduce((sum, a) => sum + a.durationMs, 0) / 1000;
      const musicTrack = await musicService.getDefaultMusic(totalDuration);

      if (musicTrack) {
        console.log(`[GATHER]   → Found music: ${musicTrack.title}`);
        const musicPath = path.join(paths.music, 'background.mp3');

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
