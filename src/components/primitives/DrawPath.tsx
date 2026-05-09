import React from "react";
import { interpolate } from "remotion";
import { getLength } from "@remotion/paths";
import { palette } from "../tokens";

interface DrawPathProps {
  frame: number;
  startFrame: number;
  duration?: number;
  d: string;
  stroke?: string;
  strokeWidth?: number;
  pathLength?: number;
}

export const DrawPath: React.FC<DrawPathProps> = ({
  frame,
  startFrame,
  duration = 30,
  d,
  stroke = palette.accent,
  strokeWidth = 3,
  pathLength,
}) => {
  const computedLength = React.useMemo(() => {
    if (pathLength !== undefined) return pathLength;
    try {
      return getLength(d);
    } catch {
      return 1000;
    }
  }, [d, pathLength]);

  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dashOffset = computedLength * (1 - progress);

  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={computedLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};
