import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { CHART_RAMP_DEFAULT, CHART_TYPOGRAPHY, OVERLAY_TEXT_PALETTE, paletteToTextMode, PALETTE_MAP } from "./docu-tokens";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import { fadeIn, fadeUp, countUpValue } from "./chart-animations";
import { getEnterPreset } from "../../lib/docu/overlays/overlay-animations";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";

loadSourceSerif4();
loadIBMPlexSans();
loadIBMPlexMono();

export interface RadialChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

function formatRadialNumber(value: number): string {
  const rounded = Math.abs(value % 1) < 0.05 ? Math.round(value) : Number(value.toFixed(1));
  return rounded.toLocaleString("en-US");
}

function formatRadialValue(value: number, unit: OverlayUnit, target: number): string {
  const formatted = formatRadialNumber(value);
  if (unit === "$") {
    return `$${formatted}${Math.abs(target) < 1000 ? "M" : ""}`;
  }
  if (unit === "%") {
    return `${formatted}%`;
  }
  if (unit === "x") {
    return `${formatted}x`;
  }
  return `$${formatted}${unit}`;
}

export const RadialChart: React.FC<RadialChartProps> = ({
  points,
  label,
  unit,
  source,
  palette: paletteName,
  durationInFrames,
  enter,
  enterParams,
}) => {
  const frame = useCurrentFrame();
  const ramp = CHART_RAMP_DEFAULT;
  const textMode = paletteToTextMode(paletteName);
  const c = OVERLAY_TEXT_PALETTE[textMode];
  const accent = PALETTE_MAP[paletteName].accentColor;
  const secondaryText = c.textMuted;

  if (points.length < 2) {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg }}>
        <div style={{ color: c.textMuted, fontSize: CHART_TYPOGRAPHY.emptyState.fontSize, fontFamily: CHART_TYPOGRAPHY.emptyState.fontFamily }}>
          Insufficient data
        </div>
      </AbsoluteFill>
    );
  }

  const value = points[0].y;
  const target = points[1].y;
  const pct = Math.min(value / target, 1);

  const W = 1170;
  const H = 810;
  const cx = W / 2;
  const cy = 320;
  const r = 200;
  const strokeW = 34;
  const ringInnerR = r - strokeW / 2;
  const tickOuterR = ringInnerR - 8;
  const tickInnerR = tickOuterR - 14;
  const circumference = 2 * Math.PI * r;

  const arcProgress = interpolate(
    frame, [8, 8 + Math.floor(durationInFrames * 0.75)],
    [circumference, circumference * (1 - pct)],
    { extrapolateRight: "clamp" }
  );

  const enterPreset = enter ? getEnterPreset(enter) : null;
  const containerFade: React.CSSProperties = enterPreset && enterPreset.channel === "style"
    ? enterPreset.fn(frame, 0, 0, 10)
    : fadeIn(frame, 0, 0, 10);
  const displayValue = countUpValue(frame, 0, 8, Math.floor(durationInFrames * 0.75), value);
  const displayText = formatRadialValue(displayValue, unit, target);
  const targetText = formatRadialValue(target, unit, target);
  const valueTypography = displayText.length > 7
    ? CHART_TYPOGRAPHY.radialValueCompact
    : CHART_TYPOGRAPHY.radialValue;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg, backdropFilter: textMode === "dark" ? "blur(6px)" : undefined, opacity: containerFade.opacity }}>
      <svg width={1400} height={970} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>

        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeW} />

        {/* Tick marks */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + tickInnerR * Math.cos(angle);
          const y1 = cy + tickInnerR * Math.sin(angle);
          const x2 = cx + tickOuterR * Math.cos(angle);
          const y2 = cy + tickOuterR * Math.sin(angle);
          return (
            <g key={`tick-${i}`} style={fadeIn(frame, 0, i * 2, 8)}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.textMuted} strokeWidth={1.5} />
            </g>
          );
        })}

        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={ramp[0]}
          strokeWidth={strokeW}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={arcProgress}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        {/* Center value */}
        <g style={fadeUp(frame, 0, 4, 12)}>
          <text x={cx} y={cy - 54} textAnchor="middle" fill={accent} fontSize={CHART_TYPOGRAPHY.annotation.fontSize} fontFamily={CHART_TYPOGRAPHY.annotation.fontFamily} letterSpacing={CHART_TYPOGRAPHY.annotation.letterSpacing} style={{ textTransform: "uppercase" }}>
            {label}
          </text>
          <text x={cx} y={cy + 24} textAnchor="middle" fill={c.textPrimary} fontSize={valueTypography.fontSize} fontFamily={valueTypography.fontFamily} fontWeight={valueTypography.fontWeight}>
            {displayText}
          </text>
          <text x={cx} y={cy + 76} textAnchor="middle" fill={secondaryText} fontSize={CHART_TYPOGRAPHY.secondaryValue.fontSize} fontFamily={CHART_TYPOGRAPHY.secondaryValue.fontFamily} fontStyle={CHART_TYPOGRAPHY.secondaryValue.fontStyle}>
            of {targetText} target
          </text>
        </g>

        {/* Source */}
        {source ? (
          <text x={W - 30} y={H - 18} textAnchor="end" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.source.fontSize} fontFamily={CHART_TYPOGRAPHY.source.fontFamily}>
            Source: {source}
          </text>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
