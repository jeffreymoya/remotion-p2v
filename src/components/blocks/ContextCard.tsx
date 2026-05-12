import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("ContextCard"),
  frameRange: FrameRange,
  body: z.string(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "ContextCard",
  role: "structure",
  guidelineSection: "§2 Structure — Context",
  whenToUse: "Delivers background context or a bridging statement. Use between hook and evidence.",
  effect: "Simple centered body text fades in on dark background.",
  props: {
    body: "string: The context paragraph (2–3 sentences max)",
  },
};

interface ContextCardProps {
  frameRange: [number, number];
  frame: number;
  body: string;
}

export const ContextCard: React.FC<ContextCardProps> = ({
  frameRange,
  frame,
  body,
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
          maxWidth: "70%",
          fontSize: 40,
          fontFamily: font.body,
          color: palette.text,
          lineHeight: 1.6,
          textAlign: "center",
          opacity,
        }}
      >
        {body}
      </div>
    </div>
  );
};

export { ContextCard as Component };
