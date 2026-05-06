import type { CSSProperties } from "react";
import { interpolate, spring } from "remotion";

import type { AnimationOpType, ElementTimeline, SceneAnimationPlan } from "./schema";

const ENTER_DURATION_CAP = 18;
const EXIT_DURATION_CAP = 15;
const ENTER_Y_OFFSET = 30;
const EXIT_Y_OFFSET = -20;
const ENTER_SCALE_START = 0.97;
const REVEAL_SCALE_START = 0.9;
const HIGHLIGHT_SCALE_PEAK = 1.05;

function findActiveOp(
  ops: ElementTimeline["ops"],
  frame: number
): { opIndex: number; localFrame: number } | null {
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (frame >= op.startFrame && frame < op.startFrame + op.durationFrames) {
      return { opIndex: i, localFrame: frame - op.startFrame };
    }
  }
  return null;
}

function animateOp(
  type: AnimationOpType,
  localFrame: number,
  durationFrames: number,
  fps: number
): CSSProperties {
  switch (type) {
    case "enter": {
      const effectiveDuration = Math.min(durationFrames, ENTER_DURATION_CAP);
      const s = spring({
        frame: localFrame,
        fps,
        config: { damping: 16, stiffness: 130, mass: 0.8 },
        durationInFrames: effectiveDuration,
      });
      return {
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [ENTER_Y_OFFSET, 0])}px) scale(${interpolate(s, [0, 1], [ENTER_SCALE_START, 1])})`,
      };
    }
    case "exit": {
      const effectiveDuration = Math.min(durationFrames, EXIT_DURATION_CAP);
      const progress = interpolate(
        localFrame,
        [0, effectiveDuration],
        [0, 1],
        { extrapolateRight: "clamp" }
      );
      return {
        opacity: interpolate(progress, [0, 1], [1, 0]),
        transform: `translateY(${interpolate(progress, [0, 1], [0, EXIT_Y_OFFSET])}px)`,
      };
    }
    case "highlight": {
      const progress = interpolate(localFrame, [0, durationFrames], [0, 1], {
        extrapolateRight: "clamp",
      });
      const pulse = interpolate(progress, [0, 0.5, 1], [1, HIGHLIGHT_SCALE_PEAK, 1]);
      const glow = interpolate(progress, [0, 0.5, 1], [0, 0.3, 0]);
      return {
        transform: `scale(${pulse})`,
        boxShadow: `0 0 ${interpolate(progress, [0, 0.5, 1], [0, 28, 0])}px rgba(56, 189, 248, ${glow})`,
      };
    }
    case "reveal": {
      const effectiveDuration = Math.min(durationFrames, 20);
      const s = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 110, mass: 0.9 },
        durationInFrames: effectiveDuration,
      });
      return {
        opacity: s,
        transform: `scale(${interpolate(s, [0, 1], [REVEAL_SCALE_START, 1])})`,
        clipPath: `inset(${interpolate(s, [0, 1], [100, 0])}% 0% 0% 0%)`,
      };
    }
    case "retention-beat": {
      const progress = interpolate(localFrame, [0, durationFrames], [0, 1], {
        extrapolateRight: "clamp",
      });
      const beat = interpolate(progress, [0, 0.15, 0.3, 1], [1, 1.04, 1, 1]);
      return { transform: `scale(${beat})` };
    }
    case "hold":
    default:
      return { opacity: 1 };
  }
}

function computeElementAnimation(
  element: ElementTimeline,
  currentFrame: number,
  fps: number
): CSSProperties | null {
  const active = findActiveOp(element.ops, currentFrame);
  if (!active) return null;

  const op = element.ops[active.opIndex];
  return animateOp(op.type, active.localFrame, op.durationFrames, fps);
}

export function computeSceneSlotStyles(
  scenePlan: SceneAnimationPlan,
  currentFrame: number,
  fps: number
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {};

  for (const element of scenePlan.elements) {
    const elementStyle = computeElementAnimation(element, currentFrame, fps);
    if (elementStyle) {
      styles[element.element] = elementStyle;
    }
  }

  return styles;
}

export function computeSceneDurationFromPlan(
  scenePlan: SceneAnimationPlan
): number {
  return scenePlan.totalFrames;
}
