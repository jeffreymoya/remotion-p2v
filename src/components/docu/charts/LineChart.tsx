import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveTheme } from "../common/tokens";
import { fadeIn } from "../anim/keyframes";
import { CHART_CANVAS, CHART_PAD, CHART_RAMP, CHART_TYPE } from "./chartTokens";
import { ChartFrame } from "./ChartFrame";
import { GridLines } from "./GridLines";
import { GradientDef } from "./GradientDef";
import { PointCallout } from "./PointCallout";
import { smoothPath } from "./path";
import type { BaseChartProps } from "./types";

const GRAD_ID = "docu-line-area";
/** Dash length for the draw-on stroke effect (longer than any path). */
const STROKE_DASH = 1400;

/** Time-series line chart with a smooth curve, area fill and draw-on reveal. */
export const LineChart: React.FC<BaseChartProps> = ({
  points,
  unit = "",
  source,
  theme = "dark",
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const dur = durationInFrames ?? total;
  const t = resolveTheme(theme);
  const color = CHART_RAMP[0];

  const W = CHART_CANVAS.viewBoxW;
  const { l: padL, r: padR, t: padT, b: padB } = CHART_PAD.line;
  const plotW = W - padL - padR;
  const plotH = CHART_CANVAS.viewBoxH - padT - padB;
  const baseY = padT + plotH;

  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const range = maxY - minY || 1;
  const toX = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - ((v - minY) / range) * plotH;

  const linePath = smoothPath(points, toX, toY);
  const areaPath = `${linePath} L ${toX(points.length - 1)} ${baseY} L ${padL} ${baseY} Z`;

  const drawOffset = interpolate(
    frame,
    [8, 8 + Math.floor(dur * 0.75)],
    [STROKE_DASH, 0],
    { extrapolateRight: "clamp" },
  );
  const xLabelInterval = points.length > 8 ? Math.ceil(points.length / 6) : 1;
  const lastIdx = points.length - 1;

  return (
    <ChartFrame theme={theme} source={source}>
      <defs>
        <GradientDef id={GRAD_ID} color={color} opacity={0.32} />
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

      {points.map((pt, i) =>
        i % xLabelInterval !== 0 ? null : (
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
        ),
      )}

      <path d={areaPath} fill={`url(#${GRAD_ID})`} style={fadeIn(frame, 0, 30, 20)} />
      <path
        d={linePath}
        stroke={color}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={STROKE_DASH}
        strokeDashoffset={drawOffset}
      />

      <PointCallout
        x={toX(lastIdx)}
        y={toY(ys[lastIdx])}
        value={`${ys[lastIdx]}${unit}`}
        subLabel={String(points[lastIdx].x)}
        ringStart={50}
        textStart={55}
        color={color}
        textColor={t.text}
        mutedColor={t.muted}
        dotColor={t.surface}
        outerR={7}
        innerR={2.8}
      />
    </ChartFrame>
  );
};
