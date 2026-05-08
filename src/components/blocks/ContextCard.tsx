import React from "react";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";

interface ContextCardProps {
  frameRange: [number, number];
  frame: number;
  body: string;
}

export const ContextCard: React.FC<ContextCardProps> = ({
  frameRange,
  frame,
  body,
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
          maxWidth: "70%",
          fontSize: 40,
          fontFamily: font.body,
          color: palette.text,
          lineHeight: 1.6,
          textAlign: "center",
          opacity,
        }}
      >
        {body}
      </div>
    </div>
  );
};
