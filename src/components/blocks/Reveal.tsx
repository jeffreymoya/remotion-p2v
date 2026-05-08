import React from "react";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";

interface RevealProps {
  frameRange: [number, number];
  frame: number;
  headline: string;
  body?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  frameRange,
  frame,
  headline,
  body,
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;

  const headlineOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bodyOpacity = interpolate(localFrame, [25, 45], [0, 1], {
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
          fontSize: 72,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.text,
          opacity: headlineOpacity,
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        {headline}
      </div>
      {body && (
        <div
          style={{
            fontSize: 36,
            fontFamily: font.body,
            color: palette.muted,
            opacity: bodyOpacity,
            textAlign: "center",
          }}
        >
          {body}
        </div>
      )}
    </div>
  );
};
