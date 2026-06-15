import React from "react";
import { useCurrentFrame } from "remotion";
import { resolveTheme } from "../common/tokens";
import { fadeIn, growX } from "../anim/keyframes";
import { CHART_CANVAS, CHART_PAD, CHART_RAMP, CHART_TYPE } from "./chartTokens";
import { ChartFrame } from "./ChartFrame";
import type { BaseChartProps } from "./types";

/** Horizontal bar chart with left labels and staggered grow-right bars. */
export const HorizontalBarChart: React.FC<BaseChartProps> = ({
  points,
  unit = "",
  source,
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(theme);

  const W = CHART_CANVAS.viewBoxW;
  const { l: padL, r: padR, t: padT, b: padB } = CHART_PAD.hbar;
  const plotW = W - padL - padR;
  const plotH = CHART_CANVAS.viewBoxH - padT - padB;

  const maxY = Math.max(...points.map((p) => p.y), 1);
  const rowH = plotH / points.length;
  const barH = rowH * 0.6;

  return (
    <ChartFrame theme={theme} source={source}>
      {Array.from({ length: 3 }, (_, i) => {
        const tx = padL + (plotW / 2) * i;
        const tv = maxY - (maxY / 2) * i;
        return (
          <g key={`tick-${i}`}>
            <line
              x1={tx}
              y1={padT}
              x2={tx}
              y2={padT + plotH}
              stroke={t.muted}
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
            <text
              x={tx}
              y={padT - 12}
              textAnchor="middle"
              fill={t.muted}
              fontSize={CHART_TYPE.axis.fontSize}
              fontFamily={CHART_TYPE.axis.fontFamily}
            >
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
            <g style={fadeIn(frame, 0, i * 4 - 2, 16)}>
              <text
                x={padL - 12}
                y={rowY + rowH / 2 + 5}
                textAnchor="end"
                fill={t.text}
                fontSize={CHART_TYPE.label.fontSize}
                fontFamily={CHART_TYPE.label.fontFamily}
                fontWeight={CHART_TYPE.label.fontWeight}
              >
                {String(pt.x)}
              </text>
            </g>
            <g transform={`translate(${padL}, ${barY})`}>
              <g style={growX(frame, 0, i * 4, 26, 0, barH / 2)}>
                <rect x={0} y={0} width={barW} height={barH} fill={CHART_RAMP[i % CHART_RAMP.length]} rx={2} />
              </g>
            </g>
            <g style={fadeIn(frame, 0, i * 4 + 18, 12)}>
              <text
                x={padL + barW + 12}
                y={barY + barH / 2 + 4}
                fill={t.text}
                fontSize={CHART_TYPE.value.fontSize}
                fontFamily={CHART_TYPE.value.fontFamily}
                fontWeight={CHART_TYPE.value.fontWeight}
              >
                {pt.y}
                {unit}
              </text>
            </g>
          </g>
        );
      })}
    </ChartFrame>
  );
};
