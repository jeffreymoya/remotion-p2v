import React from "react";
import { KenBurns, type KenBurnsPan } from "./anim/KenBurns";
import { EasingPreset } from "./common/easing";

const DIRECTIONS: readonly KenBurnsPan[] = [
  { x: [40, 0], y: [30, 0] },
  { x: [0, -40], y: [0, -30] },
  { x: [-40, 0], y: [30, 0] },
  { x: [40, 0], y: [-30, 0] },
  { x: [0, 40], y: [0, 30] },
  { x: [0, -40], y: [0, 30] },
  { x: [0, 40], y: [0, -30] },
];

const BASE_ZOOM_DELTA = 0.08;
const SUBTLE_SHOT_FRAMES = 75;
const FULL_MOTION_FRAMES = 210;
const MIN_MOTION_MULTIPLIER = 0.18;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getMotionMultiplier(durationInFrames: number): number {
  const frames = Math.max(1, durationInFrames);
  const progress = clamp01((frames - SUBTLE_SHOT_FRAMES) / (FULL_MOTION_FRAMES - SUBTLE_SHOT_FRAMES));
  return MIN_MOTION_MULTIPLIER + (1 - MIN_MOTION_MULTIPLIER) * progress;
}

export function getKenBurnsTransition(durationInFrames: number, shotIndex: number) {
  const dir = DIRECTIONS[shotIndex % DIRECTIONS.length];
  const motionMultiplier = getMotionMultiplier(durationInFrames);

  return {
    scale: [1, 1 + BASE_ZOOM_DELTA * motionMultiplier] as [number, number],
    x: [dir.x[0] * motionMultiplier, dir.x[1] * motionMultiplier] as [number, number],
    y: [dir.y[0] * motionMultiplier, dir.y[1] * motionMultiplier] as [number, number],
    frames: [0, durationInFrames] as [number, number],
    easing: "easeInOutSine" as const,
  };
}

interface DocuKenBurnsProps {
  durationInFrames: number;
  shotIndex: number;
  children: React.ReactNode;
}

export const DocuKenBurns: React.FC<DocuKenBurnsProps> = ({
  durationInFrames,
  shotIndex,
  children,
}) => {
  const motionMultiplier = getMotionMultiplier(durationInFrames);
  const directions = DIRECTIONS.map((dir) => ({
    x: [dir.x[0] * motionMultiplier, dir.x[1] * motionMultiplier] as [number, number],
    y: [dir.y[0] * motionMultiplier, dir.y[1] * motionMultiplier] as [number, number],
  }));

  return (
    <KenBurns
      shotIndex={shotIndex}
      durationInFrames={durationInFrames}
      fromScale={1}
      toScale={1 + BASE_ZOOM_DELTA * motionMultiplier}
      directions={directions}
      easing={EasingPreset.EaseInOutSine}
    >
      {children}
    </KenBurns>
  );
};
