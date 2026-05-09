import React from "react";
import { interpolate, interpolateColors } from "remotion";
import { palette, font } from "../tokens";

interface StatCounterProps {
  frameRange: [number, number];
  frame: number;
  value: string;
  label: string;
  sublabel?: string;
  color?: string;
}

function parseValue(value: string): { prefix: string; numeric: number; suffix: string } {
  const match = value.match(/^([^0-9.]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) return { prefix: "", numeric: 0, suffix: value };
  return { prefix: match[1], numeric: parseFloat(match[2]), suffix: match[3] };
}

export const StatCounter: React.FC<StatCounterProps> = ({
  frameRange,
  frame,
  value,
  label,
  sublabel,
  color = palette.accent,
}) => {
  const [start, end] = frameRange;
  const localFrame = frame - start;
  const duration = end - start;
  const countDuration = Math.min(45, Math.floor(duration * 0.5));
  const emphasizeFrame = Math.floor(duration * 0.75);

  const { prefix, numeric, suffix } = React.useMemo(() => parseValue(value), [value]);

  const countedValue = interpolate(localFrame, [0, countDuration], [0, numeric], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayValue =
    numeric % 1 === 0 ? Math.round(countedValue).toString() : countedValue.toFixed(1);

  const entryOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelSlide = interpolate(localFrame, [10, 35], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const numberColor = interpolateColors(
    localFrame,
    [0, countDuration, emphasizeFrame, Math.min(emphasizeFrame + 10, duration - 1), duration],
    [palette.muted, color, "#ffffff", color, color],
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: palette.bg,
        background: `radial-gradient(ellipse at center, ${color}18, ${palette.bg})`,
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: "bold",
          fontFamily: font.display,
          color: numberColor,
          opacity: entryOpacity,
          lineHeight: 1,
        }}
      >
        {prefix}
        {displayValue}
        {suffix}
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 36,
          fontFamily: font.body,
          color: palette.muted,
          opacity: entryOpacity,
          transform: `translateY(${labelSlide}px)`,
          textAlign: "center",
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          style={{
            marginTop: 12,
            fontSize: 24,
            fontFamily: font.body,
            color: palette.muted,
            opacity: interpolate(localFrame, [20, 40], [0, 0.7], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
};
