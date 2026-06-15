// src/components/geom/shapes/Rect.tsx
import React from "react";

export interface RectProps {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rx?: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export const rectDefaults: Required<Omit<RectProps, "x" | "y" | "width" | "height">> = {
  rx: 0,
  fill: "currentColor",
  stroke: "none",
  strokeWidth: 0,
  opacity: 1,
};

export const Rect: React.FC<RectProps> = (props) => {
  const p = { ...rectDefaults, ...props };
  return (
    <rect x={p.x} y={p.y} width={p.width} height={p.height} rx={p.rx} fill={p.fill} stroke={p.stroke} strokeWidth={p.strokeWidth} opacity={p.opacity} />
  );
};
