import { AudioElement, MusicElement } from "@/src/lib/storyflow/timeline-types";

type DuckingInput = Required<NonNullable<MusicElement["ducking"]>>;

const DEFAULTS: DuckingInput = {
  reduction: 0.4,
  attackFrames: 10,
  releaseFrames: 14,
  floorVolume: 0.1,
  enabled: true,
};

interface Span {
  start: number;
  end: number;
}

/**
 * Compute music volume for the given frame, applying ducking against narration spans.
 * The returned value should be multiplied by the base music volume (0-1).
 */
export function musicVolumeAtFrame(
  frame: number,
  music: MusicElement,
  narration: AudioElement[],
  introFrames = 0
): number {
  const config: DuckingInput = { ...DEFAULTS, ...(music.ducking || {}) };
  if (!config.enabled) return music.volume;

  const spans: Span[] = narration.map((audio) => ({
    start: audio.startFrame + introFrames,
    end: audio.endFrame + introFrames,
  }));

  const duckFactor = spans.length ? Math.min(...spans.map((span) => duckFactorForSpan(frame, span, config))) : 1;
  return music.volume * clamp(duckFactor, config.floorVolume, 1);
}

function duckFactorForSpan(frame: number, span: Span, config: DuckingInput): number {
  const duckedVolume = Math.max(1 - config.reduction, config.floorVolume ?? 0);

  // Before attack window
  if (frame < span.start - config.attackFrames) return 1;

  // Attack (ramp down)
  if (frame < span.start) {
    const progress = 1 - (span.start - frame) / config.attackFrames; // 0 -> 1
    return lerp(1, duckedVolume, progress);
  }

  // Sustained ducking
  if (frame >= span.start && frame <= span.end) {
    return duckedVolume;
  }

  // Release (ramp up)
  if (frame > span.end && frame <= span.end + config.releaseFrames) {
    const progress = (frame - span.end) / config.releaseFrames; // 0 -> 1
    return lerp(duckedVolume, 1, progress);
  }

  // After release
  return 1;
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * clamp(t, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
