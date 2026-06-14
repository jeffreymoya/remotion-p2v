import { Easing } from "remotion";

/**
 * Serializable easing presets. Remotion `Easing` functions are not
 * serializable, so Zod schemas and Studio controls carry the enum value and
 * components resolve it to a function via {@link resolveEasing}.
 *
 * Bezier presets reproduce the `cubic-bezier(...)` curves used in
 * `kinetic typography/patterns.css`.
 */
export enum EasingPreset {
  Linear = "linear",
  EaseOut = "easeOut",
  EaseInOut = "easeInOut",
  CubicOut = "cubicOut",
  /** cubic-bezier(0.22, 1, 0.36, 1) — smooth word/blur reveals */
  Smooth = "smooth",
  /** cubic-bezier(0.65, 0, 0.35, 1) — redaction / highlighter swipes */
  Swipe = "swipe",
  /** cubic-bezier(0.16, 1, 0.3, 1) — evidence stamp slam */
  Slam = "slam",
}

type EasingFn = (input: number) => number;

const PRESETS: Record<EasingPreset, EasingFn> = {
  [EasingPreset.Linear]: Easing.linear,
  [EasingPreset.EaseOut]: Easing.out(Easing.ease),
  [EasingPreset.EaseInOut]: Easing.inOut(Easing.ease),
  [EasingPreset.CubicOut]: Easing.out(Easing.cubic),
  [EasingPreset.Smooth]: Easing.bezier(0.22, 1, 0.36, 1),
  [EasingPreset.Swipe]: Easing.bezier(0.65, 0, 0.35, 1),
  [EasingPreset.Slam]: Easing.bezier(0.16, 1, 0.3, 1),
};

export const resolveEasing = (preset: EasingPreset): EasingFn =>
  PRESETS[preset];
