import type { WordTiming } from "./tts-elevenlabs";
import type { SceneBlockType } from "./scene-script-schema";

const MIN_BLOCK_FRAMES = 30;

export function alignBlocksToAudio(
  scenes: SceneBlockType[],
  wordTimings: WordTiming[],
  fps: number,
  totalFrames: number,
): SceneBlockType[] {
  if (wordTimings.length === 0 || scenes.length === 0) {
    return scenes;
  }

  const wordBoundaries = wordTimings.map((w) => w.startSeconds);

  function findNearestWordBoundary(seconds: number): number {
    let nearest = wordBoundaries[0];
    let minDist = Math.abs(seconds - nearest);

    for (const boundary of wordBoundaries) {
      const dist = Math.abs(seconds - boundary);
      if (dist < minDist) {
        minDist = dist;
        nearest = boundary;
      }
    }

    // Only snap if within ±0.5s
    return minDist <= 0.5 ? nearest : seconds;
  }

  const aligned: SceneBlockType[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const block = scenes[i];
    const [startFrame, endFrame] = block.frameRange;

    const startSeconds = startFrame / fps;
    const snappedStartSeconds = findNearestWordBoundary(startSeconds);
    let newStart = Math.round(snappedStartSeconds * fps);

    // Enforce minimum gap from previous block
    if (i > 0) {
      const prevEnd = aligned[i - 1].frameRange[1];
      if (newStart < prevEnd) {
        newStart = prevEnd;
      }
    }

    let newEnd: number;
    if (i === scenes.length - 1) {
      // Last block always extends to totalFrames
      newEnd = totalFrames;
    } else {
      const endSeconds = endFrame / fps;
      const snappedEndSeconds = findNearestWordBoundary(endSeconds);
      newEnd = Math.round(snappedEndSeconds * fps);
    }

    // Enforce minimum block duration
    if (newEnd - newStart < MIN_BLOCK_FRAMES) {
      newEnd = newStart + MIN_BLOCK_FRAMES;
    }

    // Clamp to total
    if (newEnd > totalFrames) {
      newEnd = totalFrames;
    }

    aligned.push({
      ...block,
      frameRange: [newStart, newEnd],
    } as SceneBlockType);
  }

  return aligned;
}
