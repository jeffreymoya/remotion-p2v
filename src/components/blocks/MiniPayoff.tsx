import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("MiniPayoff"),
  frameRange: FrameRange,
  rule: z.string(),
  bullets: z.array(z.string()).optional(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "MiniPayoff",
  role: "retention",
  guidelineSection: "§4 Retention — Mini Payoff",
  whenToUse: "Delivers a memorable rule or principle with optional supporting bullets. Use as a mid-segment reward.",
  effect: "Bold rule line spring-pops in; bullet points stagger up below.",
  props: {
    rule: "string: The core rule or principle",
    bullets: "string[]?: Supporting evidence or examples",
  },
};

interface MiniPayoffProps {
  frameRange: [number, number];
  frame: number;
  rule: string;
  bullets?: string[];
}

export const MiniPayoff: React.FC<MiniPayoffProps> = ({
  frameRange,
  frame,
  rule,
  bullets,
}) => {
  const localFrame = frame;

  const ruleOpacity = interpolate(localFrame, [0, 20], [0, 1], {
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
          fontSize: 64,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.text,
          opacity: ruleOpacity,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        {rule}
      </div>
      {bullets?.map((bullet, i) => {
        const bulletOpacity = interpolate(
          localFrame,
          [30 + i * 12, 42 + i * 12],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div
            key={i}
            style={{
              fontSize: 32,
              fontFamily: font.body,
              color: palette.muted,
              opacity: bulletOpacity,
              marginBottom: 16,
            }}
          >
            • {bullet}
          </div>
        );
      })}
    </div>
  );
};

export { MiniPayoff as Component };
