import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("Reveal"),
  frameRange: FrameRange,
  headline: z.string(),
  body: z.string().optional(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "Reveal",
  role: "retention",
  guidelineSection: "§4 Retention — Reveal",
  whenToUse: "Delivers the main insight or payoff of a segment.",
  effect: "Large headline fades and slides up; supporting body text stagger-reveals below.",
  props: {
    headline: "string: The insight headline (large, bold)",
    body: "string?: Supporting explanation text",
  },
};

interface RevealProps {
  frameRange: [number, number];
  frame: number;
  headline: string;
  body?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  frameRange,
  frame,
  headline,
  body,
}) => {
  const localFrame = frame;

  const headlineOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bodyOpacity = interpolate(localFrame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: palette.bg,
        padding: 80,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.text,
          opacity: headlineOpacity,
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        {headline}
      </div>
      {body && (
        <div
          style={{
            fontSize: 36,
            fontFamily: font.body,
            color: palette.muted,
            opacity: bodyOpacity,
            textAlign: "center",
          }}
        >
          {body}
        </div>
      )}
    </div>
  );
};

export { Reveal as Component };
