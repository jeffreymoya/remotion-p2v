// src/components/geom/shapes/Star.tsx
import React from "react";
import { pointsToAttr, star } from "../math";

export interface StarProps {
  readonly cx: number;
  readonly cy: number;
  readonly outerR: number;
  readonly innerR: number;
  readonly points: number;
  readonly rotationDeg?: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export const starDefaults: Required<
  Omit<StarProps, "cx" | "cy" | "outerR" | "innerR" | "points">
> = {
  rotationDeg: -90,
  fill: "currentColor",
  stroke: "none",
  strokeWidth: 0,
  opacity: 1,
};

export const Star: React.FC<StarProps> = (props) => {
  const p = { ...starDefaults, ...props };
  const pts = star(p.points, p.outerR, p.innerR, p.cx, p.cy, p.rotationDeg);
  return (
    <polygon points={pointsToAttr(pts)} fill={p.fill} stroke={p.stroke} strokeWidth={p.strokeWidth} opacity={p.opacity} />
  );
};
