// src/components/geom/shapes/Circle.tsx
import React from "react";

export interface CircleProps {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export const circleDefaults: Required<Omit<CircleProps, "cx" | "cy" | "r">> = {
  fill: "currentColor",
  stroke: "none",
  strokeWidth: 0,
  opacity: 1,
};

export const Circle: React.FC<CircleProps> = (props) => {
  const p = { ...circleDefaults, ...props };
  return (
    <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} stroke={p.stroke} strokeWidth={p.strokeWidth} opacity={p.opacity} />
  );
};
