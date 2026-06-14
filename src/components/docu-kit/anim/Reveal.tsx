import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EasingPreset, resolveEasing } from "../utils/easing";

export type RevealVariant = "redact" | "highlight" | "strike";

export interface RevealProps {
  variant: RevealVariant;
  color: string;
  startFrame: number;
  durFrames: number;
  origin?: "left" | "right";
  easing?: EasingPreset;
  exit?: number;
  children: React.ReactNode;
}

/**
 * scaleX swipe primitive. Replaces the `.bar`, `.mark` and `.seg--strike`
 * CSS keyframes:
 *  - `redact`   — opaque bar covers the text then retracts to reveal it
 *  - `highlight`— colour mark grows behind the text
 *  - `strike`   — rule grows beneath the text
 */
export const Reveal: React.FC<RevealProps> = ({
  variant,
  color,
  startFrame,
  durFrames,
  origin,
  easing = EasingPreset.Swipe,
  exit = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + durFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(easing),
  });
  const fade = 1 - exit;

  if (variant === "redact") {
    const barOrigin = origin ?? "right";
    return (
      <span style={{ position: "relative", display: "inline-block", padding: "0 14px" }}>
        <span style={{ opacity: progress * fade, color }}>{children}</span>
        <span
          style={{
            position: "absolute",
            inset: "6px -2px 10px -2px",
            background: "#14110d",
            border: "1px solid #000",
            transformOrigin: barOrigin,
            transform: `scaleX(${(1 - progress) * fade})`,
          }}
        />
      </span>
    );
  }

  const markOrigin = origin ?? "left";
  const isStrike = variant === "strike";
  return (
    <span style={{ position: "relative", display: "inline-block", padding: "0 6px" }}>
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: isStrike ? "auto" : "18%",
          bottom: isStrike ? "8px" : "6%",
          height: isStrike ? 12 : undefined,
          background: isStrike ? "transparent" : color,
          borderBottom: isStrike ? `16px solid ${color}` : undefined,
          zIndex: 0,
          transformOrigin: markOrigin,
          transform: `scaleX(${progress * fade})`,
        }}
      />
    </span>
  );
};
