import { interpolate } from "remotion";
import { EasingPreset, resolveEasing } from "../utils/easing";

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
 * Frame-driven count-up. Replaces the `requestAnimationFrame` loop in
 * `kinetic typography/patterns.js`; runs once over `durFrames` (Remotion is
 * one-shot rather than looping).
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

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: resolveEasing(easing),
    },
  );

  const value = (progress * target).toFixed(decimals);
  return prefix + value + suffix;
};
