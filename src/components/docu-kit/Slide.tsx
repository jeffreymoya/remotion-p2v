import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "./utils/tokens";

export interface SlideProps {
  color: string;
  children: React.ReactNode;
}

/**
 * Full-frame 1920×1080 overlay surface. Transparent by design — these cards
 * are composited over other Remotion layers, so they never paint a background.
 */
export const Slide: React.FC<SlideProps> = ({ color, children }) => (
  <AbsoluteFill
    style={{
      background: "transparent",
      color,
      overflow: "hidden",
      fontFamily: FONT.body,
    }}
  >
    {children}
  </AbsoluteFill>
);
