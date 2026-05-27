import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { CHART_RAMP_DEFAULT, CHART_TYPOGRAPHY, OVERLAY_TEXT_PALETTE, paletteToTextMode } from "./docu-tokens";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import { fadeIn, fadeUp, popIn } from "./chart-animations";

loadSourceSerif4();
loadIBMPlexSans();
loadIBMPlexMono();

export interface AreaChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  forecastFromIndex?: number;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  points,
  label,
  unit,
  source,
  palette: paletteName,
  durationInFrames,
  forecastFromIndex,
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

  const hasForecast = typeof forecastFromIndex === "number" && forecastFromIndex > 0 && forecastFromIndex < points.length;
  const maxIdx = hasForecast ? forecastFromIndex : points.length;

  const actualPoints = points.slice(0, maxIdx);
  const forecastPoints = hasForecast ? points.slice(forecastFromIndex) : [];

  const allActualYs = actualPoints.map((pt) => pt.y);
  const allForecastYs = forecastPoints.map((pt) => pt.y);
  const allYs = [...allActualYs, ...allForecastYs];
  const minY = Math.min(...allYs);
  const maxY = Math.max(...allYs);
  const range = maxY - minY || 1;

  const toX = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - ((v - minY) / range) * plotH;

  function buildPath(pts: Array<{ x: string | number; y: number }>, offset: number): string {
    let d = "";
    for (let i = 0; i < pts.length; i++) {
      const px = toX(offset + i);
      const py = toY(pts[i].y);
      if (i === 0) {
        d += `M ${px} ${py}`;
      } else {
        const px0 = toX(offset + i - 1);
        const py0 = toY(pts[i - 1].y);
        const cx1 = px0 + (px - px0) * 0.5;
        const cx2 = px0 + (px - px0) * 0.5;
        d += ` C ${cx1} ${py0} ${cx2} ${py} ${px} ${py}`;
      }
    }
    return d;
  }

  const actualLine = buildPath(actualPoints, 0);
  const actualArea = actualLine + ` L ${toX(maxIdx - 1)} ${baseY} L ${padL} ${baseY} Z`;

  let forecastLine = "";
  if (hasForecast && forecastPoints.length > 1) {
    forecastLine = buildPath(forecastPoints, maxIdx);
  }

  const actualFrames = Math.floor(durationInFrames * (hasForecast ? 0.5 : 0.75));
  const actualWidth = toX(maxIdx - 1) - padL + 60;
  const animW = interpolate(frame, [8, 8 + actualFrames], [0, actualWidth], { extrapolateRight: "clamp" });

  const forecastWidth = forecastLine ? (toX(points.length - 1) - toX(maxIdx) + 60) : 0;
  const animFW = forecastLine ? interpolate(frame, [8 + actualFrames, 8 + Math.floor(durationInFrames * 0.9)], [0, forecastWidth], { extrapolateRight: "clamp" }) : 0;

  const containerFade = fadeIn(frame, 0, 0, 10);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg, backdropFilter: textMode === "dark" ? "blur(6px)" : undefined, opacity: containerFade.opacity }}>
      <svg width={1400} height={970} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          <clipPath id="actual-reveal">
            <rect x={padL} y={0} width={animW} height={H} />
          </clipPath>
          {forecastLine ? (
            <clipPath id="forecast-reveal">
              <rect x={toX(maxIdx)} y={0} width={animFW} height={H} />
            </clipPath>
          ) : null}
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ramp[0]} stopOpacity={0.40} />
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

        {/* X labels (skip forecast labels) */}
        {points.map((pt, i) => {
          if (hasForecast && i > maxIdx - 1) return null;
          if (points.length > 12 && i % Math.ceil(points.length / 6) !== 0) return null;
          return (
            <text key={`x-${i}`} x={toX(i)} y={baseY + 24} textAnchor="middle" fill={c.textMuted} fontSize={CHART_TYPOGRAPHY.axis.fontSize} fontFamily={CHART_TYPOGRAPHY.axis.fontFamily}>
              {String(pt.x)}
            </text>
          );
        })}

        {/* Actual area + line */}
        <g clipPath="url(#actual-reveal)">
          <path d={actualArea} fill="url(#area-grad)" />
          <path d={actualLine} stroke={ramp[0]} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Forecast dashed line */}
        {forecastLine ? (
          <g clipPath="url(#forecast-reveal)">
            <path d={forecastLine} stroke={ramp[1]} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 5" />
            {forecastPoints.map((pt, i) => {
              const idx = maxIdx + i;
              return (
                <g key={`fd-${i}`}>
                  {i === forecastPoints.length - 1 ? (
                    <>
                      <circle cx={toX(idx)} cy={toY(pt.y)} r={4} fill="none" stroke={ramp[1]} strokeWidth={2} />
                      <g style={fadeUp(frame, 0, Math.floor(durationInFrames * 0.85), 8)}>
                        <text x={toX(idx) + 10} y={toY(pt.y) - 8} fill={ramp[1]} fontSize={CHART_TYPOGRAPHY.valueCompact.fontSize} fontFamily={CHART_TYPOGRAPHY.valueCompact.fontFamily} fontWeight={CHART_TYPOGRAPHY.valueCompact.fontWeight}>
                          {pt.y}{unit}
                        </text>
                      </g>
                    </>
                  ) : null}
                </g>
              );
            })}
          </g>
        ) : null}

        {/* Today divider */}
        {hasForecast ? (
          <g style={fadeIn(frame, 0, 8 + actualFrames - 5, 8)}>
            <line x1={toX(maxIdx)} y1={padT} x2={toX(maxIdx)} y2={baseY} stroke={c.textMuted} strokeWidth={1} strokeDasharray="4 4" />
          </g>
        ) : null}

        {/* Last actual endpoint callout */}
        {actualPoints.length > 0 ? (
          <>
            <g style={popIn(frame, 0, actualFrames - 2, 12, toX(maxIdx - 1), toY(actualPoints[actualPoints.length - 1].y))}>
              <circle cx={toX(maxIdx - 1)} cy={toY(actualPoints[actualPoints.length - 1].y)} r={6} fill={ramp[0]} />
            </g>
            <g style={fadeUp(frame, 0, actualFrames + 3, 10)}>
              <text x={toX(maxIdx - 1) + 12} y={toY(actualPoints[actualPoints.length - 1].y) - 10} fill={c.textPrimary} fontSize={CHART_TYPOGRAPHY.value.fontSize} fontFamily={CHART_TYPOGRAPHY.value.fontFamily} fontWeight={CHART_TYPOGRAPHY.value.fontWeight}>
                {actualPoints[actualPoints.length - 1].y}{unit}
              </text>
            </g>
          </>
        ) : null}

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
