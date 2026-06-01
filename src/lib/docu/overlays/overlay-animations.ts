import { interpolate, Easing } from "remotion";
import type React from "react";
import { SPRING_BEZIER, EASE_BEZIER } from "../../../components/docu/docu-tokens";

const spring = Easing.bezier(...SPRING_BEZIER);
const ease = Easing.bezier(...EASE_BEZIER);

// ── Style presets (return CSSProperties) ──────────────────────────────────

export function fadeUp(
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
): React.CSSProperties {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return {
    opacity: t,
    transform: `translateY(${interpolate(t, [0, 1], [8, 0])}px)`,
  };
}

export function fadeIn(
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
): React.CSSProperties {
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

export function slideUp(
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
  translateY?: number,
): React.CSSProperties {
  const dist = translateY ?? 16;
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return {
    opacity: t,
    transform: `translateY(${interpolate(t, [0, 1], [dist, 0])}px)`,
  };
}

export function wipe(
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
  fullWidth?: number,
): React.CSSProperties {
  const w = fullWidth ?? 1920;
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return { clipPath: `inset(0 ${w - w * t}px 0 0)` };
}

export function growX(
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
  originX?: number, originY?: number,
): React.CSSProperties {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: spring });
  return { transform: `scale(${t}, 1)`, transformOrigin: `${originX ?? 0}px ${originY ?? 0}px` };
}

export function growY(
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
  originX?: number, originY?: number,
): React.CSSProperties {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  const t = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: spring });
  return { transform: `scale(1, ${t})`, transformOrigin: `${originX ?? 0}px ${originY ?? 0}px` };
}

// ── Value presets (return number) ────────────────────────────────────────

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

export function typewriterChars(
  frame: number, startFrame: number, delayFrames: number, durFrames: number, target: number,
): number {
  const f0 = startFrame + delayFrames;
  const f1 = f0 + durFrames;
  return Math.round(interpolate(frame, [f0, f1], [0, target], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: ease,
  }));
}

// ── Preset key enums (used by Zod schema validation) ─────────────────────

export const ENTER_PRESET_KEYS = [
  "fadeUp", "fadeIn", "popIn", "slideUp", "wipe", "countUp", "none",
] as const;

export type EnterPresetKey = typeof ENTER_PRESET_KEYS[number];

export const EXIT_PRESET_KEYS = [
  "fadeUp", "fadeIn", "popIn", "slideUp", "wipe", "none",
] as const;

export type ExitPresetKey = typeof EXIT_PRESET_KEYS[number];

// ── Registry types ───────────────────────────────────────────────────────

export type StyleTransitionFn = (
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
  ...args: number[]
) => React.CSSProperties;

export type ValueTransitionFn = (
  frame: number, startFrame: number, delayFrames: number, durFrames: number,
  target: number,
) => number;

export interface StylePresetDef {
  channel: "style";
  fn: StyleTransitionFn;
  description: string;
}

export interface ValuePresetDef {
  channel: "value";
  fn: ValueTransitionFn;
  description: string;
}

export type PresetDef = StylePresetDef | ValuePresetDef;

// ── Registry (source of truth for available presets) ─────────────────────

export const PRESET_REGISTRY: Record<string, PresetDef> = {
  fadeUp: { channel: "style", fn: fadeUp, description: "Fade in + slide up 8px" },
  fadeIn: { channel: "style", fn: fadeIn, description: "Fade in (opacity 0→1)" },
  popIn: { channel: "style", fn: (frame, startFrame, delayFrames, durFrames, ...args) => popIn(frame, startFrame, delayFrames, durFrames, args[0], args[1]), description: "Spring scale pop-in" },
  slideUp: { channel: "style", fn: (frame, startFrame, delayFrames, durFrames, ...args) => slideUp(frame, startFrame, delayFrames, durFrames, args[0]), description: "Fade in + configurable slide up (default 16px)" },
  wipe: { channel: "style", fn: (frame, startFrame, delayFrames, durFrames, ...args) => wipe(frame, startFrame, delayFrames, durFrames, args[0]), description: "Horizontal clip wipe left→right" },
  growX: { channel: "style", fn: (frame, startFrame, delayFrames, durFrames, ...args) => growX(frame, startFrame, delayFrames, durFrames, args[0], args[1]), description: "Scale from origin along X axis" },
  growY: { channel: "style", fn: (frame, startFrame, delayFrames, durFrames, ...args) => growY(frame, startFrame, delayFrames, durFrames, args[0], args[1]), description: "Scale from origin along Y axis" },
  countUp: { channel: "value", fn: countUpValue, description: "Count-up number from 0 to target" },
  typewriter: { channel: "value", fn: typewriterChars, description: "Typewriter character reveal" },
  none: { channel: "style", fn: () => ({} as React.CSSProperties), description: "No animation (identity)" },
};

// ── Helpers ──────────────────────────────────────────────────────────────

export function getEnterPreset(key: string): PresetDef {
  const preset = PRESET_REGISTRY[key];
  if (!preset) throw new Error(`[animations] Unknown enter preset: "${key}". Available: ${Object.keys(PRESET_REGISTRY).join(", ")}`);
  return preset;
}

export function serializePresetMenu(): string {
  return Object.entries(PRESET_REGISTRY)
    .filter(([k]) => k !== "none")
    .map(([key, def]) => `- ${key}: ${def.description}`)
    .join("\n");
}
