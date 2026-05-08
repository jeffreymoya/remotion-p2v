import React from "react";
import { interpolate } from "remotion";

interface SceneProps {
  frameRange: [number, number];
  frame: number;
  crossFadeFrames?: number;
  children: React.ReactNode;
}

export const Scene: React.FC<SceneProps> = ({
  frameRange,
  frame,
  crossFadeFrames = 15,
  children,
}) => {
  const [start, end] = frameRange;

  if (frame < start - crossFadeFrames || frame > end + crossFadeFrames) {
    return null;
  }

  const opacity = interpolate(
    frame,
    [start - crossFadeFrames, start, end, end + crossFadeFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      {children}
    </div>
  );
};
