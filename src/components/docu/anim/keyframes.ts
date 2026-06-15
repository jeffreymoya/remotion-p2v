import type { CSSProperties } from "react";
import { interpolate } from "remotion";
import { EasingPreset, resolveEasing } from "../common/easing";

/**
 * Element-level keyframe helpers returning `CSSProperties` for arbitrary
 * (often SVG) nodes — the building blocks the charts animate with. This is the
 * single source for fade / pop / grow motion; it replaces the external
 * `overlay-animations` style-preset lib so there is one animation system.
 *
 * All helpers share the `(frame, startFrame, delay, dur)` timing signature so
 * call sites read consistently and stagger via the `delay` argument.
 */

const ramp = (
  frame: number,
  startFrame: number,
  delay: number,
  dur: number,
  easing: EasingPreset,
): number => {
  const f0 = startFrame + delay;
  return interpolate(frame, [f0, f0 + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(easing),
  });
};

/** Opacity 0 → 1. */
export const fadeIn = (
  frame: number,
  startFrame: number,
  delay: number,
  dur: number,
): CSSProperties => ({
  opacity: ramp(frame, startFrame, delay, dur, EasingPreset.Smooth),
});

/** Opacity 0 → 1 with a short upward drift. */
export const fadeUp = (
  frame: number,
  startFrame: number,
  delay: number,
  dur: number,
  distance = 8,
): CSSProperties => {
  const t = ramp(frame, startFrame, delay, dur, EasingPreset.Smooth);
  return { opacity: t, transform: `translateY(${(1 - t) * distance}px)` };
};

/** Spring scale pop, fading opacity over the first 45% of the ramp. */
export const popIn = (
  frame: number,
  startFrame: number,
  delay: number,
  dur: number,
  originX?: number,
  originY?: number,
): CSSProperties => {
  const f0 = startFrame + delay;
  const t = ramp(frame, startFrame, delay, dur, EasingPreset.Spring);
  const opacity = interpolate(frame, [f0, f0 + dur * 0.45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    opacity,
    transform: `scale(${t})`,
    transformOrigin: originX != null ? `${originX}px ${originY ?? 0}px` : "center",
  };
};

const grow = (
  frame: number,
  startFrame: number,
  delay: number,
  dur: number,
  axis: "x" | "y",
  originX = 0,
  originY = 0,
): CSSProperties => {
  const t = ramp(frame, startFrame, delay, dur, EasingPreset.Spring);
  return {
    transform: axis === "x" ? `scale(${t}, 1)` : `scale(1, ${t})`,
    transformOrigin: `${originX}px ${originY}px`,
  };
};

/** Scale from an origin along the X axis (horizontal bar grow). */
export const growX = (
  frame: number,
  startFrame: number,
  delay: number,
  dur: number,
  originX = 0,
  originY = 0,
): CSSProperties => grow(frame, startFrame, delay, dur, "x", originX, originY);

/** Scale from an origin along the Y axis (vertical bar grow). */
export const growY = (
  frame: number,
  startFrame: number,
  delay: number,
  dur: number,
  originX = 0,
  originY = 0,
): CSSProperties => grow(frame, startFrame, delay, dur, "y", originX, originY);
