/**
 * Custom Assertion Helpers for E2E Tests
 *
 * Provides validation helpers for:
 * - Schema validation using Zod schemas
 * - Content correctness (timing, emphasis, quality)
 * - File validation (audio, video, images)
 * - Rendered output validation (using ffprobe)
 */

import assert from 'node:assert/strict';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  TimelineSchema,
  type Timeline,
  type TextElement,
  type BackgroundElement,
  type AudioElement,
} from '../../../src/lib/types';

// Default tolerances
const DEFAULT_TIMING_TOLERANCE_MS = 50;
const DEFAULT_FRAME_RATE = 30;
const MIN_WORD_DURATION_MS = 50; // Minimum natural speech duration

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WordData {
  word?: string;
  text?: string;
  startMs: number;
  endMs: number;
  emphasis?: {
    level: 'none' | 'med' | 'high';
    tone?: 'warm' | 'intense';
  };
}

export interface EmphasisData {
  wordIndex: number;
  level: 'high' | 'med' | 'none';
  tone?: 'warm' | 'intense';
}

export interface VideoInfo {
  codec: string;
  width: number;
  height: number;
  fps: number;
  duration: number; // in seconds
  hasAudio: boolean;
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

/**
 * Validate timeline against Zod schema
 */
export function assertValidTimeline(timeline: unknown): void {
  try {
    TimelineSchema.parse(timeline);
  } catch (error: any) {
    throw new Error(`Timeline schema validation failed: ${error.message}`);
  }
}

/**
 * Validate manifest structure
 */
export function assertValidManifest(manifest: unknown): void {
  assert.ok(typeof manifest === 'object' && manifest !== null, 'Manifest must be an object');

  const m = manifest as any;

  assert.ok(Array.isArray(m.segments), 'Manifest must have segments array');
  assert.ok(m.segments.length > 0, 'Manifest must have at least one segment');

  for (const segment of m.segments) {
    assert.ok(typeof segment.id === 'string', 'Segment must have string id');
    assert.ok(typeof segment.narrative === 'string', 'Segment must have narrative');
  }
}

/**
 * Validate script structure
 */
export function assertValidScript(script: unknown): void {
  assert.ok(typeof script === 'object' && script !== null, 'Script must be an object');

  const s = script as any;

  assert.ok(Array.isArray(s.segments), 'Script must have segments array');
  assert.ok(s.segments.length >= 4 && s.segments.length <= 5, 'Script should have 4-5 segments');

  let totalDuration = 0;

  for (const segment of s.segments) {
    assert.ok(typeof segment.id === 'string', 'Segment must have id');
    assert.ok(typeof segment.narrative === 'string', 'Segment must have narrative');
    assert.ok(typeof segment.estimatedDuration === 'number', 'Segment must have estimatedDuration');
    assert.ok(Array.isArray(segment.visualHints), 'Segment must have visualHints array');
    assert.ok(
      segment.visualHints.length >= 3 && segment.visualHints.length <= 5,
      'Segment should have 3-5 visual hints'
    );
    assert.ok(
      segment.estimatedDuration >= 10 && segment.estimatedDuration <= 300,
      'Segment duration should be 10-300 seconds'
    );

    totalDuration += segment.estimatedDuration;
  }

  assert.ok(
    totalDuration >= 600 && totalDuration <= 840,
    `Total script duration should be 600-840 seconds, got ${totalDuration}`
  );
}

// ============================================================================
// CONTENT CORRECTNESS - WORD TIMING
// ============================================================================

/**
 * Validate word timing accuracy
 *
 * Checks:
 * - No overlaps between words
 * - Gaps ≤ tolerance
 * - Positive durations
 * - Minimum natural speech duration
 */
export function assertWordTimingAccuracy(
  words: WordData[],
  toleranceMs: number = DEFAULT_TIMING_TOLERANCE_MS
): void {
  assert.ok(words.length > 0, 'Words array must not be empty');

  // Validate word boundaries (no overlaps, no large gaps)
  for (let i = 0; i < words.length - 1; i++) {
    const current = words[i];
    const next = words[i + 1];
    const currentWord = current.word || current.text || `word-${i}`;
    const nextWord = next.word || next.text || `word-${i + 1}`;

    // Words should not overlap
    assert.ok(
      current.endMs <= next.startMs,
      `Words should not overlap: "${currentWord}" ends at ${current.endMs}ms, "${nextWord}" starts at ${next.startMs}ms`
    );

    // Gap between words should be within tolerance
    const gap = next.startMs - current.endMs;
    assert.ok(
      gap <= toleranceMs,
      `Gap between words should be ≤${toleranceMs}ms, got ${gap}ms between "${currentWord}" and "${nextWord}"`
    );
  }

  // Each word should have positive duration
  for (const word of words) {
    const wordText = word.word || word.text || 'unknown';
    const duration = word.endMs - word.startMs;

    assert.ok(duration > 0, `Word "${wordText}" should have positive duration, got ${duration}ms`);
    assert.ok(
      duration >= MIN_WORD_DURATION_MS,
      `Word duration should be ≥${MIN_WORD_DURATION_MS}ms for natural speech, got ${duration}ms for "${wordText}"`
    );
  }
}

/**
 * Validate frame conversion accuracy
 */
export function assertFrameConversion(
  words: WordData[],
  fps: number = DEFAULT_FRAME_RATE,
  toleranceMs: number = DEFAULT_TIMING_TOLERANCE_MS
): void {
  for (const word of words) {
    const startFrame = msToFrame(word.startMs, fps);
    const endFrame = msToFrame(word.endMs, fps);

    assert.ok(startFrame >= 0, 'Start frame should be non-negative');
    assert.ok(endFrame >= 0, 'End frame should be non-negative');
    assert.ok(endFrame > startFrame, 'End frame should be > start frame');

    // Verify conversion is reversible
    const convertedBackMs = frameToMs(startFrame, fps);
    const timeDiff = Math.abs(convertedBackMs - word.startMs);
    assert.ok(
      timeDiff <= toleranceMs,
      `Frame conversion should be reversible within ${toleranceMs}ms, got ${timeDiff}ms difference`
    );
  }
}

// ============================================================================
// CONTENT CORRECTNESS - EMPHASIS
// ============================================================================

/**
 * Validate emphasis constraints
 *
 * Checks:
 * - Total emphasis ≤20% of words
 * - High emphasis ≤5% of words
 * - Gap ≥3 indices between high emphasis words
 */
export function assertEmphasisConstraints(emphases: EmphasisData[], wordCount: number): void {
  const maxTotal = Math.ceil(wordCount * 0.2); // 20%
  const maxHigh = Math.ceil(wordCount * 0.05); // 5%

  // Validate total emphasis count
  assert.ok(
    emphases.length <= maxTotal,
    `Total emphasis count (${emphases.length}) should be ≤20% of words (${maxTotal})`
  );

  // Count high-emphasis words
  const highEmphases = emphases.filter(e => e.level === 'high');

  assert.ok(
    highEmphases.length <= maxHigh,
    `High emphasis count (${highEmphases.length}) should be ≤5% of words (${maxHigh})`
  );

  // Validate gap between high-emphasis words (≥3 word indices)
  const sortedHighEmphases = highEmphases.sort((a, b) => a.wordIndex - b.wordIndex);

  for (let i = 0; i < sortedHighEmphases.length - 1; i++) {
    const gap = sortedHighEmphases[i + 1].wordIndex - sortedHighEmphases[i].wordIndex;
    assert.ok(
      gap >= 3,
      `High-emphasis words should have gap ≥3 indices, got ${gap} between indices ${sortedHighEmphases[i].wordIndex} and ${sortedHighEmphases[i + 1].wordIndex}`
    );
  }

  // Validate emphasis levels and tones
  for (const emphasis of emphases) {
    assert.ok(
      ['none', 'med', 'high'].includes(emphasis.level),
      `Invalid emphasis level: ${emphasis.level}`
    );

    if (emphasis.tone) {
      assert.ok(
        ['warm', 'intense'].includes(emphasis.tone),
        `Invalid emphasis tone: ${emphasis.tone}`
      );
    }

    assert.ok(emphasis.wordIndex >= 0, 'Word index should be non-negative');
  }
}

// ============================================================================
// CONTENT CORRECTNESS - MEDIA QUALITY
// ============================================================================

/**
 * Validate media quality score
 */
export function assertMediaQuality(media: any, minScore: number): void {
  assert.ok(typeof media === 'object' && media !== null, 'Media must be an object');
  assert.ok(typeof media.qualityScore === 'number', 'Media must have qualityScore');
  assert.ok(
    media.qualityScore >= minScore,
    `Media quality score (${media.qualityScore}) should be ≥${minScore}`
  );
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validate audio file exists and meets minimum requirements
 */
export async function assertAudioFile(filePath: string, minDurationMs: number): Promise<void> {
  // Check file exists
  const exists = await fs.pathExists(filePath);
  assert.ok(exists, `Audio file not found: ${filePath}`);

  // Check file size
  const stats = await fs.stat(filePath);
  assert.ok(stats.size > 0, `Audio file is empty: ${filePath}`);
  assert.ok(stats.size > 1000, `Audio file suspiciously small (${stats.size} bytes): ${filePath}`);

  // Use ffprobe to check audio properties
  try {
    const duration = await getAudioDuration(filePath);
    const durationMs = duration * 1000;

    assert.ok(
      durationMs >= minDurationMs,
      `Audio duration (${durationMs}ms) should be ≥${minDurationMs}ms`
    );
  } catch (error: any) {
    throw new Error(`Failed to validate audio file ${filePath}: ${error.message}`);
  }
}

/**
 * Validate video file exists and meets minimum requirements
 */
export async function assertVideoFile(
  filePath: string,
  minDurationMs: number,
  minWidth: number
): Promise<void> {
  // Check file exists
  const exists = await fs.pathExists(filePath);
  assert.ok(exists, `Video file not found: ${filePath}`);

  // Check file size
  const stats = await fs.stat(filePath);
  assert.ok(stats.size > 0, `Video file is empty: ${filePath}`);
  assert.ok(stats.size > 10000, `Video file suspiciously small (${stats.size} bytes): ${filePath}`);

  // Use ffprobe to check video properties
  try {
    const info = await getVideoInfo(filePath);
    const durationMs = info.duration * 1000;

    assert.ok(
      durationMs >= minDurationMs,
      `Video duration (${durationMs}ms) should be ≥${minDurationMs}ms`
    );
    assert.ok(info.width >= minWidth, `Video width (${info.width}) should be ≥${minWidth}`);
  } catch (error: any) {
    throw new Error(`Failed to validate video file ${filePath}: ${error.message}`);
  }
}

/**
 * Validate image file exists and meets minimum requirements
 */
export async function assertImageFile(
  filePath: string,
  minWidth: number,
  minHeight: number
): Promise<void> {
  // Check file exists
  const exists = await fs.pathExists(filePath);
  assert.ok(exists, `Image file not found: ${filePath}`);

  // Check file size
  const stats = await fs.stat(filePath);
  assert.ok(stats.size > 0, `Image file is empty: ${filePath}`);
  assert.ok(stats.size > 1000, `Image file suspiciously small (${stats.size} bytes): ${filePath}`);

  // Use ffprobe to check image dimensions
  try {
    const info = await getImageInfo(filePath);

    assert.ok(info.width >= minWidth, `Image width (${info.width}) should be ≥${minWidth}`);
    assert.ok(info.height >= minHeight, `Image height (${info.height}) should be ≥${minHeight}`);
  } catch (error: any) {
    throw new Error(`Failed to validate image file ${filePath}: ${error.message}`);
  }
}

// ============================================================================
// RENDERED OUTPUT VALIDATION
// ============================================================================

/**
 * Validate video frame rate
 */
export async function assertVideoFrameRate(
  videoPath: string,
  expectedFPS: number = 30
): Promise<void> {
  const info = await getVideoInfo(videoPath);

  assert.strictEqual(
    info.fps,
    expectedFPS,
    `Video FPS should be ${expectedFPS}, got ${info.fps}`
  );
}

/**
 * Validate audio sync in rendered video
 */
export async function assertAudioSync(
  videoPath: string,
  timeline: Timeline,
  toleranceMs: number = 100
): Promise<void> {
  const info = await getVideoInfo(videoPath);

  assert.ok(info.hasAudio, 'Video should have audio track');

  // Calculate expected duration from timeline
  const expectedDuration = calculateTimelineDuration(timeline);
  const actualDurationMs = info.duration * 1000;

  const diff = Math.abs(actualDurationMs - expectedDuration);
  assert.ok(
    diff <= toleranceMs,
    `Video duration (${actualDurationMs}ms) should be within ${toleranceMs}ms of timeline duration (${expectedDuration}ms), got difference of ${diff}ms`
  );
}

/**
 * Validate video codec
 */
export async function assertVideoCodec(videoPath: string, expectedCodec: string): Promise<void> {
  const info = await getVideoInfo(videoPath);

  assert.strictEqual(
    info.codec,
    expectedCodec,
    `Video codec should be ${expectedCodec}, got ${info.codec}`
  );
}

/**
 * Validate video dimensions
 */
export async function assertVideoDimensions(
  videoPath: string,
  width: number,
  height: number
): Promise<void> {
  const info = await getVideoInfo(videoPath);

  assert.strictEqual(info.width, width, `Video width should be ${width}, got ${info.width}`);
  assert.strictEqual(info.height, height, `Video height should be ${height}, got ${info.height}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert milliseconds to frame number
 */
function msToFrame(ms: number, fps: number = DEFAULT_FRAME_RATE): number {
  return Math.floor((ms / 1000) * fps);
}

/**
 * Convert frame number to milliseconds
 */
function frameToMs(frame: number, fps: number = DEFAULT_FRAME_RATE): number {
  return (frame / fps) * 1000;
}

/**
 * Get audio duration using ffprobe
 */
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: 'utf-8' }
    );

    return parseFloat(output.trim());
  } catch (error: any) {
    throw new Error(`ffprobe failed for audio file: ${error.message}`);
  }
}

/**
 * Get video info using ffprobe
 */
async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  try {
    const output = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,duration -of json "${filePath}"`,
      { encoding: 'utf-8' }
    );

    const data = JSON.parse(output);
    const stream = data.streams[0];

    // Parse frame rate (can be "30/1" format)
    const fpsMatch = stream.r_frame_rate.match(/(\d+)\/(\d+)/);
    const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : parseInt(stream.r_frame_rate);

    // Check for audio stream
    const audioOutput = execSync(
      `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of json "${filePath}"`,
      { encoding: 'utf-8' }
    );
    const audioData = JSON.parse(audioOutput);
    const hasAudio = audioData.streams && audioData.streams.length > 0;

    return {
      codec: stream.codec_name,
      width: parseInt(stream.width),
      height: parseInt(stream.height),
      fps: Math.round(fps),
      duration: parseFloat(stream.duration || '0'),
      hasAudio,
    };
  } catch (error: any) {
    throw new Error(`ffprobe failed for video file: ${error.message}`);
  }
}

/**
 * Get image info using ffprobe
 */
async function getImageInfo(filePath: string): Promise<{ width: number; height: number }> {
  try {
    const output = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${filePath}"`,
      { encoding: 'utf-8' }
    );

    const data = JSON.parse(output);
    const stream = data.streams[0];

    return {
      width: parseInt(stream.width),
      height: parseInt(stream.height),
    };
  } catch (error: any) {
    throw new Error(`ffprobe failed for image file: ${error.message}`);
  }
}

/**
 * Calculate total duration from timeline
 */
function calculateTimelineDuration(timeline: Timeline): number {
  let maxEndMs = 0;

  // Check background elements
  for (const element of timeline.elements) {
    maxEndMs = Math.max(maxEndMs, element.endMs);
  }

  // Check text elements
  for (const element of timeline.text) {
    maxEndMs = Math.max(maxEndMs, element.endMs);
  }

  // Check audio elements
  for (const element of timeline.audio) {
    maxEndMs = Math.max(maxEndMs, element.endMs);
  }

  return maxEndMs;
}
