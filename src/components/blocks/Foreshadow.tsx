import React from "react";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";

interface ForeshadowProps {
  frameRange: [number, number];
  frame: number;
  tease: string;
}

export const Foreshadow: React.FC<ForeshadowProps> = ({
  frameRange,
  frame,
  tease,
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;

  const opacity = interpolate(localFrame, [0, 20], [0, 1], {
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
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontStyle: "italic",
          fontFamily: font.body,
          color: palette.muted,
          opacity,
          textAlign: "center",
          maxWidth: "70%",
        }}
      >
        {tease}
      </div>
    </div>
  );
};
