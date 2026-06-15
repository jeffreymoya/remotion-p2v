// src/components/geom/shapes/Line.tsx
import React from "react";

export interface LineProps {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly strokeLinecap?: "butt" | "round" | "square";
  readonly opacity?: number;
}

export const lineDefaults: Required<Omit<LineProps, "x1" | "y1" | "x2" | "y2">> = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  opacity: 1,
};

export const Line: React.FC<LineProps> = (props) => {
  const p = { ...lineDefaults, ...props };
  return (
    <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={p.stroke} strokeWidth={p.strokeWidth} strokeLinecap={p.strokeLinecap} opacity={p.opacity} />
  );
};
