import { staticFile } from "remotion";
import { BackgroundElement, Timeline } from "./types";
import { FPS, INTRO_DURATION, DEFAULT_ASPECT_RATIO } from "./constants";

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

export const loadTimelineFromFile = async (filename: string) => {
  const res = await fetch(staticFile(filename));
  const json = await res.json();
  let timeline = json as Timeline;

  // Normalize legacy timelines
  timeline = normalizeTimeline(timeline);

  // Sort elements by start time
  timeline.elements.sort((a, b) => a.startMs - b.startMs);

  const lengthMs =
    timeline.elements.length > 0
      ? timeline.elements[timeline.elements.length - 1].endMs / 1000
      : 0;
  const lengthFrames = Math.floor(lengthMs * FPS);

  return { timeline, lengthFrames };
};

export const calculateFrameTiming = (
  startMs: number,
  endMs: number,
  options: { includeIntro?: boolean; addIntroOffset?: boolean } = {},
) => {
  const { includeIntro = false, addIntroOffset = false } = options;

  const startFrame =
    (startMs * FPS) / 1000 + (addIntroOffset ? INTRO_DURATION : 0);
  const duration =
    ((endMs - startMs) * FPS) / 1000 + (includeIntro ? INTRO_DURATION : 0);

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

