import { interpolate, Easing } from "remotion";
import type React from "react";
import { SPRING_BEZIER, EASE_BEZIER } from "./docu-tokens";

const spring = Easing.bezier(...SPRING_BEZIER);
const ease   = Easing.bezier(...EASE_BEZIER);

export function fadeUp(frame: number, startFrame: number, delayFrames: number, durFrames: number): React.CSSProperties {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return {
    opacity: t,
    transform: `translateY(${interpolate(t, [0, 1], [8, 0])}px)`,
  };
}

export function fadeIn(frame: number, startFrame: number, delayFrames: number, durFrames: number): React.CSSProperties {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return { opacity: t };
}

export function popIn(
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
  originX?: number, originY?: number,
): React.CSSProperties {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: spring });
  return {
    opacity: interpolate(frame, [f0, f0 + durFrames * 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    transform: `scale(${t})`,
    transformOrigin: originX != null ? `${originX}px ${originY}px` : "center",
  };
}

export function countUpValue(
  frame: number, startFrame: number, delayFrames: number, durFrames: number, target: number,
): number {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  return interpolate(frame, [f0, f1], [0, target], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
}

export function growX(
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
  originX: number = 0, originY: number = 0,
): React.CSSProperties {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: spring });
  return { transform: `scale(${t}, 1)`, transformOrigin: `${originX}px ${originY}px` };
}

export function growY(
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
  originX: number = 0, originY: number = 0,
): React.CSSProperties {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: spring });
  return { transform: `scale(1, ${t})`, transformOrigin: `${originX}px ${originY}px` };
}
