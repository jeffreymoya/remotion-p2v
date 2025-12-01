import { staticFile } from "remotion";
import { BackgroundElement, Timeline } from "./types";
import { FPS, INTRO_DURATION, INTRO_DURATION_MS, DEFAULT_ASPECT_RATIO } from "./constants";

/**
 * Normalizes a legacy timeline by adding default values for new optional fields.
 * This ensures backward compatibility with timelines created before schema extension.
 */
export const normalizeTimeline = (timeline: Timeline): Timeline => {
  const normalized = { ...timeline };

  // Add default aspect ratio if not present
  if (!normalized.aspectRatio) {
    normalized.aspectRatio = DEFAULT_ASPECT_RATIO;
  }

  // Calculate duration from elements if not provided
  if (!normalized.durationSeconds && timeline.elements && timeline.elements.length > 0) {
    const lastElement = timeline.elements[timeline.elements.length - 1];
    normalized.durationSeconds = lastElement.endMs / 1000;
  }

  // Initialize optional arrays if not present
  if (!normalized.videoClips) {
    normalized.videoClips = [];
  }

  if (!normalized.backgroundMusic) {
    normalized.backgroundMusic = [];
  }

  return normalized;
};

export const loadTimelineFromFile = async (filename: string, fps: number = FPS) => {
  const res = await fetch(staticFile(filename));
  const json = await res.json();
  let timeline = json as Timeline;

  // Normalize legacy timelines
  timeline = normalizeTimeline(timeline);

  // Sort elements by start time
  timeline.elements.sort((a, b) => a.startMs - b.startMs);

  const frameCandidates: number[] = [];

  const collectFrames = (startFrame?: number, endFrame?: number, startMs?: number, endMs?: number) => {
    if (typeof endFrame === "number") {
      frameCandidates.push(endFrame);
      return;
    }

    if (typeof endMs === "number") {
      frameCandidates.push(Math.round((endMs / 1000) * fps));
    }
  };

  timeline.elements.forEach((el) => collectFrames(el.startFrame, el.endFrame, el.startMs, el.endMs));
  timeline.text.forEach((el) => collectFrames(el.startFrame, el.endFrame, el.startMs, el.endMs));
  timeline.audio.forEach((el) => collectFrames(el.startFrame, el.endFrame, el.startMs, el.endMs));

  const lengthFrames = frameCandidates.length > 0 ? Math.max(...frameCandidates) : 0;

  return { timeline, lengthFrames };
};

export const calculateFrameTiming = (
  startMs: number,
  endMs: number,
  fps: number = FPS,
  options: { includeIntro?: boolean; addIntroOffset?: boolean } = {},
) => {
  const { includeIntro = false, addIntroOffset = false } = options;

  const introFrames = Math.round((INTRO_DURATION_MS / 1000) * fps);

  const startFrame =
    (startMs * fps) / 1000 + (addIntroOffset ? introFrames : 0);
  const duration =
    ((endMs - startMs) * fps) / 1000 + (includeIntro ? introFrames : 0);

  return { startFrame, duration };
};

export const calculateBlur = ({
  item,
  localMs,
}: {
  item: BackgroundElement;
  localMs: number;
}) => {
  const maxBlur = 1;
  const fadeMs = 1000;

  const startMs = item.startMs;
  const endMs = item.endMs;

  const { enterTransition } = item;
  const { exitTransition } = item;

  if (enterTransition === "blur" && localMs < fadeMs) {
    return (1 - localMs / fadeMs) * maxBlur;
  }

  if (exitTransition === "blur" && localMs > endMs - startMs - fadeMs) {
    return (1 - (endMs - startMs - localMs) / fadeMs) * maxBlur;
  }

  return 0;
};

/**
 * Converts milliseconds to frames based on FPS.
 * Used for word-level subtitle timing.
 */
export const msToFrame = (ms: number, fps: number): number => {
  return Math.floor((ms * fps) / 1000);
};

/**
 * Removes stage directions from script text.
 * Conservative filtering: only removes brackets containing stage direction keywords
 * to avoid corrupting valid text like mathematical notation or citations.
 */
export const removeStageDirections = (text: string): string => {
  let cleaned = text;

  // Remove **(anything)** - these are clearly stage directions
  cleaned = cleaned.replace(/\*\*\([^)]+\)\*\*/g, '');

  // Define stage direction keywords
  const stageKeywords = [
    'intro', 'outro', 'music', 'fade', 'fades', 'fading',
    'applause', 'sfx', 'sound effect', 'pause', 'beat',
    'laughs', 'sighs', 'whispers', 'shouting', 'clears throat'
  ];

  const keywordPattern = stageKeywords.join('|');

  // Remove (text) ONLY if it contains stage keywords (case-insensitive)
  // Uses positive lookahead to check for keywords before removing
  const parenRegex = new RegExp(`\\((?=.*\\b(${keywordPattern})\\b)[^)]+\\)`, 'gi');
  cleaned = cleaned.replace(parenRegex, '');

  // Remove [text] ONLY if it contains stage keywords
  const bracketRegex = new RegExp(`\\[(?=.*\\b(${keywordPattern})\\b)[^\\]]+\\]`, 'gi');
  cleaned = cleaned.replace(bracketRegex, '');

  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};

/**
 * Splits text into sentences based on punctuation (.!?)
 * Handles edge cases like abbreviations, decimals, and ellipsis.
 */
export const splitIntoSentences = (text: string): string[] => {
  // Common abbreviations that shouldn't trigger sentence breaks
  const abbreviations = ['Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Sr', 'Jr', 'St', 'Ave', 'etc', 'vs', 'Vol', 'No', 'Fig'];

  // Protect abbreviations with placeholder
  let protected = text;
  abbreviations.forEach((abbr, idx) => {
    const regex = new RegExp(`\\b${abbr}\\.`, 'g');
    protected = protected.replace(regex, `${abbr}⸱${idx}⸱`);
  });

  // Protect decimals (number.number)
  protected = protected.replace(/(\d)\.(\d)/g, '$1⸱DEC⸱$2');

  // Protect ellipsis (... or ..)
  protected = protected.replace(/\.{2,}/g, '⸱ELLIPSIS⸱');

  // Split on sentence-ending punctuation, keeping the punctuation
  const sentences = protected.match(/[^.!?]+[.!?]+/g) || [];

  // Restore protected periods in matched sentences
  const restored = sentences.map(s => {
    let restored = s;
    abbreviations.forEach((abbr, idx) => {
      restored = restored.replace(new RegExp(`${abbr}⸱${idx}⸱`, 'g'), `${abbr}.`);
    });
    restored = restored.replace(/⸱DEC⸱/g, '.');
    restored = restored.replace(/⸱ELLIPSIS⸱/g, '...');
    return restored.trim();
  });

  // Handle remaining text without ending punctuation
  const matched = sentences.join('');
  const lastMatchLength = matched.replace(/⸱\w+⸱/g, '.').length;
  if (lastMatchLength < text.length) {
    const remaining = protected.substring(matched.length).trim();
    if (remaining) {
      // Restore protected chars in remaining text
      let restoredRemaining = remaining;
      abbreviations.forEach((abbr, idx) => {
        restoredRemaining = restoredRemaining.replace(new RegExp(`${abbr}⸱${idx}⸱`, 'g'), `${abbr}.`);
      });
      restoredRemaining = restoredRemaining.replace(/⸱DEC⸱/g, '.');
      restoredRemaining = restoredRemaining.replace(/⸱ELLIPSIS⸱/g, '...');
      restored.push(restoredRemaining);
    }
  }

  return restored.filter(s => s.length > 0);
};

/**
 * Calculates appropriate hold buffer based on word timing patterns
 */
export const calculateSpeakingVelocity = (words: Array<{ startMs: number; endMs: number }>): {
  avgWordDuration: number;
  avgGapDuration: number;
  wordsPerMinute: number;
} => {
  if (words.length < 2) {
    return { avgWordDuration: 500, avgGapDuration: 0, wordsPerMinute: 120 };
  }

  // Calculate average word duration
  const wordDurations = words.map(w => w.endMs - w.startMs);
  const avgWordDuration = wordDurations.reduce((a, b) => a + b, 0) / wordDurations.length;

  // Calculate gaps between words
  const gaps: number[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    const gap = words[i + 1].startMs - words[i].endMs;
    if (gap > 0) gaps.push(gap);
  }
  const avgGapDuration = gaps.length > 0
    ? gaps.reduce((a, b) => a + b, 0) / gaps.length
    : 0;

  // Calculate words per minute
  const totalDuration = words[words.length - 1].endMs - words[0].startMs;
  const wordsPerMinute = (words.length / totalDuration) * 60000;

  return { avgWordDuration, avgGapDuration, wordsPerMinute };
};
