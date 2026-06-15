import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveTheme } from "../common/tokens";
import { fadeIn, fadeUp } from "../anim/keyframes";
import { CHART_CANVAS, CHART_PAD, CHART_RAMP, CHART_TYPE } from "./chartTokens";
import { ChartFrame } from "./ChartFrame";
import { GridLines } from "./GridLines";
import { GradientDef } from "./GradientDef";
import { PointCallout } from "./PointCallout";
import { smoothPath } from "./path";
import type { BaseChartProps } from "./types";

export interface AreaChartProps extends BaseChartProps {
  /** Index at which the series switches from actual to a dashed forecast. */
  forecastFromIndex?: number;
}

const GRAD_ID = "docu-area-fill";

/** Area chart with an optional dashed forecast tail and reveal wipes. */
export const AreaChart: React.FC<AreaChartProps> = ({
  points,
  unit = "",
  source,
  theme = "dark",
  durationInFrames,
  forecastFromIndex,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const dur = durationInFrames ?? total;
  const t = resolveTheme(theme);
  const actualColor = CHART_RAMP[0];
  const forecastColor = CHART_RAMP[1];

  const W = CHART_CANVAS.viewBoxW;
  const H = CHART_CANVAS.viewBoxH;
  const { l: padL, r: padR, t: padT, b: padB } = CHART_PAD.line;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseY = padT + plotH;

  const hasForecast =
    typeof forecastFromIndex === "number" &&
    forecastFromIndex > 0 &&
    forecastFromIndex < points.length;
  const maxIdx = hasForecast ? (forecastFromIndex as number) : points.length;

  const actualPoints = points.slice(0, maxIdx);
  const forecastPoints = hasForecast ? points.slice(maxIdx) : [];

  const allYs = points.map((p) => p.y);
  const minY = Math.min(...allYs);
  const maxY = Math.max(...allYs);
  const range = maxY - minY || 1;
  const toX = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - ((v - minY) / range) * plotH;

  const actualLine = smoothPath(actualPoints, toX, toY);
  const actualArea = `${actualLine} L ${toX(maxIdx - 1)} ${baseY} L ${padL} ${baseY} Z`;
  const forecastLine =
    hasForecast && forecastPoints.length > 1
      ? smoothPath(forecastPoints, toX, toY, maxIdx)
      : "";

  const actualFrames = Math.floor(dur * (hasForecast ? 0.5 : 0.75));
  const actualWidth = toX(maxIdx - 1) - padL + 60;
  const animW = interpolate(frame, [8, 8 + actualFrames], [0, actualWidth], {
    extrapolateRight: "clamp",
  });
  const forecastWidth = forecastLine ? toX(points.length - 1) - toX(maxIdx) + 60 : 0;
  const animFW = forecastLine
    ? interpolate(
        frame,
        [8 + actualFrames, 8 + Math.floor(dur * 0.9)],
        [0, forecastWidth],
        { extrapolateRight: "clamp" },
      )
    : 0;

  const lastActual = actualPoints[actualPoints.length - 1];
  const lastForecast = forecastPoints[forecastPoints.length - 1];

  return (
    <ChartFrame theme={theme} source={source}>
      <defs>
        <clipPath id="docu-actual-reveal">
          <rect x={padL} y={0} width={animW} height={H} />
        </clipPath>
        {forecastLine ? (
          <clipPath id="docu-forecast-reveal">
            <rect x={toX(maxIdx)} y={0} width={animFW} height={H} />
          </clipPath>
        ) : null}
        <GradientDef id={GRAD_ID} color={actualColor} opacity={0.4} />
      </defs>

      <GridLines
        padL={padL}
        padT={padT}
        plotW={plotW}
        plotH={plotH}
        maxY={maxY}
        minY={minY}
        unit={unit}
        color={t.muted}
      />

      {points.map((pt, i) => {
        if (hasForecast && i > maxIdx - 1) return null;
        if (points.length > 12 && i % Math.ceil(points.length / 6) !== 0) return null;
        return (
          <text
            key={`x-${i}`}
            x={toX(i)}
            y={baseY + 24}
            textAnchor="middle"
            fill={t.muted}
            fontSize={CHART_TYPE.axis.fontSize}
            fontFamily={CHART_TYPE.axis.fontFamily}
          >
            {String(pt.x)}
          </text>
        );
      })}

      <g clipPath="url(#docu-actual-reveal)">
        <path d={actualArea} fill={`url(#${GRAD_ID})`} />
        <path
          d={actualLine}
          stroke={actualColor}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {forecastLine ? (
        <g clipPath="url(#docu-forecast-reveal)">
          <path
            d={forecastLine}
            stroke={forecastColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 5"
          />
          {lastForecast ? (
            <>
              <circle
                cx={toX(points.length - 1)}
                cy={toY(lastForecast.y)}
                r={4}
                fill="none"
                stroke={forecastColor}
                strokeWidth={2}
              />
              <g style={fadeUp(frame, 0, Math.floor(dur * 0.85), 8)}>
                <text
                  x={toX(points.length - 1) + 10}
                  y={toY(lastForecast.y) - 8}
                  fill={forecastColor}
                  fontSize={CHART_TYPE.value.fontSize}
                  fontFamily={CHART_TYPE.value.fontFamily}
                  fontWeight={CHART_TYPE.value.fontWeight}
                >
                  {lastForecast.y}
                  {unit}
                </text>
              </g>
            </>
          ) : null}
        </g>
      ) : null}

      {hasForecast ? (
        <g style={fadeIn(frame, 0, 8 + actualFrames - 5, 8)}>
          <line
            x1={toX(maxIdx)}
            y1={padT}
            x2={toX(maxIdx)}
            y2={baseY}
            stroke={t.muted}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </g>
      ) : null}

      {lastActual ? (
        <PointCallout
          x={toX(maxIdx - 1)}
          y={toY(lastActual.y)}
          value={`${lastActual.y}${unit}`}
          ringStart={actualFrames - 2}
          textStart={actualFrames + 3}
          color={actualColor}
          textColor={t.text}
          mutedColor={t.muted}
          outerR={6}
          dx={12}
          valueDy={-10}
        />
      ) : null}
    </ChartFrame>
  );
};
