export interface MotionContext {
  localFrame: number;
  fps: number;
  duration: number;
  baseScale: number;
}

export interface MotionResult {
  transform: string;
  opacity?: number;
}

export interface MotionEntry {
  name: string;
  whenToUse: string;
  exampleObjects: string[];
}

export type MotionFn = (ctx: MotionContext) => MotionResult;
