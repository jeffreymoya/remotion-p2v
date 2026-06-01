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
} from "./docu-tokens";
import { getEnterPreset } from "../../lib/docu/overlays/overlay-animations";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
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
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
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
  enter,
}) => {
  const frame = useCurrentFrame();

  const s = { ...DEFAULT_KINETIC_NUMBER_STYLE, ...kineticStyle };

  const currentValue: number = enter
    ? (getEnterPreset(enter).channel === "value"
      ? (getEnterPreset(enter).fn as (f: number, sf: number, df: number, dur: number, t: number) => number)(frame, 0, 0, durationFrames, value)
      : interpolate(frame, [0, durationFrames], [0, value], { extrapolateRight: "clamp" }))
    : interpolate(frame, [0, durationFrames], [0, value], { extrapolateRight: "clamp" });

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
