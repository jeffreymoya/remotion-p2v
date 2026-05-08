import React from "react";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";

interface ReframeProps {
  frameRange: [number, number];
  frame: number;
  oldFrame: string;
  newFrame: string;
}

export const Reframe: React.FC<ReframeProps> = ({
  frameRange,
  frame,
  oldFrame,
  newFrame,
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;
  const midPoint = Math.floor((frameRange[1] - start) / 2);

  const oldOpacity = interpolate(localFrame, [0, 15, midPoint - 10, midPoint], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const newOpacity = interpolate(localFrame, [midPoint, midPoint + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: palette.bg,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          fontSize: 56,
          fontFamily: font.body,
          color: palette.muted,
          opacity: oldOpacity,
          textDecoration: "line-through",
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {oldFrame}
      </div>
      <div
        style={{
          position: "absolute",
          fontSize: 56,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.accent,
          opacity: newOpacity,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {newFrame}
      </div>
    </div>
  );
};
