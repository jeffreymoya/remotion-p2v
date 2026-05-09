import React from "react";
import { interpolate, interpolateColors } from "remotion";
import { palette, font } from "../tokens";

interface ContrastRevealProps {
  frameRange: [number, number];
  frame: number;
  setup: string;
  reveal: string;
}

export const ContrastReveal: React.FC<ContrastRevealProps> = ({
  frameRange,
  frame,
  setup,
  reveal,
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;
  const midPoint = Math.floor((frameRange[1] - start) / 2);

  const setupOpacity = interpolate(localFrame, [0, 15, midPoint - 5, midPoint + 5], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const revealOpacity = interpolate(localFrame, [midPoint, midPoint + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const revealSlide = interpolate(localFrame, [midPoint, midPoint + 20], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const revealColor = interpolateColors(
    localFrame,
    [midPoint, midPoint + 20],
    [palette.text, palette.accent],
  );

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
          opacity: setupOpacity,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {setup}
      </div>
      <div
        style={{
          position: "absolute",
          fontSize: 56,
          fontWeight: "bold",
          fontFamily: font.display,
          color: revealColor,
          opacity: revealOpacity,
          transform: `translateX(${revealSlide}px)`,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {reveal}
      </div>
    </div>
  );
};
