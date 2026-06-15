import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveTheme } from "../common/tokens";
import { EasingPreset } from "../common/easing";
import { fadeIn, fadeUp } from "../anim/keyframes";
import { countUp } from "../anim/useCountUp";
import { formatValue } from "../common/format";
import { CHART_CANVAS, CHART_RAMP, CHART_TYPE, RADIAL } from "./chartTokens";
import { ChartFrame } from "./ChartFrame";
import type { BaseChartProps } from "./types";

/**
 * Radial gauge showing progress toward a target. Expects two points:
 * `points[0]` = current value, `points[1]` = target.
 */
export const RadialChart: React.FC<BaseChartProps> = ({
  points,
  label,
  unit = "",
  source,
  theme = "dark",
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const dur = durationInFrames ?? total;
  const t = resolveTheme(theme);

  if (points.length < 2) {
    return (
      <ChartFrame theme={theme} source={source}>
        <text
          x={CHART_CANVAS.viewBoxW / 2}
          y={RADIAL.cy}
          textAnchor="middle"
          fill={t.muted}
          fontFamily={CHART_TYPE.label.fontFamily}
          fontSize={CHART_TYPE.label.fontSize}
        >
          Insufficient data
        </text>
      </ChartFrame>
    );
  }

  const value = points[0].y;
  const target = points[1].y || 1;
  const pct = Math.min(value / target, 1);

  const cx = CHART_CANVAS.viewBoxW / 2;
  const { cy, r, strokeW, tickCount, tickGap, tickLen } = RADIAL;
  const ringInnerR = r - strokeW / 2;
  const tickOuterR = ringInnerR - tickGap;
  const tickInnerR = tickOuterR - tickLen;
  const circumference = 2 * Math.PI * r;

  const arcOffset = interpolate(
    frame,
    [8, 8 + Math.floor(dur * 0.75)],
    [circumference, circumference * (1 - pct)],
    { extrapolateRight: "clamp" },
  );
  const displayValue = countUp(frame, value, 8, Math.floor(dur * 0.75), EasingPreset.Smooth);
  const displayText = formatValue(displayValue, unit);
  const valueFontSize =
    displayText.length > 7
      ? CHART_TYPE.radialValue.fontSize * 0.86
      : CHART_TYPE.radialValue.fontSize;

  return (
    <ChartFrame theme={theme} source={source}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeW} />

      {Array.from({ length: tickCount }, (_, i) => {
        const angle = (i / tickCount) * Math.PI * 2 - Math.PI / 2;
        return (
          <g key={`tick-${i}`} style={fadeIn(frame, 0, i * 2, 8)}>
            <line
              x1={cx + tickInnerR * Math.cos(angle)}
              y1={cy + tickInnerR * Math.sin(angle)}
              x2={cx + tickOuterR * Math.cos(angle)}
              y2={cy + tickOuterR * Math.sin(angle)}
              stroke={t.muted}
              strokeWidth={1.5}
            />
          </g>
        );
      })}

      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={CHART_RAMP[0]}
        strokeWidth={strokeW}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={arcOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      <g style={fadeUp(frame, 0, 4, 12)}>
        <text
          x={cx}
          y={cy - 54}
          textAnchor="middle"
          fill={t.accent}
          fontFamily={CHART_TYPE.annotation.fontFamily}
          fontSize={CHART_TYPE.annotation.fontSize}
          letterSpacing={CHART_TYPE.annotation.letterSpacing}
          style={{ textTransform: "uppercase" }}
        >
          {label}
        </text>
        <text
          x={cx}
          y={cy + 24}
          textAnchor="middle"
          fill={t.text}
          fontFamily={CHART_TYPE.radialValue.fontFamily}
          fontSize={valueFontSize}
          fontWeight={CHART_TYPE.radialValue.fontWeight}
        >
          {displayText}
        </text>
        <text
          x={cx}
          y={cy + 76}
          textAnchor="middle"
          fill={t.muted}
          fontFamily={CHART_TYPE.secondaryValue.fontFamily}
          fontSize={CHART_TYPE.secondaryValue.fontSize}
          fontStyle={CHART_TYPE.secondaryValue.fontStyle}
        >
          of {formatValue(target, unit)} target
        </text>
      </g>
    </ChartFrame>
  );
};
