import type { MotionContext, MotionResult, MotionEntry } from "./types";

export const name = "wave" as const;

export const catalogEntry: MotionEntry = {
  name,
  whenToUse: "Fluid, flowing objects. Use for: water, flags, ribbons, fabric, hair.",
  exampleObjects: ["wave", "flag", "ribbon", "water", "ocean", "fabric"],
};

export function apply({ localFrame }: MotionContext): MotionResult {
  return { transform: `translateY(${Math.sin(localFrame * 0.15) * 18}px)` };
}
