import type { MotionContext, MotionResult, MotionEntry } from "./types";

export const name = "spin" as const;

export const catalogEntry: MotionEntry = {
  name,
  whenToUse: "Rotating mechanical or circular objects. Use for: gears, wheels, loading indicators, coins.",
  exampleObjects: ["gear", "wheel", "spinner", "coin", "disc", "planet"],
};

export function apply({ localFrame }: MotionContext): MotionResult {
  return { transform: `rotate(${localFrame * 3}deg)` };
}
