import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { DocuPalette } from "./docu-tokens";
import { BLOOMBERG_ORANGE, BLOOMBERG_YELLOW, PALETTE_MAP } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";

export interface DocuChartProps {
  chartKind: "timeseries" | "comparison" | "composition";
  label: string;
  points: Array<{ x: string | number; y: number }>;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
}

const CHART_WHITE = "#FAFAFA";

export const DocuChart: React.FC<DocuChartProps> = ({
  chartKind,
  label,
  points,
  unit,
  source,
  palette: paletteName,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const p = PALETTE_MAP[paletteName];
  const progress = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  if (points.length < 2) {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: CHART_WHITE, fontSize: 18 }}>{label}</div>
        <div style={{ color: "#888", fontSize: 14 }}>Insufficient data points</div>
      </AbsoluteFill>
    );
  }

  const ys = points.map((pt) => pt.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const range = maxY - minY || 1;
  const width = 1200;
  const height = 400;
  const padX = 80;
  const padY = 40;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const toX = (i: number) => padX + (i / (points.length - 1)) * plotW;
  const toY = (v: number) => padY + plotH - ((v - minY) / range) * plotH;

  let pathD = `M ${toX(0)} ${toY(ys[0])}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${toX(i)} ${toY(ys[i])}`;
  }

  const isBar = chartKind === "composition" || chartKind === "comparison";

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Card background */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.75)",
          border: `1px solid ${p.accentColor}`,
          borderRadius: 8,
          padding: "24px 32px",
          maxWidth: 1400,
          opacity: progress,
        }}
      >
        {/* Label */}
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 20,
            fontWeight: 900,
            color: BLOOMBERG_ORANGE,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 16,
          }}
        >
          {label}
        </div>

        {/* Chart area */}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines */}
          {Array.from({ length: 4 }, (_, i) => {
            const y = padY + (plotH / 3) * i;
            const val = maxY - (range / 3) * i;
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padX} y1={y} x2={padX + plotW} y2={y}
                  stroke="rgba(255,255,255,0.08)" strokeWidth={1}
                />
                <text
                  x={padX - 8} y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.4)"
                  fontSize={11}
                  fontFamily="Inter, sans-serif"
                >
                  {val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}{unit}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {points.map((pt, i) => {
            if (points.length > 8 && i % Math.ceil(points.length / 6) !== 0) return null;
            return (
              <text
                key={`x-${i}`}
                x={toX(i)} y={padY + plotH + 20}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize={11}
                fontFamily="Inter, sans-serif"
              >
                {String(pt.x)}
              </text>
            );
          })}

          {isBar ? (
            // Bar chart for composition/comparison
            points.map((pt, i) => {
              const barW = plotW / points.length * 0.6;
              const barX = toX(i) - barW / 2;
              const barH = plotH - (toY(pt.y) - padY);
              const barY = toY(pt.y);
              return (
                <g key={`bar-${i}`}>
                  <rect
                    x={barX} y={barY}
                    width={barW} height={barH * progress}
                    fill={BLOOMBERG_ORANGE}
                    opacity={0.8}
                    rx={2}
                  />
                  <text
                    x={barX + barW / 2}
                    y={barY - 6}
                    textAnchor="middle"
                    fill={CHART_WHITE}
                    fontSize={11}
                    fontFamily="Inter, sans-serif"
                    fontWeight={700}
                  >
                    {pt.y}{unit}
                  </text>
                </g>
              );
            })
          ) : (
            // Line chart for timeseries
            <>
              <path
                d={pathD}
                stroke={BLOOMBERG_ORANGE}
                strokeWidth={3}
                fill="none"
                strokeDasharray={`${progress * 9999} ${(1 - progress) * 9999}`}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((pt, i) => (
                <circle
                  key={`dot-${i}`}
                  cx={toX(i)} cy={toY(pt.y)}
                  r={4}
                  fill={BLOOMBERG_ORANGE}
                  opacity={progress}
                />
              ))}
            </>
          )}

          {/* Axes */}
          <line
            x1={padX} y1={padY} x2={padX} y2={padY + plotH}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1}
          />
          <line
            x1={padX} y1={padY + plotH} x2={padX + plotW} y2={padY + plotH}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1}
          />
        </svg>

        {/* Source line */}
        {source ? (
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              marginTop: 8,
              textAlign: "right",
            }}
          >
            Source: {source}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
