import React from "react";
import { interpolate } from "remotion";

interface FadeTransitionProps {
  frame: number;
  startFrame: number;
  duration?: number;
  children: [React.ReactNode, React.ReactNode];
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  frame,
  startFrame,
  duration = 15,
  children,
}) => {
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - progress }}>
        {children[0]}
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: progress }}>
        {children[1]}
      </div>
    </div>
  );
};
