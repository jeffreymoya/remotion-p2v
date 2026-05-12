import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("Reframe"),
  frameRange: FrameRange,
  oldFrame: z.string(),
  newFrame: z.string(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "Reframe",
  role: "retention",
  guidelineSection: "§4 Retention — Reframe",
  whenToUse: "Replaces an old mental model with a new one. Similar to ContradictionHook but for mid-segment use.",
  effect: "Old frame appears with strikethrough; new frame slides in below in accent color.",
  props: {
    oldFrame: "string: The old way of thinking (gets struck through)",
    newFrame: "string: The new frame (revealed in accent color)",
  },
};

interface ReframeProps {
  frameRange: [number, number];
  frame: number;
  oldFrame: string;
  newFrame: string;
}

export const Reframe: React.FC<ReframeProps> = ({
  frameRange,
  frame,
  oldFrame,
  newFrame,
}) => {
  const localFrame = frame;
  const midPoint = Math.floor((frameRange[1] - frameRange[0]) / 2);

  const oldOpacity = interpolate(localFrame, [0, 15, midPoint - 10, midPoint], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const newOpacity = interpolate(localFrame, [midPoint, midPoint + 15], [0, 1], {
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
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          fontSize: 56,
          fontFamily: font.body,
          color: palette.muted,
          opacity: oldOpacity,
          textDecoration: "line-through",
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {oldFrame}
      </div>
      <div
        style={{
          position: "absolute",
          fontSize: 56,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.accent,
          opacity: newOpacity,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {newFrame}
      </div>
    </div>
  );
};

export { Reframe as Component };
