// =============================================================================
// TIMING CONSTANTS
// =============================================================================

/**
 * Default frames per second for video rendering.
 * Used by Remotion and all timeline calculations.
 */
export const FPS = 30;

/**
 * Words per minute estimates for different contexts.
 * - SCRIPT_GENERATION: Used when estimating script duration from word count
 * - TTS_BASE: Base speaking rate for TTS (multiplied by speakingRate setting)
 * - TIMELINE_FALLBACK: Fallback when no audio duration is available
 */
export const WORDS_PER_MINUTE = {
  /** Used in script generation for duration estimates (~140 WPM conversational) */
  SCRIPT_GENERATION: 140,
  /** Base TTS speaking rate before rate multiplier */
  TTS_BASE: 160,
  /** Fallback for timeline building when no audio data */
  TIMELINE_FALLBACK: 150,
} as const;

/**
 * Minimum segment duration in milliseconds.
 * Prevents segments from being too short for comfortable viewing.
 */
export const MIN_SEGMENT_DURATION_MS = 500;

/**
 * Fallback segment duration when no timing data is available.
 */
export const DEFAULT_SEGMENT_DURATION_MS = 4000;

// =============================================================================
// FRAME UTILITIES
// =============================================================================

/**
 * Convert milliseconds to frame number.
 * @param ms - Time in milliseconds
 * @param fps - Frames per second (default: 30)
 * @returns Frame number (floored)
 */
export function msToFrames(ms: number, fps: number = FPS): number {
  return Math.floor((ms / 1000) * fps);
}

/**
 * Convert frame number to milliseconds.
 * @param frames - Frame number
 * @param fps - Frames per second (default: 30)
 * @returns Time in milliseconds
 */
export function framesToMs(frames: number, fps: number = FPS): number {
  return (frames / fps) * 1000;
}

/**
 * Convert seconds to frame number.
 * @param seconds - Time in seconds
 * @param fps - Frames per second (default: 30)
 * @returns Frame number (rounded)
 */
export function secondsToFrames(seconds: number, fps: number = FPS): number {
  return Math.round(seconds * fps);
}

/**
 * Estimate duration in milliseconds from word count.
 * @param wordCount - Number of words
 * @param wpm - Words per minute (default: TIMELINE_FALLBACK)
 * @returns Estimated duration in milliseconds
 */
export function estimateDurationFromWords(
  wordCount: number,
  wpm: number = WORDS_PER_MINUTE.TIMELINE_FALLBACK
): number {
  return Math.max(MIN_SEGMENT_DURATION_MS, Math.round((wordCount / wpm) * 60000));
}

/**
 * Count words in a text string.
 * @param text - Input text
 * @returns Number of words
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// =============================================================================
// AUDIO DUCKING DEFAULTS
// =============================================================================

/**
 * Default music ducking configuration.
 * Controls how background music volume is reduced during narration.
 */
export const DEFAULT_MUSIC_DUCKING = {
  /** Volume reduction factor (0.4 = drop to 60% volume) */
  reduction: 0.4,
  /** Frames to fade down */
  attackFrames: 10,
  /** Frames to fade back up */
  releaseFrames: 14,
  /** Minimum volume floor */
  floorVolume: 0.1,
  /** Whether ducking is enabled */
  enabled: true,
} as const;

// =============================================================================
// VIDEO INTRO/OUTRO
// =============================================================================

export const INTRO_DURATION_MS = 1000;
export const INTRO_DURATION = Math.round((INTRO_DURATION_MS / 1000) * FPS);

// =============================================================================
// DIMENSIONS
// =============================================================================

// Legacy dimensions (9:16 vertical)
export const IMAGE_WIDTH = 1024;
export const IMAGE_HEIGHT = 1792;

// Composition dimensions by aspect ratio
export const DIMENSIONS = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
} as const;

// Default aspect ratio (YouTube horizontal - 16:9)
export const DEFAULT_ASPECT_RATIO = "16:9" as const;

// Canvas aspect ratio for viewport calculations
export const CANVAS_ASPECT_RATIO = 16 / 9;
