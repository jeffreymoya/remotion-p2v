import React from "react";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { SplitText } from "../anim/SplitText";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset } from "../common/easing";
import { COLORS, DEFAULT_LIFECYCLE, FONT, SHADOW, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";
import type { TextStyle } from "../common/types";

export const powerWordSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  kicker: z.string(),
  word: z.string(),
  accent: zColor(),
  textColor: zColor(),
  mutedColor: zColor(),
});

export type PowerWordProps = z.infer<typeof powerWordSchema>;

export const powerWordDefaults: PowerWordProps = {
  num: "12",
  name: "Power Word",
  meta: "Single Emphasis",
  kicker: "The catch",
  word: "Compounding",
  accent: COLORS.orange,
  textColor: COLORS.fg,
  mutedColor: COLORS.muted,
};

import { defineMeta } from "../common/meta";

export const powerWordMeta = defineMeta({
  tier: "composite",
  category: "overlay",
  purpose: "Lands one short power word or two-word phrase as a decisive emphasis beat.",
  whenToUse: "Punctuate the narration with a single dominant word the viewer must retain.",
  scriptCues: ["power word", "one word", "single word", "punch", "decisive", "key word", "the catch"],
  composes: ["Box", "SplitText", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/PowerWord.tsx",
});

export const PowerWord: React.FC<PowerWordProps> = (props) => {
  const p = { ...powerWordDefaults, ...props };
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);
  const fade = 1 - exit;

  const { h } = useBoxSize();
  // Shrink longer words so they stay within the box width.
  const lengthFactor = Math.max(0.5, Math.min(1, 9 / Math.max(1, p.word.length)));
  const wordSize = fitFont(h, 0.34 * lengthFactor, TYPE_SCALE["5xl"]);

  const kickerOpacity = useFade(2, 16, exit);
  const ruleScale = useFade(14, 30, exit);

  const useChar = p.word.trim().split(/\s+/).length === 1 && p.word.length <= 12;

  const wordStyle: TextStyle = {
    fontFamily: FONT.display,
    fontSize: wordSize,
    fontWeight: WEIGHT.black,
    letterSpacing: "-0.02em",
    lineHeight: 1.0,
    color: p.textColor,
    textTransform: "uppercase",
  };

  return (
    <Box
      dataVisualRole="hero-text"
      style={{
        color: p.textColor,
        fontFamily: FONT.body,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 6%",
        textAlign: "center",
        textShadow: SHADOW.textStrong,
      }}
    >
      {p.kicker ? (
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: TYPE_SCALE.xs,
            fontWeight: WEIGHT.bold,
            letterSpacing: TRACKING.kicker,
            textTransform: "uppercase",
            color: p.accent,
            marginBottom: "2.5%",
            opacity: kickerOpacity,
          }}
        >
          {p.kicker}
        </div>
      ) : null}

      <SplitText
        segments={[{ text: p.word }]}
        style={wordStyle}
        mode={useChar ? "char" : "word"}
        startFrame={6}
        inFrames={16}
        stagger={useChar ? 2 : 3}
        easing={EasingPreset.Smooth}
        transforms={{ y: 30, blur: 8 }}
        exit={exit}
      />

      <div
        style={{
          marginTop: "2.5%",
          width: "42%",
          height: 6,
          background: p.accent,
          transformOrigin: "center",
          transform: `scaleX(${ruleScale})`,
          opacity: fade,
        }}
      />
    </Box>
  );
};
