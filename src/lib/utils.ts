import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { staticFile } from "remotion";
import { BackgroundElement, Timeline } from "./types";
import { FPS, DEFAULT_ASPECT_RATIO, INTRO_DURATION_MS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a legacy timeline by adding default values for new optional fields.
 * This ensures backward compatibility with timelines created before schema extension.
 */
export const normalizeTimeline = (timeline: Record<string, unknown>): Timeline => {
  const normalized = { ...timeline };

  // Handle legacy format: convert "backgrounds" to "elements"
  if (timeline.backgrounds && !timeline.elements) {
    normalized.elements = timeline.backgrounds;
    delete normalized.backgrounds;
  }

  // Handle legacy format: convert "title" to "shortTitle"
  if (timeline.title && !timeline.shortTitle) {
    normalized.shortTitle = timeline.title;
    delete normalized.title;
  }

  // Ensure elements array exists
  if (!normalized.elements) {
    normalized.elements = [];
  }

  // Ensure text array exists
  if (!normalized.text) {
    normalized.text = [];
  }

  // Ensure audio array exists
  if (!normalized.audio) {
    normalized.audio = [];
  }

  // Add default aspect ratio if not present
  if (!normalized.aspectRatio) {
    normalized.aspectRatio = DEFAULT_ASPECT_RATIO;
  }

  // Calculate duration from elements if not provided
  const elements = normalized.elements as Array<{ endMs: number }> | undefined;
  if (!normalized.durationSeconds && elements && elements.length > 0) {
    const lastElement = elements[elements.length - 1];
    normalized.durationSeconds = lastElement.endMs / 1000;
  }

  // Initialize optional arrays if not present
  if (!normalized.videoClips) {
    normalized.videoClips = [];
  }

  if (!normalized.backgroundMusic) {
    normalized.backgroundMusic = [];
  }

  return normalized as Timeline;
};

export const loadTimelineFromFile = async (filename: string, fps: number = FPS) => {
  const res = await fetch(staticFile(filename));
  const json = await res.json();
  let timeline = json as Timeline;

  // Normalize legacy timelines
  timeline = normalizeTimeline(timeline);

  // Sort elements by start time (normalizeTimeline ensures elements array exists)
  if (timeline.elements && timeline.elements.length > 0) {
    timeline.elements.sort((a, b) => a.startMs - b.startMs);
  }

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
  let protectedText = text;
  abbreviations.forEach((abbr, idx) => {
    const regex = new RegExp(`\\b${abbr}\\.`, 'g');
    protectedText = protectedText.replace(regex, `${abbr}⸱${idx}⸱`);
  });

  // Protect decimals (number.number)
  protectedText = protectedText.replace(/(\d)\.(\d)/g, '$1⸱DEC⸱$2');

  // Protect ellipsis (... or ..)
  protectedText = protectedText.replace(/\.{2,}/g, '⸱ELLIPSIS⸱');

  // Split on sentence-ending punctuation, keeping the punctuation
  const sentences = protectedText.match(/[^.!?]+[.!?]+/g) || [];

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
    const remaining = protectedText.substring(matched.length).trim();
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

