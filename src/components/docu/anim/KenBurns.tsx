import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EasingPreset, resolveEasing } from "../common/easing";

/** A pan from → to (in px) along each axis. */
export interface KenBurnsPan {
  x: [number, number];
  y: [number, number];
}

/** Cyclic pan directions; `shotIndex` selects one (wrapping). */
const DEFAULT_DIRECTIONS: readonly KenBurnsPan[] = [
  { x: [40, 0], y: [30, 0] },
  { x: [0, -40], y: [0, -30] },
  { x: [-40, 0], y: [30, 0] },
  { x: [40, 0], y: [-30, 0] },
  { x: [0, 40], y: [0, 30] },
  { x: [0, -40], y: [0, 30] },
  { x: [0, 40], y: [0, -30] },
];

export interface KenBurnsProps {
  children: React.ReactNode;
  /** Selects a pan direction from `directions` (wraps). */
  shotIndex?: number;
  /** Animation span; defaults to the composition duration. */
  durationInFrames?: number;
  fromScale?: number;
  toScale?: number;
  directions?: readonly KenBurnsPan[];
  easing?: EasingPreset;
}

/**
 * Slow pan + zoom (Ken Burns) wrapper. Frame-driven replacement for the
 * `remotion-bits` `StaggeredMotion` original — no extra dependency, and every
 * value (scale range, pan amplitude, direction set, easing) is overridable.
 */
export const KenBurns: React.FC<KenBurnsProps> = ({
  children,
  shotIndex = 0,
  durationInFrames,
  fromScale = 1.0,
  toScale = 1.08,
  directions = DEFAULT_DIRECTIONS,
  easing = EasingPreset.EaseInOutSine,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const span = durationInFrames ?? total;
  const dir = directions[shotIndex % directions.length];
  const ease = resolveEasing(easing);

  const at = (range: [number, number]): number =>
    interpolate(frame, [0, span], range, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${at([fromScale, toScale])}) translate(${at(dir.x)}px, ${at(dir.y)}px)`,
        transformOrigin: "center",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};
