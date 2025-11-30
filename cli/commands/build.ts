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
import {
  BackgroundElement,
  TextElement,
  AudioElement,
  BackgroundMusicElement,
  Timeline,
} from '../../src/lib/types';

// Intro offset constant (matches INTRO_DURATION in src/lib/constants.ts)
// This offset is BAKED INTO timeline data during assembly.
// Renderer uses timeline timestamps as-is without adding offset.
const INTRO_OFFSET_MS = 1000;

// WordData interface for internal use during timeline assembly
export interface WordData {
  text: string;
  startMs: number;
  endMs: number;
  emphasis?: {
    level: 'none' | 'med' | 'high';
    tone?: 'warm' | 'intense';
  };
}

// Helper function to strip file extensions
function stripExtension(filename: string): string {
  return filename.replace(/\.(mp4|jpg|jpeg|png|webp)$/i, '');
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
      startMs: currentTimeMs + INTRO_OFFSET_MS,
      endMs: currentTimeMs + audioFile.durationMs + INTRO_OFFSET_MS,
    });
    currentTimeMs += audioFile.durationMs;
  }

  return elements;
}

// Helper function to generate background music elements
function generateBackgroundMusicElements(
  manifest: any,
  durationMs: number
): BackgroundMusicElement[] | undefined {
  if (!manifest.music || manifest.music.length === 0) {
    return undefined;
  }

  // Use first music track, loop if needed
  const musicTrack = manifest.music[0];

  return [{
    type: 'backgroundMusic' as const,
    src: musicTrack.path,
    startMs: 0,
    endMs: durationMs,
    volume: 0.15, // 15% volume to not overpower narration
  }];
}

// Helper function to generate background elements (video or image)
function generateBackgroundElements(
  images: any[],
  videos: any[],
  tags: any[],
  audioElements: AudioElement[],
  videoConfig: any
): BackgroundElement[] {
  const elements: BackgroundElement[] = [];
  const transitions = videoConfig.transitions || {};
  const MIN_VIDEO_QUALITY = 0.7; // Videos must have quality >= 0.7

  // Group tags by segment
  const tagsBySegment = new Map<string, string[]>();
  for (const tag of tags) {
    const segmentTags = tagsBySegment.get(tag.segmentId) || [];
    segmentTags.push(tag.tag.toLowerCase());
    tagsBySegment.set(tag.segmentId, segmentTags);
  }

  // For each audio segment, find matching video or image
  for (let i = 0; i < audioElements.length; i++) {
    const audio = audioElements[i];
    const segmentId = audio.audioUrl;
    const segmentTags = tagsBySegment.get(segmentId) || [];
    const duration = audio.endMs - audio.startMs;

    // 1. Try to find matching video first
    let videoUsed = false;
    if (videos && videos.length > 0) {
      const matchingVideos = videos.filter((vid: any) => {
        const vidTags = vid.tags.map((t: string) => t.toLowerCase());
        return segmentTags.some((tag) => vidTags.some((vidTag) => vidTag.includes(tag) || tag.includes(vidTag)));
      });

      const videosToUse = matchingVideos.length > 0 ? matchingVideos : videos;

      // Use video if available and meets quality threshold
      if (videosToUse.length > 0) {
        const video = videosToUse[i % videosToUse.length];

        // Extract filename from path
        let videoUrl = video.path;
        if (videoUrl.includes('/public/')) {
          videoUrl = videoUrl.split('/public/')[1];
        }
        if (videoUrl.includes('assets/videos/')) {
          videoUrl = videoUrl.split('assets/videos/')[1];
        }

        // Strip extension to prevent double .mp4.mp4
        videoUrl = stripExtension(videoUrl);

        elements.push({
          videoUrl: videoUrl,
          startMs: audio.startMs,
          endMs: audio.endMs,
          enterTransition: transitions.defaultEnter || 'blur',
          exitTransition: transitions.defaultExit || 'blur',
          mediaMetadata: video.metadata || {
            width: video.width,
            height: video.height,
            duration: video.duration,
          },
        });

        videoUsed = true;
      }
    }

    // 2. Fall back to images if no video was used
    if (!videoUsed) {
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
          enterTransition: transitions.defaultEnter || 'fade',
          exitTransition: transitions.defaultExit || 'fade',
          mediaMetadata: image.metadata,
        });
      }
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

// Helper function to generate text elements with word-level timing
function generateTextElements(
  segments: any[],
  audioElements: AudioElement[],
  audioManifest: any[],
  videoConfig: any
): TextElement[] {
  const elements: TextElement[] = [];
  const textConfig = videoConfig.text || {};
  const maxCharsPerLine = textConfig.maxCharactersPerLine || 40;
  const maxLines = textConfig.maxLines || 2;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Match by index - audio and segments generated in same order
    if (i >= audioElements.length || i >= audioManifest.length) continue;
    const audio = audioElements[i];
    const audioData = audioManifest[i];

    // Check if word-level timestamps are available
    if (audioData.wordTimestamps && audioData.wordTimestamps.length > 0) {
      // New path: Build text element with word-level timing
      const wordData: WordData[] = audioData.wordTimestamps.map((ts: any, idx: number) => {
        // Find emphasis for this word if available
        const emphasis = audioData.emphasis?.find((e: any) => e.wordIndex === idx);

        return {
          text: ts.word,
          startMs: ts.startMs + audio.startMs,
          endMs: ts.endMs + audio.startMs,
          emphasis: emphasis ? {
            level: emphasis.level,
            tone: emphasis.tone,
          } : { level: 'none' as const },
        };
      });

      // Create a single text element with all words
      if (wordData.length > 0) {
        elements.push({
          text: segment.text, // Legacy compatibility - full text
          position: textConfig.position || 'bottom',
          startMs: wordData[0].startMs,
          endMs: wordData[wordData.length - 1].endMs,
          words: wordData,
        });
      }
    } else {
      // Legacy path: Fall back to phrase-based chunking
      const chunks = chunkText(segment.text, maxCharsPerLine, maxLines);
      const chunkDuration = (audio.endMs - audio.startMs) / chunks.length;

      for (let j = 0; j < chunks.length; j++) {
        elements.push({
          text: chunks[j],
          position: textConfig.position || 'bottom',
          startMs: audio.startMs + (j * chunkDuration),
          endMs: audio.startMs + ((j + 1) * chunkDuration),
          // No words array - backward compatibility
        });
      }
    }
  }

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

    console.log(`[BUILD] Aspect ratio: ${videoConfig.defaultAspectRatio}`);
    console.log(`[BUILD] Target duration: ${videoConfig.duration?.targetSeconds || 720}s`);

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
      tagsData.manifest.videos || [],
      tagsData.tags,
      audioElements,
      videoConfig
    );
    console.log(`[BUILD]   ✓ Generated ${backgroundElements.length} background element(s)`);

    console.log('[BUILD]   → Generating text elements...');
    const textElements = generateTextElements(
      scriptData.segments,
      audioElements,
      tagsData.manifest.audio,
      videoConfig
    );
    console.log(`[BUILD]   ✓ Generated ${textElements.length} text element(s)`);

    // Calculate total duration from audio elements
    const durationSeconds = audioElements.length > 0
      ? Math.ceil(audioElements[audioElements.length - 1].endMs / 1000)
      : 720;
    const totalDurationMs = audioElements.length > 0
      ? audioElements[audioElements.length - 1].endMs
      : 720000;

    const timeline: Timeline = {
      shortTitle: scriptData.title,
      aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
      durationSeconds,
      elements: backgroundElements,
      text: textElements,
      audio: audioElements,
      backgroundMusic: generateBackgroundMusicElements(manifest, totalDurationMs),
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
