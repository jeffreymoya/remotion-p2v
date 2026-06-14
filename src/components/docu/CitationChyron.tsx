import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { BLOOMBERG_ORANGE, TRACKING, WEIGHT, OVERLAY_TEXT_PALETTE, paletteToTextMode } from "./docu-tokens";
import type { DocuPalette } from "./docu-tokens";

loadFont();

interface CitationChyronProps {
  name?: string;
  sourceLabel?: string;
  durationInFrames: number;
  palette?: DocuPalette;
}

const RAMP = 10;

export const CitationChyron: React.FC<CitationChyronProps> = ({
  name,
  sourceLabel,
  durationInFrames,
  palette = "cool-tech",
}) => {
  const frame = useCurrentFrame();
  const textMode = paletteToTextMode(palette);
  const c = OVERLAY_TEXT_PALETTE[textMode];
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
          background: c.bg,
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
                color: c.textPrimary,
                letterSpacing: TRACKING.wide,
                textTransform: "uppercase",
                lineHeight: 1.2,
                textShadow: textMode === "dark" ? "0 1px 4px rgba(0,0,0,0.5)" : "0 2px 6px rgba(0,0,0,0.55)",
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
                color: c.textMuted,
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
