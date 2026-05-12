import { spring } from "remotion";
import type { MotionContext, MotionResult, MotionEntry } from "./types";

export const name = "bounce" as const;

export const catalogEntry: MotionEntry = {
  name,
  whenToUse: "Elastic, springy objects. Use for: balls, spheres, logos, app icons, bubbles.",
  exampleObjects: ["ball", "sphere", "logo", "icon", "bubble", "rubber"],
};

export function apply({ localFrame, fps, baseScale }: MotionContext): MotionResult {
  const s = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: baseScale,
    config: { damping: 3, stiffness: 280, mass: 0.6 },
  });
  const yOffset = (1 - s / baseScale) * -60;
  return { transform: `translateY(${yOffset}px) scale(${s})` };
}
