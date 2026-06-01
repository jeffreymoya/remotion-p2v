import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { CHART_RAMP_DEFAULT, CHART_TYPOGRAPHY, OVERLAY_TEXT_PALETTE, paletteToTextMode } from "./docu-tokens";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import { getEnterPreset } from "../../lib/docu/overlays/overlay-animations";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { fadeIn, fadeUp, popIn } from "./chart-animations";

loadSourceSerif4();
loadIBMPlexSans();
loadIBMPlexMono();

export interface LineChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const LineChart: React.FC<LineChartProps> = ({
  points,
  label,
  unit,
  source,
  palette: paletteName,
  durationInFrames,
  enter,
}) => {
  const frame = useCurrentFrame();
  const ramp = CHART_RAMP_DEFAULT;
  const textMode = paletteToTextMode(paletteName);
  const c = OVERLAY_TEXT_PALETTE[textMode];

  const W = 1170;
  const H = 810;
  const padL = 90;
  const padR = 140;
  const padT = 90;
  const padB = 90;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseY = padT + plotH;

  const ys = points.map((pt) => pt.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const range = maxY - minY || 1;

  const toX = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - ((v - minY) / range) * plotH;

  let linePath = "";
  let areaPath = "";
  for (let i = 0; i < points.length; i++) {
    const px = toX(i);
    const py = toY(ys[i]);
    if (i === 0) {
      linePath += `M ${px} ${py}`;
      areaPath += `M ${px} ${py}`;
    } else {
      const px0 = toX(i - 1);
      const py0 = toY(ys[i - 1]);
      const cx1 = px0 + (px - px0) * 0.5;
      const cx2 = px0 + (px - px0) * 0.5;
      linePath += ` C ${cx1} ${py0} ${cx2} ${py} ${px} ${py}`;
      areaPath += ` C ${cx1} ${py0} ${cx2} ${py} ${px} ${py}`;
    }
  }
  areaPath += ` L ${toX(points.length - 1)} ${baseY} L ${padL} ${baseY} Z`;

  const lastIdx = points.length - 1;
  const endX = toX(lastIdx);
  const endY = toY(ys[lastIdx]);

  const drawProgress = interpolate(frame, [8, 8 + Math.floor(durationInFrames * 0.75)], [1400, 0], { extrapolateRight: "clamp" });

  const enterPreset = enter ? getEnterPreset(enter) : null;
  const containerFade: React.CSSProperties = enterPreset && enterPreset.channel === "style"
    ? enterPreset.fn(frame, 0, 0, 10)
    : fadeIn(frame, 0, 0, 10);

  const xLabelInterval = points.length > 8 ? Math.ceil(points.length / 6) : 1;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg, backdropFilter: textMode === "dark" ? "blur(6px)" : undefined, opacity: containerFade.opacity }}>
      <svg width={1400} height={970} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="line-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ramp[0]} stopOpacity={0.32} />
            <stop offset="100%" stopColor={ramp[0]} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: 4 }, (_, i) => {
          const gy = padT + (plotH / 3) * i;
          const gv = maxY - (range / 3) * i;
          return (
            <g key={`grid-${i}`}>
              <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke={c.textMuted} strokeWidth={0.5} strokeDasharray="4 4" />
              <text x={padL - 10} y={gy + 5} textAnchor="end" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axis.fontSize} fontFamily={CHART_TYPOGRAPHY.axis.fontFamily}>
                {gv % 1 === 0 ? gv.toFixed(0) : gv.toFixed(1)}{unit}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {points.map((pt, i) => {
          if (i % xLabelInterval !== 0) return null;
          return (
            <text key={`x-${i}`} x={toX(i)} y={baseY + 24} textAnchor="middle" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axis.fontSize} fontFamily={CHART_TYPOGRAPHY.axis.fontFamily}>
              {String(pt.x)}
            </text>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#line-area-grad)" style={fadeIn(frame, 0, 30, 20)} />

        {/* Line path */}
        <path d={linePath} stroke={ramp[0]} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1400} strokeDashoffset={drawProgress} />

        {/* Endpoint callout */}
        <g style={popIn(frame, 0, 50, 18, endX, endY)}>
          <circle cx={endX} cy={endY} r={7} fill={ramp[0]} />
        </g>
        <g style={popIn(frame, 0, 52, 18, endX, endY)}>
          <circle cx={endX} cy={endY} r={2.8} fill={c.bg} />
        </g>
        <g style={fadeUp(frame, 0, 55, 14)}>
          <text x={endX + 14} y={endY - 14} fill={c.textPrimary} fontSize={CHART_TYPOGRAPHY.value.fontSize} fontFamily={CHART_TYPOGRAPHY.value.fontFamily} fontWeight={CHART_TYPOGRAPHY.value.fontWeight}>
            {ys[lastIdx]}{unit}
          </text>
          <text x={endX + 14} y={endY + 12} fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.valueCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.valueCompact.fontFamily}>
            {String(points[lastIdx].x)}
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
