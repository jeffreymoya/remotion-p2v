import React from "react";

export interface GradientDefProps {
  id: string;
  color: string;
  /** Top stop opacity; fades to 0 at the bottom. */
  opacity?: number;
}

/**
 * Vertical area-fill gradient. Shared by the line and area charts which both
 * defined an identical `linearGradient`. Render inside an SVG `<defs>`.
 */
export const GradientDef: React.FC<GradientDefProps> = ({
  id,
  color,
  opacity = 0.4,
}) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={color} stopOpacity={opacity} />
    <stop offset="100%" stopColor={color} stopOpacity={0} />
  </linearGradient>
);
