import React from "react";
import { spring, interpolate } from "remotion";
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
  const [start] = frameRange;
  const localFrame = frame - start;
  const midPoint = Math.floor((frameRange[1] - start) / 2);

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
    fps: 30,
    from: 60,
    to: 0,
    config: easing.spring,
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
          fontSize: 100,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.negative,
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
          color: palette.accent,
          opacity: revealOpacity,
          transform: `translateY(${revealSlide}px)`,
        }}
      >
        {reveal}
      </div>
    </div>
  );
};
