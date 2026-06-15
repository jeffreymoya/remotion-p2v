// src/components/geom/draw.ts
import { useCurrentFrame } from "remotion";
import { EasingPreset, resolveEasing } from "../docu/common/easing";

/** A value exposing a numeric `y`, e.g. a chart point. */
export interface YValue {
  readonly y: number;
}

/**
 * Smooth cubic-Bézier path through `pts`. `toX`/`toY` map an index/value into
 * user space; `offset` shifts the x-index (used to continue a forecast
 * segment). Promoted from `charts/path.ts` so any scene can draw curves.
 */
export const smoothPath = (
  pts: readonly YValue[],
  toX: (i: number) => number,
  toY: (v: number) => number,
  offset = 0,
): string => {
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    const px = toX(offset + i);
    const py = toY(pts[i].y);
    if (i === 0) {
      d += `M ${px} ${py}`;
    } else {
      const px0 = toX(offset + i - 1);
      const py0 = toY(pts[i - 1].y);
      const cxm = px0 + (px - px0) * 0.5;
      d += ` C ${cxm} ${py0} ${cxm} ${py} ${px} ${py}`;
    }
  }
  return d;
};

const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));

/** Eased 0..1 progress for a draw-on starting at `startFrame`. Pure. */
export const drawProgress = (
  frame: number,
  startFrame: number,
  durationInFrames: number,
  easing: EasingPreset = EasingPreset.Smooth,
): number =>
  resolveEasing(easing)(clamp01((frame - startFrame) / durationInFrames));

/** Stroke dash props that reveal a path of length `length` at `progress` (0..1). */
export const dashFor = (
  length: number,
  progress: number,
): { readonly strokeDasharray: number; readonly strokeDashoffset: number } => ({
  strokeDasharray: length,
  strokeDashoffset: length * (1 - progress),
});

/** Frame-driven stroke draw-on for a path/line of known `length`. */
export const useDrawOn = (
  length: number,
  startFrame: number,
  durationInFrames: number,
  easing?: EasingPreset,
): { readonly strokeDasharray: number; readonly strokeDashoffset: number } => {
  const frame = useCurrentFrame();
  return dashFor(length, drawProgress(frame, startFrame, durationInFrames, easing));
};
