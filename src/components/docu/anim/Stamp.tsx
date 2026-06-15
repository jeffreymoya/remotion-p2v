import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EasingPreset, resolveEasing } from "../common/easing";
import { MOTION } from "../common/tokens";

export interface StampProps {
  startFrame: number;
  durFrames?: number;
  fromScale?: number;
  toScale?: number;
  fromRotate?: number;
  toRotate?: number;
  fromBlur?: number;
  easing?: EasingPreset;
  exit?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Slam/jitter entrance helper. Replaces the `stamp-slam` and `stamp-jitter`
 * CSS keyframes with a single frame-driven scale + rotate + blur settle.
 */
export const Stamp: React.FC<StampProps> = ({
  startFrame,
  durFrames = 12,
  fromScale = 3.4,
  toScale = 1,
  fromRotate = -25,
  toRotate = -8,
  fromBlur = 8,
  easing = EasingPreset.Slam,
  exit = 0,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const ease = resolveEasing(easing);
  const progress = interpolate(frame, [startFrame, startFrame + durFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + Math.max(1, durFrames * 0.25)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = toScale + (fromScale - toScale) * (1 - progress);
  const rotate = toRotate + (fromRotate - toRotate) * (1 - progress);
  const blurPx = fromBlur * Math.max(0, 1 - progress / MOTION.stampBlurDecayPortion);

  return (
    <div
      style={{
        ...style,
        opacity: opacity * (1 - exit),
        transform: `rotate(${rotate}deg) scale(${scale})`,
        filter: blurPx > 0.01 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};
