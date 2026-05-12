import type { MotionContext, MotionResult, MotionEntry } from "./types";

export const name = "float" as const;

export const catalogEntry: MotionEntry = {
  name,
  whenToUse: "Lightweight, drifting objects. Use for: clouds, particles, dust, feathers, balloons.",
  exampleObjects: ["cloud", "particle", "dust", "feather", "balloon", "bubble"],
};

export function apply({ localFrame }: MotionContext): MotionResult {
  const y = Math.sin(localFrame * 0.04) * 12;
  const x = Math.sin(localFrame * 0.027) * 6;
  return { transform: `translate(${x}px, ${y}px)` };
}
