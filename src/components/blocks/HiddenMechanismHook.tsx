import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("HiddenMechanismHook"),
  frameRange: FrameRange,
  headline: z.string(),
  teaser: z.string(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "HiddenMechanismHook",
  role: "hook",
  guidelineSection: "§1 Hook — Hidden Mechanism",
  whenToUse: "Opening that promises to expose how something works behind the scenes.",
  effect: "Headline stagger-reveals, then teaser slides up below with a muted accent color.",
  props: {
    headline: "string: The 'how X really works' headline",
    teaser: "string: One-line hook that deepens curiosity",
  },
};

interface HiddenMechanismHookProps {
  frameRange: [number, number];
  frame: number;
  headline: string;
  teaser: string;
}

export const HiddenMechanismHook: React.FC<HiddenMechanismHookProps> = ({
  frameRange,
  frame,
  headline,
  teaser,
}) => {
  const localFrame = frame;

  const headlineOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const teaserOpacity = interpolate(localFrame, [25, 45], [0, 1], {
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
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.text,
          opacity: headlineOpacity,
          marginBottom: 40,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          fontSize: 36,
          fontFamily: font.body,
          color: palette.muted,
          opacity: teaserOpacity,
        }}
      >
        {teaser}
      </div>
    </div>
  );
};

export { HiddenMechanismHook as Component };
