import { interpolate } from "remotion";
import { EasingPreset, resolveEasing } from "../common/easing";

export interface CountUpConfig {
  target: number;
  startFrame: number;
  durFrames: number;
  easing?: EasingPreset;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Frame-driven numeric count-up from 0 → `target`. Single source for both the
 * formatted string helper below and the charts' animated values.
 */
export const countUp = (
  frame: number,
  target: number,
  startFrame: number,
  durFrames: number,
  easing: EasingPreset = EasingPreset.CubicOut,
): number =>
  interpolate(frame, [startFrame, startFrame + durFrames], [0, target], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(easing),
  });

/**
 * Frame-driven count-up formatted as a string. Replaces the
 * `requestAnimationFrame` loop in `kinetic typography/patterns.js`; runs once
 * over `durFrames` (Remotion is one-shot rather than looping).
 */
export const formatCountUp = (frame: number, config: CountUpConfig): string => {
  const {
    target,
    startFrame,
    durFrames,
    easing = EasingPreset.CubicOut,
    decimals = 1,
    prefix = "",
    suffix = "",
  } = config;

  const value = countUp(frame, target, startFrame, durFrames, easing).toFixed(
    decimals,
  );
  return prefix + value + suffix;
};
