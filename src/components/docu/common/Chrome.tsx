import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT, MOTION, SPACING, TRACKING, TYPE_SCALE, WEIGHT } from "./tokens";

export interface ChromeProps {
  num: string;
  name: string;
  meta: string;
  theme?: "dark" | "light";
  accent?: string;
}

/**
 * Shared slide chrome: corner frame outline, numbered pattern label and the
 * top-right meta caption. Mirrors `.frame-outline`, `.label-corner` and
 * `.label-meta` from `kinetic typography/patterns.css`.
 */
export const Chrome: React.FC<ChromeProps> = ({
  num,
  name,
  meta,
  theme = "dark",
  accent = COLORS.orange,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, MOTION.chromeFadeIn, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isLight = theme === "light";
  const lineColor = isLight ? "rgba(20,17,13,0.08)" : COLORS.line;
  const labelMuted = isLight ? "rgba(20,17,13,0.55)" : COLORS.muted;
  const nameColor = isLight ? "rgba(20,17,13,0.85)" : "rgba(239,233,220,0.85)";
  const metaColor = isLight ? "rgba(20,17,13,0.4)" : "rgba(239,233,220,0.32)";

  const labelBase: React.CSSProperties = {
    position: "absolute",
    top: SPACING.labelTop,
    fontFamily: FONT.body,
    fontWeight: WEIGHT.medium,
    fontSize: TYPE_SCALE.xs,
    textTransform: "uppercase",
    opacity,
  };

  return (
    <>
      <div
        data-visual-role="decorative"
        style={{
          position: "absolute",
          inset: SPACING.frameInset,
          border: `1px solid ${lineColor}`,
          pointerEvents: "none",
          zIndex: 4,
          opacity,
        }}
      >
        <span style={{ position: "absolute", top: -1, left: -1, width: SPACING.cornerLen, height: 1, background: accent }} />
        <span style={{ position: "absolute", bottom: -1, right: -1, width: SPACING.cornerLen, height: 1, background: accent }} />
      </div>

      <div
        data-visual-role="metadata"
        style={{
          ...labelBase,
          left: SPACING.labelInset,
          letterSpacing: TRACKING.label,
          color: labelMuted,
          display: "flex",
          gap: 24,
          alignItems: "center",
          zIndex: 6,
        }}
      >
        <span style={{ color: accent, fontWeight: WEIGHT.bold }}>{num}</span>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: labelMuted }} />
        <span style={{ color: nameColor }}>{name}</span>
      </div>

      <div
        data-visual-role="metadata"
        style={{
          ...labelBase,
          right: SPACING.labelInset,
          letterSpacing: TRACKING.meta,
          color: metaColor,
          zIndex: 6,
        }}
      >
        {meta}
      </div>
    </>
  );
};
