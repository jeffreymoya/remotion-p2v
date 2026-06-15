import { interpolate, useCurrentFrame } from "remotion";

/**
 * 0 → 1 ramp over `[startFrame, endFrame]`, optionally pre-multiplied by the
 * card's exit fade. Replaces the dozens of inline
 * `interpolate(frame, [a, b], [0, 1], clamp) * (1 - exit)` expressions across
 * the cards so the fade-in pattern lives in one place. The returned factor is
 * applied by the caller as an opacity, a width or a scale.
 */
export const useFade = (
  startFrame: number,
  endFrame: number,
  exit = 0,
): number => {
  const frame = useCurrentFrame();
  return (
    interpolate(frame, [startFrame, endFrame], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    (1 - exit)
  );
};
