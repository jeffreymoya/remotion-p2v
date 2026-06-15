// src/components/geom/shapes/RegularPolygon.tsx
import React from "react";
import { pointsToAttr, regularPolygon } from "../math";

export interface RegularPolygonProps {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly sides: number;
  readonly rotationDeg?: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export const regularPolygonDefaults: Required<
  Omit<RegularPolygonProps, "cx" | "cy" | "r" | "sides">
> = {
  rotationDeg: 0,
  fill: "currentColor",
  stroke: "none",
  strokeWidth: 0,
  opacity: 1,
};

export const RegularPolygon: React.FC<RegularPolygonProps> = (props) => {
  const p = { ...regularPolygonDefaults, ...props };
  const pts = regularPolygon(p.sides, p.r, p.cx, p.cy, p.rotationDeg);
  return (
    <polygon points={pointsToAttr(pts)} fill={p.fill} stroke={p.stroke} strokeWidth={p.strokeWidth} opacity={p.opacity} />
  );
};
