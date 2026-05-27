import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { CHART_RAMP_DEFAULT, CHART_TYPOGRAPHY, OVERLAY_TEXT_PALETTE, paletteToTextMode } from "./docu-tokens";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import { fadeIn, growX } from "./chart-animations";

loadSourceSerif4();
loadIBMPlexSans();
loadIBMPlexMono();

export interface HorizontalBarChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  points,
  label,
  unit,
  source,
  palette: paletteName,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const ramp = CHART_RAMP_DEFAULT;
  const textMode = paletteToTextMode(paletteName);
  const c = OVERLAY_TEXT_PALETTE[textMode];

  const W = 1170;
  const H = 810;
  const padL = 240;
  const padR = 120;
  const padT = 80;
  const padB = 60;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const ys = points.map((pt) => pt.y);
  const maxY = Math.max(...ys, 1);
  const rowH = plotH / points.length;

  const barH = rowH * 0.6;
  const barMidY = rowH / 2;

  const containerFade = fadeIn(frame, 0, 0, 10);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg, backdropFilter: textMode === "dark" ? "blur(6px)" : undefined, opacity: containerFade.opacity }}>
      <svg width={1400} height={970} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>

        {/* X-axis tick lines */}
        {Array.from({ length: 3 }, (_, i) => {
          const tx = padL + (plotW / 2) * i;
          const tv = maxY - (maxY / 2) * i;
          return (
            <g key={`tick-${i}`}>
              <line x1={tx} y1={padT} x2={tx} y2={padT + plotH} stroke={c.textMuted} strokeWidth={0.5} strokeDasharray="4 4" />
              <text x={tx} y={padT - 12} textAnchor="middle" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axisCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.axisCompact.fontFamily}>
                {tv % 1 === 0 ? tv.toFixed(0) : tv.toFixed(1)}
              </text>
            </g>
          );
        })}

        {points.map((pt, i) => {
          const barW = (pt.y / maxY) * plotW;
          const rowY = padT + i * rowH;
          const barY = rowY + (rowH - barH) / 2;
          return (
            <g key={`bar-${i}`}>
              {/* Left label */}
              <g style={fadeIn(frame, 0, i * 4 - 2, 16)}>
                <text x={padL - 12} y={rowY + barMidY + 5} textAnchor="end" fill={c.textInk} fontSize={CHART_TYPOGRAPHY.label.fontSize} fontFamily={CHART_TYPOGRAPHY.label.fontFamily} fontWeight={CHART_TYPOGRAPHY.label.fontWeight}>
                  {String(pt.x)}
                </text>
              </g>
              {/* Bar */}
              <g transform={`translate(${padL}, ${barY})`}>
                <g style={growX(frame, 0, i * 4, 26, 0, barH / 2)}>
                  <rect x={0} y={0} width={barW} height={barH} fill={ramp[i % 6]} rx={2} />
                </g>
              </g>
              {/* Value right of bar */}
              <g style={fadeIn(frame, 0, i * 4 + 18, 12)}>
                <text x={padL + barW + 12} y={barY + barH / 2 + 4} fill={c.textPrimary} fontSize={CHART_TYPOGRAPHY.valueCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.valueCompact.fontFamily} fontWeight={CHART_TYPOGRAPHY.valueCompact.fontWeight}>
                  {pt.y}{unit}
                </text>
              </g>
            </g>
          );
        })}

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
