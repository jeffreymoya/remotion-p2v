import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import type { DocuPalette, KineticNumberStyle } from "./docu-tokens";
import {
  DEFAULT_KINETIC_NUMBER_STYLE,
  FONT_BODY,
  FONT_DISPLAY,
  TRACKING,
  docuEasing,
} from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";

loadInter();
loadBarlowCondensed();

interface KineticNumberProps {
  label: string;
  value: number;
  unit: OverlayUnit;
  durationFrames: number;
  palette: DocuPalette;
  kineticStyle?: Partial<KineticNumberStyle>;
}

function formatValue(value: number, unit: OverlayUnit): string {
  switch (unit) {
    case "$":
      return `$${Math.round(value).toLocaleString()}`;
    case "%":
      return `${value.toFixed(2)}%`;
    case "x":
      return `${value.toFixed(1)}x`;
    case "T":
      return `$${(value / 1000).toFixed(1)}T`;
    case "B":
      return `$${(value / 1000).toFixed(1)}B`;
    case "M":
      return `${value.toFixed(1)}M`;
    case "K":
      return `${Math.round(value).toLocaleString()}K`;
  }
}

export const KineticNumber: React.FC<KineticNumberProps> = ({
  label,
  value,
  unit,
  durationFrames,
  kineticStyle,
}) => {
  const frame = useCurrentFrame();

  const s = { ...DEFAULT_KINETIC_NUMBER_STYLE, ...kineticStyle };

  const progress = interpolate(frame, [0, durationFrames], [0, 1], {
    easing: docuEasing.snap,
    extrapolateRight: "clamp",
  });

  const currentValue = progress * value;

  const gradient = `linear-gradient(to right, ${s.gradientStart}, ${s.gradientEnd})`;

  return (
    <div
      style={{
        position: "absolute",
        left: `${s.positionLeftPct}%`,
        top: `${s.positionTopPct}%`,
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        lineHeight: 1.1,
      }}
    >
      <div style={{
        fontFamily: FONT_BODY,
        fontSize: s.labelFontSize,
        fontWeight: s.labelFontWeight,
        color: s.labelColor,
        marginBottom: s.labelMarginBottom,
        letterSpacing: TRACKING.wide,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: FONT_DISPLAY,
        fontSize: s.valueFontSize,
        fontWeight: s.valueFontWeight,
        letterSpacing: TRACKING.tight,
        background: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        {formatValue(currentValue, unit)}
      </div>
    </div>
  );
};
