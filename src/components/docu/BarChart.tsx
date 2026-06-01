import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { CHART_RAMP_DEFAULT, CHART_TYPOGRAPHY, OVERLAY_TEXT_PALETTE, paletteToTextMode } from "./docu-tokens";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import { fadeIn, fadeUp, growY } from "./chart-animations";
import { getEnterPreset } from "../../lib/docu/overlays/overlay-animations";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";

loadSourceSerif4();
loadIBMPlexSans();
loadIBMPlexMono();

export interface BarChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const BarChart: React.FC<BarChartProps> = ({
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

  const W = 1170;
  const H = 810;
  const padL = 90;
  const padR = 60;
  const padT = 90;
  const padB = 80;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseY = padT + plotH;

  const ys = points.map((pt) => pt.y);
  const maxY = Math.max(...ys, 1);

  const barW = (plotW / points.length) * 0.62;
  const gap = plotW / points.length;

  const enterPreset = enter ? getEnterPreset(enter) : null;
  const containerFade: React.CSSProperties = enterPreset && enterPreset.channel === "style"
    ? enterPreset.fn(frame, 0, 0, 10)
    : fadeIn(frame, 0, 0, 10);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg, backdropFilter: textMode === "dark" ? "blur(6px)" : undefined, opacity: containerFade.opacity }}>
      <svg width={1400} height={970} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>

        {/* Grid lines */}
        {Array.from({ length: 4 }, (_, i) => {
          const gy = padT + (plotH / 3) * i;
          const gv = maxY - (maxY / 3) * i;
          return (
            <g key={`grid-${i}`}>
              <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke={c.textMuted} strokeWidth={0.5} strokeDasharray="4 4" />
              <text x={padL - 10} y={gy + 5} textAnchor="end" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axis.fontSize} fontFamily={CHART_TYPOGRAPHY.axis.fontFamily}>
                {gv % 1 === 0 ? gv.toFixed(0) : gv.toFixed(1)}{unit}
              </text>
            </g>
          );
        })}

        {points.map((pt, i) => {
          const barH = (pt.y / maxY) * plotH;
          const barX = padL + i * gap + (gap - barW) / 2;
          const barY = baseY - barH;
          return (
            <g key={`bar-${i}`}>
              <g transform={`translate(${barX}, ${baseY})`}>
                <g style={growY(frame, 0, i * 3, 24, barW / 2, 0)}>
                  <rect x={0} y={-barH} width={barW} height={barH} fill={ramp[i % 6]} rx={2} />
                </g>
              </g>
              {/* Value label above bar */}
              <g style={fadeUp(frame, 0, i * 3 + 22, 12)}>
                <text x={barX + barW / 2} y={barY - 10} textAnchor="middle" fill={c.textPrimary} fontSize={CHART_TYPOGRAPHY.valueCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.valueCompact.fontFamily} fontWeight={CHART_TYPOGRAPHY.valueCompact.fontWeight}>
                  {pt.y}{unit}
                </text>
              </g>
              {/* X-axis label */}
              <text x={barX + barW / 2} y={baseY + 22} textAnchor="middle" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axisCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.axisCompact.fontFamily}>
                {String(pt.x)}
              </text>
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
