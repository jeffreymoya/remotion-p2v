import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeUp, popIn } from "../anim/keyframes";
import { CHART_TYPE } from "./chartTokens";

export interface PointCalloutProps {
  x: number;
  y: number;
  /** Pre-formatted value text (e.g. "12%"). */
  value: string;
  /** Optional secondary line below the value (e.g. the x label). */
  subLabel?: string;
  /** Frame the marker pops in. */
  ringStart: number;
  /** Frame the value text fades up. */
  textStart: number;
  color: string;
  textColor: string;
  mutedColor: string;
  /** Inner dot colour; when omitted no inner dot is drawn. */
  dotColor?: string;
  outerR?: number;
  innerR?: number;
  dx?: number;
  valueDy?: number;
  subDy?: number;
}

/**
 * Endpoint marker (ring + optional inner dot) with a value/label callout.
 * Shared by the line and area charts which previously hand-rolled this.
 */
export const PointCallout: React.FC<PointCalloutProps> = ({
  x,
  y,
  value,
  subLabel,
  ringStart,
  textStart,
  color,
  textColor,
  mutedColor,
  dotColor,
  outerR = 7,
  innerR,
  dx = 14,
  valueDy = -14,
  subDy = 12,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <g style={popIn(frame, 0, ringStart, 18, x, y)}>
        <circle cx={x} cy={y} r={outerR} fill={color} />
      </g>
      {innerR && dotColor ? (
        <g style={popIn(frame, 0, ringStart + 2, 18, x, y)}>
          <circle cx={x} cy={y} r={innerR} fill={dotColor} />
        </g>
      ) : null}
      <g style={fadeUp(frame, 0, textStart, 14)}>
        <text
          x={x + dx}
          y={y + valueDy}
          fill={textColor}
          fontSize={CHART_TYPE.value.fontSize}
          fontFamily={CHART_TYPE.value.fontFamily}
          fontWeight={CHART_TYPE.value.fontWeight}
        >
          {value}
        </text>
        {subLabel ? (
          <text
            x={x + dx}
            y={y + subDy}
            fill={mutedColor}
            fontSize={CHART_TYPE.axis.fontSize}
            fontFamily={CHART_TYPE.axis.fontFamily}
          >
            {subLabel}
          </text>
        ) : null}
      </g>
    </>
  );
};
