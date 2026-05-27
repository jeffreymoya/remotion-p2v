import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { CHART_RAMP_DEFAULT, CHART_TYPOGRAPHY, OVERLAY_TEXT_PALETTE, paletteToTextMode } from "./docu-tokens";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import { fadeIn, fadeUp, growY } from "./chart-animations";

loadSourceSerif4();
loadIBMPlexSans();
loadIBMPlexMono();

export interface StackedBarChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  series?: StackedBarSeries[];
}

export interface StackedBarSeries {
  name: string;
  points: Array<{ x: string | number; y: number }>;
}

export interface StackedBarSegment {
  seriesIndex: number;
  topY: number;
  bottomY: number;
  height: number;
}

export function buildStackedBarSegments({
  series,
  categoryIndex,
  baseY,
  plotH,
  globalMax,
}: {
  series: StackedBarSeries[];
  categoryIndex: number;
  baseY: number;
  plotH: number;
  globalMax: number;
}): StackedBarSegment[] {
  let stackBottom = baseY;
  const segments: StackedBarSegment[] = [];

  for (let si = series.length - 1; si >= 0; si--) {
    const val = series[si].points[categoryIndex]?.y ?? 0;
    const height = (val / globalMax) * plotH;
    const bottomY = stackBottom;
    const topY = bottomY - height;

    segments.push({ seriesIndex: si, topY, bottomY, height });
    stackBottom = topY;
  }

  return segments;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  label,
  unit,
  source,
  palette: paletteName,
  durationInFrames,
  series,
}) => {
  const frame = useCurrentFrame();
  const ramp = CHART_RAMP_DEFAULT;
  const textMode = paletteToTextMode(paletteName);
  const c = OVERLAY_TEXT_PALETTE[textMode];

  if (!series || series.length === 0) {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg }}>
        <div style={{ color: c.textPrimary, fontSize: CHART_TYPOGRAPHY.emptyState.fontSize, fontFamily: CHART_TYPOGRAPHY.emptyState.fontFamily }}>
          Stacked chart data not yet wired through pipeline
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
  const baseY = padT + plotH;

  const categories = series[0].points.map((pt) => String(pt.x));
  const maxStack = categories.map((_, catIdx) =>
    series.reduce((sum, s) => sum + s.points[catIdx].y, 0)
  );
  const globalMax = Math.max(...maxStack, 1);

  const colGap = plotW / categories.length;
  const barW = colGap * 0.62;

  const containerFade = fadeIn(frame, 0, 0, 10);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg, backdropFilter: textMode === "dark" ? "blur(6px)" : undefined, opacity: containerFade.opacity }}>
      <svg width={1400} height={970} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>

        {/* Grid lines */}
        {Array.from({ length: 4 }, (_, i) => {
          const gy = padT + (plotH / 3) * i;
          const gv = globalMax - (globalMax / 3) * i;
          return (
            <g key={`grid-${i}`}>
              <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke={c.textMuted} strokeWidth={0.5} strokeDasharray="4 4" />
              <text x={padL - 10} y={gy + 5} textAnchor="end" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axis.fontSize} fontFamily={CHART_TYPOGRAPHY.axis.fontFamily}>
                {gv % 1 === 0 ? gv.toFixed(0) : gv.toFixed(1)}{unit}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g style={fadeIn(frame, 0, 6, 14)}>
          {series.map((s, si) => (
            <g key={`leg-${si}`} transform={`translate(${padL}, ${padT - 40 + si * 24})`}>
              <rect x={0} y={2} width={16} height={16} fill={ramp[si % 6]} rx={3} />
              <text x={22} y={15} fill={c.textInk} fontSize={CHART_TYPOGRAPHY.legendLabel.fontSize} fontFamily={CHART_TYPOGRAPHY.legendLabel.fontFamily}>
                {s.name}
              </text>
            </g>
          ))}
        </g>

        {categories.map((cat, catIdx) => {
          const colX = padL + catIdx * colGap + (colGap - barW) / 2;
          const segments = buildStackedBarSegments({
            series,
            categoryIndex: catIdx,
            baseY,
            plotH,
            globalMax,
          });

          return (
            <g key={`col-${catIdx}`}>
              {/* Category label */}
              <text x={colX + barW / 2} y={baseY + 22} textAnchor="middle" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axisCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.axisCompact.fontFamily}>
                {cat}
              </text>
              {/* Stack segments */}
              {segments.map((seg, segIdx) => {
                const si = seg.seriesIndex;
                const barCenterX = barW / 2;
                return (
                  <g key={`seg-${catIdx}-${segIdx}`} transform={`translate(${colX}, ${seg.bottomY})`}>
                    <g style={growY(frame, 0, catIdx * 3 + si * 2, 24, barCenterX, 0)}>
                      <rect x={0} y={-seg.height} width={barW} height={seg.height} fill={ramp[si % 6]} />
                    </g>
                  </g>
                );
              })}
              {/* Total above column */}
              <g style={fadeUp(frame, 0, catIdx * 3 + 28, 12)}>
                <text x={colX + barW / 2} y={(segments[segments.length - 1]?.topY ?? baseY) - 8} textAnchor="middle" fill={c.textPrimary} fontSize={CHART_TYPOGRAPHY.valueCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.valueCompact.fontFamily}>
                  {maxStack[catIdx]}{unit}
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
