import React from "react";
import { useCurrentFrame } from "remotion";
import { Box } from "../common/Box";
import { MOTION, resolveTheme } from "../common/tokens";
import type { Theme } from "../common/types";
import { fadeIn } from "../anim/keyframes";
import { CHART_CANVAS, CHART_SOURCE, CHART_TYPE } from "./chartTokens";

export interface ChartFrameProps {
  theme?: Theme;
  /** Optional bottom-right source caption, rendered identically for all charts. */
  source?: string;
  /** SVG content drawn in the logical 1170×810 canvas. */
  children: React.ReactNode;
}

/**
 * Shared chart container: themed translucent surface, frosted backdrop, the
 * scaled SVG viewport and the entrance fade. Extracted from the six charts that
 * previously duplicated this wrapper (and the source caption).
 */
export const ChartFrame: React.FC<ChartFrameProps> = ({
  theme = "dark",
  source,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(theme);
  const opacity = fadeIn(frame, 0, 0, MOTION.overlayRamp).opacity as number;

  return (
    <Box
      dataVisualRole="chart"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: t.surface,
        backdropFilter: "blur(6px)",
        opacity,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${CHART_CANVAS.viewBoxW} ${CHART_CANVAS.viewBoxH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible", maxWidth: CHART_CANVAS.renderW, maxHeight: CHART_CANVAS.renderH }}
      >
        {children}
        {source ? (
          <text
            x={CHART_CANVAS.viewBoxW - CHART_SOURCE.xOffset}
            y={CHART_CANVAS.viewBoxH - CHART_SOURCE.yOffset}
            textAnchor="end"
            fontFamily={CHART_TYPE.source.fontFamily}
            fontSize={CHART_TYPE.source.fontSize}
            fill={t.muted}
          >
            Source: {source}
          </text>
        ) : null}
      </svg>
    </Box>
  );
};
