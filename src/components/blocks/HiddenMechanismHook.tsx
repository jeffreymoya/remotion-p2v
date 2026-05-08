import React from "react";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";

interface HiddenMechanismHookProps {
  frameRange: [number, number];
  frame: number;
  headline: string;
  teaser: string;
}

export const HiddenMechanismHook: React.FC<HiddenMechanismHookProps> = ({
  frameRange,
  frame,
  headline,
  teaser,
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;

  const headlineOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const teaserOpacity = interpolate(localFrame, [25, 45], [0, 1], {
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
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.text,
          opacity: headlineOpacity,
          marginBottom: 40,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          fontSize: 36,
          fontFamily: font.body,
          color: palette.muted,
          opacity: teaserOpacity,
        }}
      >
        {teaser}
      </div>
    </div>
  );
};
