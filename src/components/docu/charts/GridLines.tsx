import React from "react";
import type { Unit } from "../common/types";
import { CHART_TYPE } from "./chartTokens";

export interface GridLinesProps {
  /** Number of horizontal grid lines (default 4 → 3 divisions). */
  count?: number;
  padL: number;
  padT: number;
  plotW: number;
  plotH: number;
  maxY: number;
  minY?: number;
  unit?: Unit;
  color: string;
}

/**
 * Horizontal grid lines with right-aligned axis value labels. Shared by the
 * line, area and bar charts which previously duplicated this block.
 */
export const GridLines: React.FC<GridLinesProps> = ({
  count = 4,
  padL,
  padT,
  plotW,
  plotH,
  maxY,
  minY = 0,
  unit = "",
  color,
}) => {
  const range = maxY - minY || 1;
  const divisions = Math.max(1, count - 1);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const gy = padT + (plotH / divisions) * i;
        const gv = maxY - (range / divisions) * i;
        return (
          <g key={`grid-${i}`}>
            <line
              x1={padL}
              y1={gy}
              x2={padL + plotW}
              y2={gy}
              stroke={color}
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
            <text
              x={padL - 10}
              y={gy + 5}
              textAnchor="end"
              fill={color}
              fontSize={CHART_TYPE.axis.fontSize}
              fontFamily={CHART_TYPE.axis.fontFamily}
            >
              {gv % 1 === 0 ? gv.toFixed(0) : gv.toFixed(1)}
              {unit}
            </text>
          </g>
        );
      })}
    </>
  );
};
