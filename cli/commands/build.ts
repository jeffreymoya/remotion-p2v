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
import { FPS, INTRO_DURATION_MS } from '../../src/lib/constants';
import { removeStageDirections, splitIntoSentences, calculateSpeakingVelocity } from '../../src/lib/utils';
import { holdBufferPrompt, HoldBufferSchema } from '../../config/prompts/hold-buffer.prompt';
import { AIProviderFactory } from '../services/ai';
import { ViewportAnalysis } from '../../src/lib/viewport-types';

// Intro offset constant (matches INTRO_DURATION in src/lib/constants.ts)
// This offset is BAKED INTO timeline data during assembly.
// Renderer uses timeline timestamps as-is without adding offset.
const INTRO_OFFSET_MS = INTRO_DURATION_MS;

// WordData interface for internal use during timeline assembly
export interface WordData {
  text: string;
  startMs: number;
  endMs: number;
  startFrame?: number;
  endFrame?: number;
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
export function generateAudioElements(
  audioManifest: any[],
  projectId: string,
  toFrame: (ms: number) => number,
): AudioElement[] {
  const elements: AudioElement[] = [];
  let currentTimeMs = 0;

  for (const audioFile of audioManifest) {
    // Extract just the segment ID from the audio path
    // From: "/absolute/path/to/segment-1.mp3" or "projects/{id}/assets/audio/segment-1.mp3"
    // To: "segment-1"
    const basename = path.basename(audioFile.path, '.mp3');

    const startMs = currentTimeMs + INTRO_OFFSET_MS;
    const endMs = currentTimeMs + audioFile.durationMs + INTRO_OFFSET_MS;

    elements.push({
      audioUrl: basename,
      startMs,
      endMs,
      startFrame: toFrame(startMs),
      endFrame: toFrame(endMs),
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
export function generateBackgroundElements(
  images: any[],
  videos: any[],
  tags: any[],
  audioElements: AudioElement[],
  videoConfig: any,
  toFrame: (ms: number) => number,
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

        const startMs = audio.startMs;
        const endMs = audio.endMs;

        elements.push({
          videoUrl: videoUrl,
          startMs,
          endMs,
          startFrame: toFrame(startMs),
          endFrame: toFrame(endMs),
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

        const startMs = audio.startMs + (j * imageDuration);
        const endMs = audio.startMs + ((j + 1) * imageDuration);

        elements.push({
          imageUrl: imageUrl,
          startMs,
          endMs,
          startFrame: toFrame(startMs),
          endFrame: toFrame(endMs),
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
export async function generateTextElements(
  segments: any[],
  audioElements: AudioElement[],
  audioManifest: any[],
  videoConfig: any,
  toFrame: (ms: number) => number,
  subtitleLeadMs: number,
): Promise<TextElement[]> {
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
      // Clean segment text
      const cleanedSegmentText = removeStageDirections(segment.text);

      // Validate cleaned text isn't empty
      if (!cleanedSegmentText || cleanedSegmentText.trim().length === 0) {
        console.warn(`[BUILD] Segment ${i + 1} has no text after stage direction removal, skipping`);
        continue;
      }

      // Split into sentences
      const sentences = splitIntoSentences(cleanedSegmentText);

      // Validate sentence splitting worked
      if (sentences.length === 0) {
        console.error(`[BUILD] Failed to split text into sentences: "${cleanedSegmentText.substring(0, 100)}..."`);
        // Fallback: treat entire text as one sentence
        sentences.push(cleanedSegmentText);
      }

      // Map word timestamps to cleaned text
      const allWords = audioData.wordTimestamps.map((ts: any, idx: number) => {
        const emphasis = audioData.emphasis?.find((e: any) => e.wordIndex === idx);
        const startMs = ts.startMs + audio.startMs + subtitleLeadMs;
        const endMs = ts.endMs + audio.startMs + subtitleLeadMs;

        return {
          text: ts.word,
          startMs,
          endMs,
          startFrame: toFrame(startMs),
          endFrame: toFrame(endMs),
          emphasis: emphasis ? { level: emphasis.level, tone: emphasis.tone } : { level: 'none' as const },
        };
      });

      // Validate total word count matches (helps catch TTS tokenization issues)
      const expectedWordCount = cleanedSegmentText.split(/\s+/).filter(w => w.length > 0).length;
      if (allWords.length !== expectedWordCount) {
        console.warn(`[BUILD] Word count mismatch in segment ${i + 1}: TTS returned ${allWords.length} words, expected ${expectedWordCount}`);
        console.warn(`[BUILD]   Text: "${cleanedSegmentText.substring(0, 100)}..."`);
        console.warn(`[BUILD]   This may cause subtitle misalignment`);
      }

      // Prepare all sentence data first for batch processing
      const sentenceData: Array<{
        sentence: string;
        words: typeof allWords;
        velocity: ReturnType<typeof calculateSpeakingVelocity>;
        hasPauseAtEnd: boolean;
      }> = [];

      let wordIndex = 0;
      for (let sentenceIdx = 0; sentenceIdx < sentences.length; sentenceIdx++) {
        const sentence = sentences[sentenceIdx];
        const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0);

        // Safety check: ensure we don't exceed available words
        const wordsAvailable = allWords.length - wordIndex;
        const wordsToTake = Math.min(sentenceWords.length, wordsAvailable);

        if (wordsToTake === 0) {
          console.warn(`[BUILD] No words available for sentence ${sentenceIdx + 1}: "${sentence.substring(0, 50)}..."`);
          continue;
        }

        if (wordsToTake < sentenceWords.length) {
          console.warn(`[BUILD] Insufficient words for sentence ${sentenceIdx + 1}: need ${sentenceWords.length}, have ${wordsAvailable}`);
        }

        const sentenceWordData = allWords.slice(wordIndex, wordIndex + wordsToTake);

        // Calculate speaking velocity for this sentence
        const velocity = calculateSpeakingVelocity(sentenceWordData);

        // Detect if there's a pause after last word
        const lastWordEndMs = sentenceWordData[sentenceWordData.length - 1].endMs;
        const nextWordStartMs = wordIndex + wordsToTake < allWords.length
          ? allWords[wordIndex + wordsToTake].startMs
          : lastWordEndMs;
        const hasPauseAtEnd = (nextWordStartMs - lastWordEndMs) > velocity.avgGapDuration * 1.5;

        sentenceData.push({
          sentence,
          words: sentenceWordData,
          velocity,
          hasPauseAtEnd,
        });

        wordIndex += wordsToTake;
      }

      // Initialize AI provider once (outside loop for efficiency)
      const aiProvider = await AIProviderFactory.getProviderWithFallback();
      aiProvider.setPipelineStage?.('hold-buffer-calculation');

      // Batch process all sentences with LLM in parallel
      const holdPromises = sentenceData.map(async (data, idx) => {
        try {
          const prompt = holdBufferPrompt(
            data.velocity.wordsPerMinute,
            data.velocity.avgGapDuration,
            data.hasPauseAtEnd,
            data.words.length
          );

          const result = await aiProvider.structuredComplete(prompt, HoldBufferSchema);
          return { holdFrames: result.holdFrames, reasoning: result.reasoning };
        } catch (error) {
          console.warn(`[BUILD] LLM hold buffer determination failed for sentence ${idx + 1}, using default`);
          return { holdFrames: 6, reasoning: 'fallback (LLM error)' };
        }
      });

      const holdResults = await Promise.all(holdPromises);

      // Create text elements with determined hold frames
      for (let i = 0; i < sentenceData.length; i++) {
        const data = sentenceData[i];
        const hold = holdResults[i];

        console.log(`[BUILD] Sentence ${i + 1}/${sentenceData.length}: ${hold.holdFrames} frames - ${hold.reasoning}`);

        elements.push({
          text: data.sentence,
          position: textConfig.position || 'bottom',
          startMs: data.words[0].startMs,
          endMs: data.words[data.words.length - 1].endMs,
          startFrame: data.words[0].startFrame,
          endFrame: data.words[data.words.length - 1].endFrame,
          words: data.words,
          holdFrames: hold.holdFrames,
        });
      }
    } else {
      // Legacy path: Fall back to phrase-based chunking
      const chunks = chunkText(segment.text, maxCharsPerLine, maxLines);
      const chunkDuration = (audio.endMs - audio.startMs) / chunks.length;

      for (let j = 0; j < chunks.length; j++) {
        const startMs = audio.startMs + (j * chunkDuration) + subtitleLeadMs;
        const endMs = audio.startMs + ((j + 1) * chunkDuration) + subtitleLeadMs;

        elements.push({
          text: chunks[j],
          position: textConfig.position || 'bottom',
          startMs,
          endMs,
          startFrame: toFrame(startMs),
          endFrame: toFrame(endMs),
          // No words array - backward compatibility
        });
      }
    }
  }

  return elements;
}

// Helper function to generate pan-scan background from viewport.json
export function generatePanScanBackground(
  viewport: ViewportAnalysis,
  audioElements: AudioElement[],
  textElements: TextElement[],
  fps: number,
  projectId: string,
): BackgroundElement[] {
  // Single background element for entire video
  const audioEnd = audioElements.length ? audioElements[audioElements.length - 1].endMs : 0;
  const viewportEnd = viewport.keyframes.length
    ? (viewport.keyframes[viewport.keyframes.length - 1].frameEnd / fps) * 1000
    : 0;
  const textEnd = textElements.length ? textElements[textElements.length - 1].endMs : 0;
  const totalDurationMs = Math.max(audioEnd, viewportEnd, textEnd);

  // VALIDATION: Ensure viewport.imageMetadata exists and has required fields
  if (!viewport.imageMetadata?.width || !viewport.imageMetadata?.height) {
    throw new Error('[BUILD] viewport.imageMetadata missing required width/height fields');
  }

  // VALIDATION: Ensure image file exists at expected path
  const imageBasename = viewport.imageSource;
  const expectedImagePath = path.join(
    process.cwd(),
    'public',
    'projects',
    projectId,
    'assets',
    'images',
    imageBasename
  );

  // Synchronous existence check using fs.accessSync
  try {
    require('fs').accessSync(expectedImagePath);
  } catch (error) {
    throw new Error(
      `[BUILD] Viewport image not found: ${expectedImagePath}. Ensure image was placed during gather stage.`
    );
  }

  // Helper: Convert ms to frame
  const toFrame = (ms: number) => Math.round((ms / 1000) * fps);

  return [
    {
      imageUrl: imageBasename, // CRITICAL: Must be basename only, matching viewport.imageSource
      startMs: 0,
      endMs: totalDurationMs,
      startFrame: 0,
      endFrame: toFrame(totalDurationMs),
      enterTransition: 'none' as const, // Viewport handles all transitions
      exitTransition: 'none' as const,
      mediaMetadata: {
        width: viewport.imageMetadata.width,
        height: viewport.imageMetadata.height,
        mode: 'crop' as const,
        scale: 1,
      },
      // NOTE: No animations - viewport bypasses that entirely
      viewportAnimation: {
        enabled: true,
        keyframes: viewport.keyframes.map((kf) => ({
          // CRITICAL: Add INTRO_OFFSET_MS to frame calculations
          // Viewport.json contains "pure" timings relative to script
          // Build stage applies intro offset to align with audio/text
          frameStart: kf.frameStart + toFrame(INTRO_OFFSET_MS),
          frameEnd: kf.frameEnd + toFrame(INTRO_OFFSET_MS),
          viewport: kf.viewport,
          easing: kf.easing,
          transitionDurationMs: kf.transitionDurationMs,
        })),
      },
    },
  ];
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
    const fps = videoConfig.aspectRatios?.[videoConfig.defaultAspectRatio]?.fps ?? FPS;
    const subtitleLeadMs = videoConfig.text?.subtitleLeadMs ?? 0;
    const toFrame = (ms: number) => Math.round((ms / 1000) * fps);

    console.log(`[BUILD] Aspect ratio: ${videoConfig.defaultAspectRatio}`);
    console.log(`[BUILD] Target duration: ${videoConfig.duration?.targetSeconds || 720}s`);

    // Read gathered assets
    const tagsData = JSON.parse(await fs.readFile(paths.tags, 'utf-8'));
    const scriptPath = path.join(paths.scripts, 'script-v1.json');
    const scriptData = JSON.parse(await fs.readFile(scriptPath, 'utf-8'));

    console.log(`[BUILD] Building timeline from ${scriptData.segments.length} segment(s)`);

    // Build timeline elements
    console.log('[BUILD]   → Generating audio elements...');
    const audioElements = generateAudioElements(tagsData.manifest.audio, projectId, toFrame);
    console.log(`[BUILD]   ✓ Generated ${audioElements.length} audio element(s)`);

    console.log('[BUILD]   → Generating text elements...');
    const textElements = await generateTextElements(
      scriptData.segments,
      audioElements,
      tagsData.manifest.audio,
      videoConfig,
      toFrame,
      subtitleLeadMs,
    );
    console.log(`[BUILD]   ✓ Generated ${textElements.length} text element(s)`);

    // Check for pan-scan mode
    const viewportPath = path.join(paths.root, 'viewport.json');
    let backgroundElements: BackgroundElement[];

    try {
      await fs.access(viewportPath);
      // viewport.json exists - use pan-scan mode
      console.log('[BUILD] Pan-scan mode detected');

      // HARD FAIL: Validate viewport.json is valid before proceeding
      let viewportData: ViewportAnalysis;
      try {
        const viewportContent = await fs.readFile(viewportPath, 'utf-8');
        viewportData = JSON.parse(viewportContent);

        // Validate required fields
        if (!viewportData.version || !viewportData.imageSource) {
          throw new Error('[BUILD] Invalid viewport.json: missing version or imageSource');
        }

        if (!viewportData.imageMetadata?.width || !viewportData.imageMetadata?.height) {
          throw new Error('[BUILD] Invalid viewport.json: imageMetadata missing width/height');
        }

        if (!viewportData.keyframes || viewportData.keyframes.length === 0) {
          throw new Error('[BUILD] Invalid viewport.json: no keyframes defined');
        }
      } catch (error: any) {
        if (error.message.startsWith('[BUILD]')) {
          throw error; // Re-throw validation errors
        }
        console.error('[BUILD] ✗ Failed to load or validate viewport.json');
        console.error(`[BUILD] ✗ Error: ${error.message}`);
        throw new Error('[BUILD] Corrupted or invalid viewport.json. Pipeline cannot continue.');
      }

      console.log('[BUILD]   → Generating pan-scan background...');
      backgroundElements = generatePanScanBackground(
        viewportData,
        audioElements,
        textElements,
        fps,
        projectId
      );
      console.log(`[BUILD]   ✓ Generated pan-scan background with ${viewportData.keyframes.length} keyframes`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // viewport.json doesn't exist - use existing multi-image logic
        console.log('[BUILD]   → Generating background elements (multi-image mode)...');
        backgroundElements = generateBackgroundElements(
          tagsData.manifest.images,
          tagsData.manifest.videos || [],
          tagsData.tags,
          audioElements,
          videoConfig,
          toFrame,
        );
        console.log(`[BUILD]   ✓ Generated ${backgroundElements.length} background element(s)`);
      } else {
        // Re-throw other errors (validation failures, etc.)
        throw error;
      }
    }

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
      backgroundMusic: generateBackgroundMusicElements(tagsData.manifest, totalDurationMs),
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
