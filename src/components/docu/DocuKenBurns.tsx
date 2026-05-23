import React from "react";
import { StaggeredMotion } from "remotion-bits";
import type { AnimatedValue } from "remotion-bits";

interface KenBurnsDirection {
  x: AnimatedValue;
  y: AnimatedValue;
}

const DIRECTIONS: KenBurnsDirection[] = [
  { x: [40, 0], y: [30, 0] },
  { x: [0, -40], y: [0, -30] },
  { x: [-40, 0], y: [30, 0] },
  { x: [40, 0], y: [-30, 0] },
  { x: [0, 40], y: [0, 30] },
  { x: [0, -40], y: [0, 30] },
  { x: [0, 40], y: [0, -30] },
];

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
  const dir = DIRECTIONS[shotIndex % DIRECTIONS.length];

  return (
    <StaggeredMotion
      transition={{
        scale: [1.0, 1.08],
        x: dir.x,
        y: dir.y,
        frames: [0, durationInFrames],
        easing: "easeInOutSine",
      }}
    >
      {children}
    </StaggeredMotion>
  );
};
