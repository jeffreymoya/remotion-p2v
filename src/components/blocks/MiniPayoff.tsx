import React from "react";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";

interface MiniPayoffProps {
  frameRange: [number, number];
  frame: number;
  rule: string;
  bullets?: string[];
}

export const MiniPayoff: React.FC<MiniPayoffProps> = ({
  frameRange,
  frame,
  rule,
  bullets,
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;

  const ruleOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: palette.bg,
        padding: 80,
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.text,
          opacity: ruleOpacity,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        {rule}
      </div>
      {bullets?.map((bullet, i) => {
        const bulletOpacity = interpolate(
          localFrame,
          [30 + i * 12, 42 + i * 12],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div
            key={i}
            style={{
              fontSize: 32,
              fontFamily: font.body,
              color: palette.muted,
              opacity: bulletOpacity,
              marginBottom: 16,
            }}
          >
            • {bullet}
          </div>
        );
      })}
    </div>
  );
};
