// src/components/geom/Stage2D.tsx
import React from "react";
import { AbsoluteFill } from "remotion";

export interface Stage2DProps {
  readonly width: number;
  readonly height: number;
  readonly children: React.ReactNode;
  readonly preserveAspectRatio?: string;
  readonly color?: string;
}

/**
 * Full-frame SVG coordinate space. Children draw in the `width`×`height`
 * viewBox; `color` sets the inherited `currentColor` for shape primitives.
 */
export const Stage2D: React.FC<Stage2DProps> = ({
  width,
  height,
  children,
  preserveAspectRatio = "xMidYMid meet",
  color = "#000000",
}) => (
  <AbsoluteFill>
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={preserveAspectRatio}
      style={{ color }}
    >
      {children}
    </svg>
  </AbsoluteFill>
);
