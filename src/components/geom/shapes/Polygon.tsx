// src/components/geom/shapes/Polygon.tsx
import React from "react";
import { pointsToAttr, type Vec2 } from "../math";

export interface PolygonProps {
  readonly points: readonly Vec2[];
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export const polygonDefaults: Required<Omit<PolygonProps, "points">> = {
  fill: "currentColor",
  stroke: "none",
  strokeWidth: 0,
  opacity: 1,
};

export const Polygon: React.FC<PolygonProps> = (props) => {
  const p = { ...polygonDefaults, ...props };
  return (
    <polygon points={pointsToAttr(p.points)} fill={p.fill} stroke={p.stroke} strokeWidth={p.strokeWidth} opacity={p.opacity} />
  );
};
