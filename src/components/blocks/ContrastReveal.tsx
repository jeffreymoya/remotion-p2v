import React from "react";
import { z } from "zod";
import { interpolate, interpolateColors } from "remotion";
import { palette, font } from "../tokens";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("ContrastReveal"),
  frameRange: FrameRange,
  setup: z.string(),
  reveal: z.string(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "ContrastReveal",
  role: "retention",
  guidelineSection: "§4 Retention — Contrast Reveal",
  whenToUse: "Reframes a concept by contrasting how two groups describe the same reality.",
  effect: "Muted setup phrase fades out; accent-colored reveal phrase slides in from below.",
  props: {
    setup: "string: The first framing (shown in muted color, then fades)",
    reveal: "string: The reframe (shown in accent color)",
  },
};

interface ContrastRevealProps {
  frameRange: [number, number];
  frame: number;
  setup: string;
  reveal: string;
}

export const ContrastReveal: React.FC<ContrastRevealProps> = ({
  frameRange,
  frame,
  setup,
  reveal,
}) => {
  const localFrame = frame;
  const midPoint = Math.floor((frameRange[1] - frameRange[0]) / 2);

  const setupOpacity = interpolate(localFrame, [0, 15, midPoint - 5, midPoint + 5], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const revealOpacity = interpolate(localFrame, [midPoint, midPoint + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const revealSlide = interpolate(localFrame, [midPoint, midPoint + 20], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const revealColor = interpolateColors(
    localFrame,
    [midPoint, midPoint + 20],
    [palette.text, palette.accent],
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: palette.bg,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          fontSize: 56,
          fontFamily: font.body,
          color: palette.muted,
          opacity: setupOpacity,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {setup}
      </div>
      <div
        style={{
          position: "absolute",
          fontSize: 56,
          fontWeight: "bold",
          fontFamily: font.display,
          color: revealColor,
          opacity: revealOpacity,
          transform: `translateX(${revealSlide}px)`,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {reveal}
      </div>
    </div>
  );
};

export { ContrastReveal as Component };
