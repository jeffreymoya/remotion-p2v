import type { MotionContext, MotionResult, MotionEntry } from "./types";

export const name = "static" as const;

export const catalogEntry: MotionEntry = {
  name,
  whenToUse: "Default. Object uses the entrance animation only, no sustained motion after entry.",
  exampleObjects: [],
};

export function apply(_ctx: MotionContext): MotionResult {
  return { transform: "none" };
}
