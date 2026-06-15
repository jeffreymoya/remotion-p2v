import React from "react";
import { useCurrentFrame } from "remotion";
import { resolveTheme } from "../common/tokens";
import { EasingPreset } from "../common/easing";
import { fadeUp, popIn } from "../anim/keyframes";
import { countUp } from "../anim/useCountUp";
import { formatValue } from "../common/format";
import { CHART_CANVAS, CHART_RAMP, CHART_TYPE, DONUT } from "./chartTokens";
import { ChartFrame } from "./ChartFrame";
import type { BaseChartProps } from "./types";

/** Donut/composition chart with count-up centre value and legend. */
export const DonutChart: React.FC<BaseChartProps> = ({
  points,
  label,
  unit = "",
  source,
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(theme);

  const H = CHART_CANVAS.viewBoxH;
  const { cx, cy, rOuter, rInner } = DONUT;
  const totalY = points.reduce((sum, pt) => sum + pt.y, 0) || 1;

  let acc = 0;
  const wedges = points.map((pt) => {
    const a0 = (acc / totalY) * Math.PI * 2 - Math.PI / 2;
    acc += pt.y;
    const a1 = (acc / totalY) * Math.PI * 2 - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const path = [
      `M ${cx + rOuter * Math.cos(a0)} ${cy + rOuter * Math.sin(a0)}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${cx + rOuter * Math.cos(a1)} ${cy + rOuter * Math.sin(a1)}`,
      `L ${cx + rInner * Math.cos(a1)} ${cy + rInner * Math.sin(a1)}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${cx + rInner * Math.cos(a0)} ${cy + rInner * Math.sin(a0)}`,
      "Z",
    ].join(" ");
    return { x: pt.x, y: pt.y, path };
  });

  return (
    <ChartFrame theme={theme} source={source}>
      {wedges.map((w, i) => (
        <g key={`wedge-${i}`} style={popIn(frame, 0, i * 4, 21, cx, cy)}>
          <path d={w.path} fill={CHART_RAMP[i % CHART_RAMP.length]} />
        </g>
      ))}

      <g style={fadeUp(frame, 0, 8, 16)}>
        <text
          x={cx}
          y={cy + DONUT.centerLabelYOffset}
          textAnchor="middle"
          fill={t.muted}
          fontFamily={CHART_TYPE.centerLabel.fontFamily}
          fontSize={CHART_TYPE.centerLabel.fontSize}
          letterSpacing={CHART_TYPE.centerLabel.letterSpacing}
          style={{ textTransform: "uppercase" }}
        >
          {label}
        </text>
        <text
          x={cx}
          y={cy + DONUT.centerValueYOffset}
          textAnchor="middle"
          fill={t.text}
          fontFamily={CHART_TYPE.centerValue.fontFamily}
          fontSize={CHART_TYPE.centerValue.fontSize}
          fontWeight={CHART_TYPE.centerValue.fontWeight}
        >
          {formatValue(countUp(frame, totalY, 6, 33, EasingPreset.Smooth), unit)}
        </text>
      </g>

      {wedges.map((w, i) => (
        <g
          key={`legend-${i}`}
          transform={`translate(${cx + rOuter + DONUT.legendOffset}, ${(H - points.length * DONUT.legendGap) / 2 + i * DONUT.legendGap})`}
        >
          <g style={fadeUp(frame, 0, i * 3 + 18, 16)}>
            <rect
              x={0}
              y={3}
              width={DONUT.swatchSize}
              height={DONUT.swatchSize}
              fill={CHART_RAMP[i % CHART_RAMP.length]}
              rx={DONUT.swatchRx}
            />
            <text
              x={DONUT.legendLabelXOffset}
              y={DONUT.legendLabelYBaseline}
              fill={t.text}
              fontFamily={CHART_TYPE.legendLabel.fontFamily}
              fontSize={CHART_TYPE.legendLabel.fontSize}
            >
              {String(w.x)}
            </text>
            <text
              x={DONUT.legendLabelXOffset}
              y={DONUT.legendValueYBaseline}
              fill={CHART_RAMP[i % CHART_RAMP.length]}
              fontFamily={CHART_TYPE.legendValue.fontFamily}
              fontSize={CHART_TYPE.legendValue.fontSize}
              fontWeight={CHART_TYPE.legendValue.fontWeight}
              letterSpacing={CHART_TYPE.legendValue.letterSpacing}
            >
              {((w.y / totalY) * 100).toFixed(1)}%
            </text>
          </g>
        </g>
      ))}
    </ChartFrame>
  );
};
