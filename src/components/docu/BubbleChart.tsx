import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { CHART_RAMP_DEFAULT, CHART_TYPOGRAPHY, OVERLAY_TEXT_PALETTE, paletteToTextMode } from "./docu-tokens";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import { fadeIn, popIn } from "./chart-animations";

loadSourceSerif4();
loadIBMPlexSans();
loadIBMPlexMono();

export interface BubbleChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  bubblePoints?: Array<{ name: string; x: number; y: number; r: number; highlight?: boolean }>;
}

export const BubbleChart: React.FC<BubbleChartProps> = ({
  label,
  unit,
  source,
  palette: paletteName,
  durationInFrames,
  bubblePoints,
}) => {
  const frame = useCurrentFrame();
  const ramp = CHART_RAMP_DEFAULT;
  const textMode = paletteToTextMode(paletteName);
  const c = OVERLAY_TEXT_PALETTE[textMode];

  if (!bubblePoints || bubblePoints.length === 0) {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg }}>
        <div style={{ color: c.textPrimary, fontSize: CHART_TYPOGRAPHY.emptyState.fontSize, fontFamily: CHART_TYPOGRAPHY.emptyState.fontFamily }}>
          Bubble chart data not yet wired through pipeline
        </div>
      </AbsoluteFill>
    );
  }

  const W = 1170;
  const H = 810;
  const padL = 90;
  const padR = 60;
  const padT = 90;
  const padB = 80;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xs = bubblePoints.map((bp) => bp.x);
  const ys = bubblePoints.map((bp) => bp.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xRange = (maxX - minX) || 1;
  const yRange = (maxY - minY) || 1;
  const xPad = xRange * 0.10;
  const yPad = yRange * 0.10;

  const toBX = (v: number) => padL + ((v - minX + xPad) / (xRange + xPad * 2)) * plotW;
  const toBY = (v: number) => padT + plotH - ((v - minY + yPad) / (yRange + yPad * 2)) * plotH;

  const containerFade = fadeIn(frame, 0, 0, 10);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg, backdropFilter: textMode === "dark" ? "blur(6px)" : undefined, opacity: containerFade.opacity }}>
      <svg width={1400} height={970} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>

        {/* Quadrant highlight */}
        <g style={fadeIn(frame, 0, 8, 10)}>
          <rect x={padL + plotW / 2} y={padT} width={plotW / 2} height={plotH / 2} fill={ramp[0]} opacity={0.06} />
        </g>

        {/* Axis tick labels */}
        {Array.from({ length: 4 }, (_, i) => {
          const xv = minX + (xRange / 3) * i;
          const yv = minY + (yRange / 3) * (3 - i);
          return (
            <g key={`tick-${i}`}>
              <text x={toBX(xv)} y={padT + plotH + 22} textAnchor="middle" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axisCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.axisCompact.fontFamily}>
                {xv % 1 === 0 ? xv : xv.toFixed(1)}
              </text>
              <text x={padL - 10} y={toBY(yv) + 5} textAnchor="end" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axisCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.axisCompact.fontFamily}>
                {yv % 1 === 0 ? yv : yv.toFixed(1)}{unit}
              </text>
            </g>
          );
        })}

        {/* X axis line */}
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke={c.textMuted} strokeWidth={0.5} />
        {/* Y axis line */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke={c.textMuted} strokeWidth={0.5} />

        {/* Quadrant labels */}
        <text x={padL + plotW - 10} y={padT - 14} textAnchor="end" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.annotationCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.annotationCompact.fontFamily}>
          High
        </text>

        {bubblePoints.map((bp, i) => {
          const bx = toBX(bp.x);
          const by = toBY(bp.y);
          return (
            <g key={`bubble-${i}`}>
              <g transform={`translate(${bx}, ${by})`}>
                <g style={popIn(frame, 0, i * 4, 24, 0, 0)}>
                  <circle cx={0} cy={0} r={bp.r} fill={ramp[i % 6]} opacity={0.78} />
                  <circle cx={0} cy={0} r={bp.r} fill="none" stroke={c.textPrimary} strokeWidth={1} opacity={0.2} />
                </g>
              </g>
              {bp.highlight ? (
                <g style={fadeIn(frame, 0, i * 4 + 14, 10)}>
                  <text x={bx} y={by + bp.r + 16} textAnchor="middle" fill={c.textInk} fontSize={CHART_TYPOGRAPHY.labelCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.labelCompact.fontFamily}>
                    {bp.name}
                  </text>
                </g>
              ) : null}
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
