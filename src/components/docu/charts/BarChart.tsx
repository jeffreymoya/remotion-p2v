import React from "react";
import { useCurrentFrame } from "remotion";
import { resolveTheme } from "../common/tokens";
import { fadeUp, growY } from "../anim/keyframes";
import { CHART_CANVAS, CHART_PAD, CHART_RAMP, CHART_TYPE } from "./chartTokens";
import { ChartFrame } from "./ChartFrame";
import { GridLines } from "./GridLines";
import type { BaseChartProps } from "./types";

/** Vertical bar chart with staggered grow-up bars and value labels. */
export const BarChart: React.FC<BaseChartProps> = ({
  points,
  unit = "",
  source,
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(theme);

  const W = CHART_CANVAS.viewBoxW;
  const { l: padL, r: padR, t: padT, b: padB } = CHART_PAD.bar;
  const plotW = W - padL - padR;
  const plotH = CHART_CANVAS.viewBoxH - padT - padB;
  const baseY = padT + plotH;

  const maxY = Math.max(...points.map((p) => p.y), 1);
  const gap = plotW / points.length;
  const barW = gap * 0.62;

  return (
    <ChartFrame theme={theme} source={source}>
      <GridLines
        padL={padL}
        padT={padT}
        plotW={plotW}
        plotH={plotH}
        maxY={maxY}
        unit={unit}
        color={t.muted}
      />

      {points.map((pt, i) => {
        const barH = (pt.y / maxY) * plotH;
        const barX = padL + i * gap + (gap - barW) / 2;
        const barY = baseY - barH;
        return (
          <g key={`bar-${i}`}>
            <g transform={`translate(${barX}, ${baseY})`}>
              <g style={growY(frame, 0, i * 3, 24, barW / 2, 0)}>
                <rect x={0} y={-barH} width={barW} height={barH} fill={CHART_RAMP[i % CHART_RAMP.length]} rx={2} />
              </g>
            </g>
            <g style={fadeUp(frame, 0, i * 3 + 22, 12)}>
              <text
                x={barX + barW / 2}
                y={barY - 10}
                textAnchor="middle"
                fill={t.text}
                fontSize={CHART_TYPE.value.fontSize}
                fontFamily={CHART_TYPE.value.fontFamily}
                fontWeight={CHART_TYPE.value.fontWeight}
              >
                {pt.y}
                {unit}
              </text>
            </g>
            <text
              x={barX + barW / 2}
              y={baseY + 22}
              textAnchor="middle"
              fill={t.muted}
              fontSize={CHART_TYPE.axis.fontSize}
              fontFamily={CHART_TYPE.axis.fontFamily}
            >
              {String(pt.x)}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
};
