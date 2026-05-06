import type { GeneratedScene } from "./schema";

export interface SceneFrameRange {
  scene: GeneratedScene;
  startFrame: number;
  endFrame: number;
}

export function getSceneFrameRanges(
  scenes: GeneratedScene[]
): SceneFrameRange[] {
  let cursor = 0;
  return scenes.map((scene) => {
    const startFrame = cursor;
    const endFrame = startFrame + scene.durationFrames;
    cursor = endFrame;
    return { scene, startFrame, endFrame };
  });
}

export function getLocalFrame(frame: number, startFrame: number): number {
  return Math.max(0, frame - startFrame);
}

export function getEntranceDuration(durationFrames: number): number {
  return Math.min(24, Math.max(8, Math.round(durationFrames * 0.18)));
}

export function getExitStart(durationFrames: number): number {
  return Math.max(0, durationFrames - getEntranceDuration(durationFrames));
}
