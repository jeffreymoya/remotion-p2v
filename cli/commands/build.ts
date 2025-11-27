#!/usr/bin/env node
/**
 * Stage 6: Timeline Assembly
 *
 * Builds timeline.json from all gathered assets.
 * Outputs: timeline.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env
import { ConfigManager } from '../lib/config';
import { getProjectPaths } from '../../src/lib/paths';

// Import timeline types from src (these will be extended in Phase 2)
// For now, use minimal stub types
export interface TimelineElement {
  startMs: number;
  endMs: number;
}

export interface BackgroundElement extends TimelineElement {
  imageUrl?: string;
  videoUrl?: string;
  enterTransition?: 'fade' | 'blur' | 'none';
  exitTransition?: 'fade' | 'blur' | 'none';
}

export interface TextElement extends TimelineElement {
  text: string;
  position: 'top' | 'bottom' | 'center';
}

export interface AudioElement extends TimelineElement {
  audioUrl: string;
}

export interface MusicElement extends TimelineElement {
  musicUrl: string;
  volume: number;
}

export interface Timeline {
  shortTitle: string;
  aspectRatio?: '16:9' | '9:16';
  durationSeconds?: number;
  elements: BackgroundElement[];
  text: TextElement[];
  audio: AudioElement[];
  music?: MusicElement[];
}

// Helper function to generate audio elements
function generateAudioElements(audioManifest: any[], projectId: string): AudioElement[] {
  const elements: AudioElement[] = [];
  let currentTimeMs = 0;

  for (const audioFile of audioManifest) {
    // Extract just the segment ID from the audio path
    // From: "/absolute/path/to/segment-1.mp3" or "projects/{id}/assets/audio/segment-1.mp3"
    // To: "segment-1"
    const basename = path.basename(audioFile.path, '.mp3');

    elements.push({
      audioUrl: basename,
      startMs: currentTimeMs,
      endMs: currentTimeMs + audioFile.durationMs,
    });
    currentTimeMs += audioFile.durationMs;
  }

  return elements;
}

// Helper function to generate background elements
function generateBackgroundElements(
  images: any[],
  tags: any[],
  audioElements: AudioElement[],
  videoConfig: any
): BackgroundElement[] {
  const elements: BackgroundElement[] = [];
  const transitions = videoConfig.transitions || {};
  const animations = videoConfig.animations || {};

  // Group tags by segment
  const tagsBySegment = new Map<string, string[]>();
  for (const tag of tags) {
    const segmentTags = tagsBySegment.get(tag.segmentId) || [];
    segmentTags.push(tag.tag.toLowerCase());
    tagsBySegment.set(tag.segmentId, segmentTags);
  }

  // For each audio segment, find matching images
  for (let i = 0; i < audioElements.length; i++) {
    const audio = audioElements[i];
    const segmentId = audio.audioUrl;
    const segmentTags = tagsBySegment.get(segmentId) || [];
    const duration = audio.endMs - audio.startMs;

    // Find images that match this segment's tags
    const matchingImages = images.filter((img) => {
      const imgTags = img.tags.map((t: string) => t.toLowerCase());
      return segmentTags.some((tag) => imgTags.some((imgTag) => imgTag.includes(tag) || tag.includes(imgTag)));
    });

    // If no matches, use any available images
    const imagesToUse = matchingImages.length > 0 ? matchingImages : images;

    // For segments longer than 15s, use multiple images
    const numImages = duration > 15000 ? Math.min(3, Math.ceil(duration / 20000)) : 1;
    const imageDuration = duration / numImages;

    for (let j = 0; j < numImages; j++) {
      const imageIndex = (i * numImages + j) % imagesToUse.length;
      const image = imagesToUse[imageIndex];

      // Extract filename with extension for staticFile() compatibility
      let imageUrl = image.path;

      // Convert absolute path to relative if needed
      if (imageUrl.includes('/public/')) {
        imageUrl = imageUrl.split('/public/')[1];
      }

      // Remove assets/images/ prefix but KEEP file extension
      if (imageUrl.includes('assets/images/')) {
        imageUrl = imageUrl.split('assets/images/')[1];
      }

      elements.push({
        imageUrl: imageUrl,
        startMs: audio.startMs + (j * imageDuration),
        endMs: audio.startMs + ((j + 1) * imageDuration),
        enterTransition: transitions.enterType || 'fade',
        exitTransition: transitions.exitType || 'fade',
      });
    }
  }

  return elements;
}

// Helper function to chunk text into readable segments
function chunkText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLine = '';
  let currentLineCount = 0;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length > maxCharsPerLine) {
      // Line would be too long, start a new line
      if (currentLine) {
        currentChunk.push(currentLine);
        currentLineCount++;
      }

      if (currentLineCount >= maxLines) {
        // Chunk is full, start a new chunk
        chunks.push(currentChunk.join('\n'));
        currentChunk = [];
        currentLineCount = 0;
      }

      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  // Add remaining content
  if (currentLine) {
    currentChunk.push(currentLine);
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
}

// Helper function to generate text elements
function generateTextElements(
  segments: any[],
  audioElements: AudioElement[],
  videoConfig: any
): TextElement[] {
  const elements: TextElement[] = [];
  const textConfig = videoConfig.text || {};
  const maxCharsPerLine = textConfig.maxCharactersPerLine || 40;
  const maxLines = textConfig.maxLines || 2;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Match by index - audio and segments generated in same order
    if (i >= audioElements.length) continue;
    const audio = audioElements[i];

    const chunks = chunkText(segment.text, maxCharsPerLine, maxLines);
    const chunkDuration = (audio.endMs - audio.startMs) / chunks.length;

    for (let j = 0; j < chunks.length; j++) {
      elements.push({
        text: chunks[j],
        position: textConfig.position || 'bottom',
        startMs: audio.startMs + (j * chunkDuration),
        endMs: audio.startMs + ((j + 1) * chunkDuration),
      });
    }
  }

  return elements;
}

// Helper function to generate music elements
function generateMusicElements(
  musicManifest: any[],
  audioElements: AudioElement[],
  musicConfig: any
): MusicElement[] {
  if (!musicManifest || musicManifest.length === 0) {
    return [];
  }

  const elements: MusicElement[] = [];
  const totalDuration = audioElements.length > 0
    ? audioElements[audioElements.length - 1].endMs
    : 0;

  if (totalDuration === 0) return [];

  // Use first music track
  const music = musicManifest[0];

  elements.push({
    musicUrl: music.path,
    startMs: 0,
    endMs: totalDuration,
    volume: musicConfig.volume || 0.2,
  });

  return elements;
}

async function main(projectId?: string) {
  try {
    console.log('[BUILD] Starting timeline assembly...');

    if (!projectId) {
      console.error('[BUILD] ✗ Error: Missing required argument --project <id>');
      console.log('[BUILD] Usage: npm run build:timeline -- --project <project-id>');
      process.exit(1);
    }

    const paths = getProjectPaths(projectId);

    // Check if tags.json exists
    const tagsExists = await fs.access(paths.tags).then(() => true).catch(() => false);
    if (!tagsExists) {
      console.error(`[BUILD] ✗ Error: tags.json not found at ${paths.tags}`);
      console.log('[BUILD] Please run: npm run gather');
      process.exit(1);
    }

    // Load configuration
    const videoConfig = await ConfigManager.loadVideoConfig();
    const musicConfig = await ConfigManager.loadMusicConfig();

    console.log(`[BUILD] Aspect ratio: ${videoConfig.defaultAspectRatio}`);
    console.log(`[BUILD] Target duration: ${videoConfig.duration?.targetSeconds || 720}s`);
    console.log(`[BUILD] Music enabled: ${musicConfig.enabled}`);

    // Read gathered assets
    const tagsData = JSON.parse(await fs.readFile(paths.tags, 'utf-8'));
    const scriptPath = path.join(paths.scripts, 'script-v1.json');
    const scriptData = JSON.parse(await fs.readFile(scriptPath, 'utf-8'));

    console.log(`[BUILD] Building timeline from ${scriptData.segments.length} segment(s)`);

    // Build timeline elements
    console.log('[BUILD]   → Generating audio elements...');
    const audioElements = generateAudioElements(tagsData.manifest.audio, projectId);
    console.log(`[BUILD]   ✓ Generated ${audioElements.length} audio element(s)`);

    console.log('[BUILD]   → Generating background elements...');
    const backgroundElements = generateBackgroundElements(
      tagsData.manifest.images,
      tagsData.tags,
      audioElements,
      videoConfig
    );
    console.log(`[BUILD]   ✓ Generated ${backgroundElements.length} background element(s)`);

    console.log('[BUILD]   → Generating text elements...');
    const textElements = generateTextElements(
      scriptData.segments,
      audioElements,
      videoConfig
    );
    console.log(`[BUILD]   ✓ Generated ${textElements.length} text element(s)`);

    console.log('[BUILD]   → Generating music elements...');
    const musicElements = musicConfig.enabled ? generateMusicElements(
      tagsData.manifest.music,
      audioElements,
      musicConfig
    ) : undefined;
    if (musicElements) {
      console.log(`[BUILD]   ✓ Generated ${musicElements.length} music element(s)`);
    } else {
      console.log(`[BUILD]   ✓ Music disabled`);
    }

    // Calculate total duration from audio elements
    const durationSeconds = audioElements.length > 0
      ? Math.ceil(audioElements[audioElements.length - 1].endMs / 1000)
      : 720;

    const timeline: Timeline = {
      shortTitle: scriptData.title,
      aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
      durationSeconds,
      elements: backgroundElements,
      text: textElements,
      audio: audioElements,
      music: musicElements,
    };

    // Write timeline.json
    await fs.writeFile(
      paths.timeline,
      JSON.stringify(timeline, null, 2),
      'utf-8'
    );

    console.log(`[BUILD] ✓ Assembled timeline`);
    console.log(`[BUILD] ✓ Duration: ${timeline.durationSeconds}s`);
    console.log(`[BUILD] ✓ Aspect ratio: ${timeline.aspectRatio}`);
    console.log(`[BUILD] ✓ Output: ${paths.timeline}`);

    process.exit(0);
  } catch (error: any) {
    console.error('[BUILD] ✗ Error:', error.message);
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
