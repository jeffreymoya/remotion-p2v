import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../common/easing";
import { COLORS, DEFAULT_LIFECYCLE, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";

export const keyTermCalloutSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  kicker: z.string(),
  term: z.string(),
  gloss: z.string(),
  accent: zColor(),
  textColor: zColor(),
  secondaryColor: zColor(),
});

export type KeyTermCalloutProps = z.infer<typeof keyTermCalloutSchema>;

export const keyTermCalloutDefaults: KeyTermCalloutProps = {
  num: "13",
  name: "Key Term Callout",
  meta: "Define The Term",
  kicker: "Key term",
  term: "Amortization",
  gloss: "How each payment splits between interest and the balance you actually owe.",
  accent: COLORS.blue,
  textColor: COLORS.fg,
  secondaryColor: "rgba(239,233,220,0.72)",
};

import { defineMeta } from "../common/meta";

export const keyTermCalloutMeta = defineMeta({
  tier: "composite",
  category: "lower-third",
  purpose: "Names and briefly defines a key term the narration introduces.",
  whenToUse: "Emphasise and gloss a piece of jargon or a concept the viewer needs to hold.",
  scriptCues: ["key term", "define", "definition", "term", "jargon", "what is", "concept", "callout"],
  composes: ["Box", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/KeyTermCallout.tsx",
});

const fadeIn = (frame: number, start: number): number =>
  interpolate(frame, [start, start + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const KeyTermCallout: React.FC<KeyTermCalloutProps> = (props) => {
  const p = { ...keyTermCalloutDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ ...DEFAULT_LIFECYCLE, outFrames: 16 });
  const fade = 1 - exit;

  const { h } = useBoxSize();
  const barH = fitFont(h, 0.5, 200);
  const termSize = fitFont(h, 0.3, 132);
  const glossSize = fitFont(h, 0.085, 40);

  const barScale = useFade(4, 18, exit);
  const termTy = interpolate(frame, [6, 24], [110, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(EasingPreset.Smooth),
  });

  return (
    <Box
      style={{
        color: p.textColor,
        fontFamily: FONT.body,
        display: "flex",
        alignItems: "center",
        gap: 36,
        padding: "0 6%",
      }}
    >
      <div
        style={{
          width: 10,
          height: barH,
          background: p.accent,
          transformOrigin: "center",
          transform: `scaleY(${barScale})`,
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: TYPE_SCALE.xs,
            fontWeight: WEIGHT.bold,
            letterSpacing: TRACKING.kicker,
            textTransform: "uppercase",
            color: p.accent,
            opacity: fadeIn(frame, 8) * fade,
          }}
        >
          {p.kicker}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: WEIGHT.extraBold,
              fontSize: termSize,
              lineHeight: 0.96,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              transform: `translateY(${termTy}%)`,
              opacity: fade,
            }}
          >
            {p.term}
          </div>
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: WEIGHT.medium,
            fontSize: glossSize,
            lineHeight: 1.25,
            color: p.secondaryColor,
            opacity: fadeIn(frame, 22) * fade,
          }}
        >
          {p.gloss}
        </div>
      </div>
    </Box>
  );
};
