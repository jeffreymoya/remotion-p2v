import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EasingPreset, resolveEasing } from "../common/easing";
import type { Lifecycle } from "../common/types";

export interface LifecycleState {
  /** Entrance progress, 0 → 1 across `inFrames` after `delay`. */
  enter: number;
  /** Exit progress, 0 (fully present) → 1 (fully gone) across `outFrames`. */
  exit: number;
  /** Convenience opacity factor combining entrance and exit. */
  opacity: number;
}

/**
 * Frame-driven replacement for the looping CSS keyframes: entrance ramp after
 * an optional delay, a hold, then an optional exit anchored to the end of the
 * enclosing Sequence.
 */
export const useLifecycle = (
  lifecycle: Lifecycle,
  enterEasing: EasingPreset = EasingPreset.Smooth,
): LifecycleState => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { delay, inFrames, outFrames } = lifecycle;

  const enter = interpolate(frame, [delay, delay + inFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(enterEasing),
  });

  const exitStart = durationInFrames - outFrames;
  const exit =
    outFrames > 0
      ? interpolate(frame, [exitStart, durationInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: resolveEasing(EasingPreset.EaseInOut),
        })
      : 0;

  return { enter, exit, opacity: enter * (1 - exit) };
};
