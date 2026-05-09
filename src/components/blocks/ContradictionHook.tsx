import React from "react";
import { spring, interpolate, interpolateColors, useVideoConfig } from "remotion";
import { palette, font, easing } from "../tokens";
import { Animate } from "../primitives";

interface ContradictionHookProps {
  frameRange: [number, number];
  frame: number;
  setup: string;
  reveal: string;
  style?: "stark" | "split";
}

export const ContradictionHook: React.FC<ContradictionHookProps> = ({
  frameRange,
  frame,
  setup,
  reveal,
  style: visualStyle = "stark",
}) => {
  const { fps } = useVideoConfig();
  const [start] = frameRange;
  const localFrame = frame - start;
  const totalFrames = frameRange[1] - start;
  const midPoint = Math.floor(totalFrames / 2);

  const setupOpacity = interpolate(localFrame, [0, 15, midPoint - 10, midPoint], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const revealOpacity = interpolate(localFrame, [midPoint, midPoint + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const revealSlide = spring({
    frame: Math.max(0, localFrame - midPoint),
    fps,
    from: 60,
    to: 0,
    config: easing.spring,
  });

  const setupColor = interpolateColors(
    localFrame,
    [0, midPoint - 10, midPoint],
    [palette.negative, palette.negative, "rgba(248,113,113,0)"],
  );
  const revealColor = interpolateColors(
    localFrame,
    [midPoint, midPoint + 15, midPoint + 25, totalFrames],
    [palette.accent, "#ffffff", palette.accent, palette.accent],
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
          fontSize: 100,
          fontWeight: "bold",
          fontFamily: font.display,
          color: setupColor,
          textDecoration: "line-through",
          opacity: setupOpacity,
        }}
      >
        {setup}
      </div>
      <div
        style={{
          position: "absolute",
          fontSize: 100,
          fontWeight: "bold",
          fontFamily: font.display,
          color: revealColor,
          opacity: revealOpacity,
          transform: `translateY(${revealSlide}px)`,
        }}
      >
        {reveal}
      </div>
    </div>
  );
};
