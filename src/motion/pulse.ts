import type { MotionContext, MotionResult, MotionEntry } from "./types";

export const name = "pulse" as const;

export const catalogEntry: MotionEntry = {
  name,
  whenToUse: "Objects that throb or beat. Use for: hearts, notifications, alerts, emphasis icons.",
  exampleObjects: ["heart", "notification", "alert", "ping", "badge"],
};

export function apply({ localFrame, baseScale }: MotionContext): MotionResult {
  const scale = baseScale + Math.sin(localFrame * 0.2) * 0.08 * baseScale;
  return { transform: `scale(${scale})` };
}
