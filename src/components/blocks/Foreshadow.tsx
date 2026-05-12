import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("Foreshadow"),
  frameRange: FrameRange,
  tease: z.string(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "Foreshadow",
  role: "retention",
  guidelineSection: "§4 Retention — Foreshadow",
  whenToUse: "Creates anticipation for what comes next. Use at the end of a segment to bridge to the next.",
  effect: "Italic muted teaser text fades in centered on dark background.",
  props: {
    tease: "string: The teaser line (keep short — one sentence)",
  },
};

interface ForeshadowProps {
  frameRange: [number, number];
  frame: number;
  tease: string;
}

export const Foreshadow: React.FC<ForeshadowProps> = ({
  frameRange,
  frame,
  tease,
}) => {
  const localFrame = frame;

  const opacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: palette.bg,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontStyle: "italic",
          fontFamily: font.body,
          color: palette.muted,
          opacity,
          textAlign: "center",
          maxWidth: "70%",
        }}
      >
        {tease}
      </div>
    </div>
  );
};

export { Foreshadow as Component };
