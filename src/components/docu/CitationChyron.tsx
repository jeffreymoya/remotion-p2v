import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { BLOOMBERG_ORANGE, TRACKING, WEIGHT } from "./docu-tokens";

loadFont();

interface CitationChyronProps {
  name?: string;
  sourceLabel?: string;
  durationInFrames: number;
}

const RAMP = 10;

export const CitationChyron: React.FC<CitationChyronProps> = ({
  name,
  sourceLabel,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    interpolate(frame, [0, RAMP], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [durationInFrames - RAMP, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
    }),
  );

  if (!name && !sourceLabel) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        bottom: 80,
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          backdropFilter: "blur(4px)",
          background: "rgba(0,0,0,0.65)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* Accent bar */}
        <div style={{ width: 3, background: BLOOMBERG_ORANGE, flexShrink: 0 }} />
        <div style={{ paddingLeft: 14, paddingRight: 24, paddingTop: 10, paddingBottom: 10 }}>
          {name && (
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: WEIGHT.bold,
                fontSize: 22,
                color: "#FFFFFF",
                letterSpacing: TRACKING.wide,
                textTransform: "uppercase",
                lineHeight: 1.2,
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {name}
            </div>
          )}
          {sourceLabel && (
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: WEIGHT.regular,
                fontSize: 15,
                color: "rgba(255,255,255,0.70)",
                letterSpacing: TRACKING.normal,
                marginTop: name ? 3 : 0,
                lineHeight: 1.3,
              }}
            >
              {sourceLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
