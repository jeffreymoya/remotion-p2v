import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { Reveal } from "../anim/Reveal";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../common/easing";
import { COLORS, DEFAULT_LIFECYCLE, FONT, SHADOW, TYPE_SCALE, WEIGHT } from "../common/tokens";

const phraseSegment = z.object({
  text: z.string(),
  highlight: z.enum(["mark", "strike"]).optional(),
});

export const highlightedPhraseSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  line: z.array(phraseSegment),
  markColor: zColor(),
  markTextColor: zColor(),
  strikeColor: zColor(),
  textColor: zColor(),
});

export type HighlightedPhraseProps = z.infer<typeof highlightedPhraseSchema>;

export const highlightedPhraseDefaults: HighlightedPhraseProps = {
  num: "11",
  name: "Highlighted Phrase",
  meta: "Operative Words",
  line: [
    { text: "Your mortgage rate" },
    { text: "resets in 90 days", highlight: "mark" },
    { text: "— and the new payment" },
    { text: "is not optional", highlight: "strike" },
  ],
  markColor: COLORS.yellow,
  markTextColor: COLORS.ink,
  strikeColor: COLORS.red,
  textColor: COLORS.fg,
};

import { defineMeta } from "../common/meta";

export const highlightedPhraseMeta = defineMeta({
  tier: "composite",
  category: "overlay",
  purpose: "Directs the eye to the operative words inside a spoken line with a highlighter swipe or strike.",
  whenToUse: "Stress one to three key words or a short phrase the narrator is emphasising mid-sentence.",
  scriptCues: ["emphasis", "key phrase", "highlight", "operative words", "underline", "stress", "mark"],
  composes: ["Box", "Reveal", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/HighlightedPhrase.tsx",
});

export const HighlightedPhrase: React.FC<HighlightedPhraseProps> = (props) => {
  const p = { ...highlightedPhraseDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);
  const fade = 1 - exit;

  const { h } = useBoxSize();
  const size = fitFont(h, 0.14, TYPE_SCALE["2xl"]);

  let wordIndex = 0;
  let markIndex = 0;
  const wordEl = (word: string, key: string): React.ReactNode => {
    const start = 4 + wordIndex * 1.2;
    wordIndex += 1;
    const progress = interpolate(frame, [start, start + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: resolveEasing(EasingPreset.CubicOut),
    });
    return (
      <span
        key={key}
        style={{
          display: "inline-block",
          opacity: progress * fade,
          transform: `translateY(${(1 - progress) * 16}px)`,
        }}
      >
        {word}
      </span>
    );
  };

  const renderInner = (text: string, si: number): React.ReactNode => {
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    return words.map((word, wi) => (
      <React.Fragment key={`${si}-${wi}`}>
        {wordEl(word, `w-${si}-${wi}`)}
        {wi < words.length - 1 ? " " : null}
      </React.Fragment>
    ));
  };

  const nodes: React.ReactNode[] = [];
  p.line.forEach((seg, si) => {
    const inner = renderInner(seg.text, si);
    if (seg.highlight) {
      const start = 26 + markIndex * 18;
      markIndex += 1;
      const isStrike = seg.highlight === "strike";
      nodes.push(
        <Reveal
          key={`h-${si}`}
          variant={isStrike ? "strike" : "highlight"}
          color={isStrike ? p.strikeColor : p.markColor}
          startFrame={start}
          durFrames={20}
          easing={EasingPreset.Swipe}
          exit={exit}
        >
          <span style={{ color: isStrike ? p.textColor : p.markTextColor }}>{inner}</span>
        </Reveal>,
      );
    } else {
      nodes.push(<React.Fragment key={`s-${si}`}>{inner}</React.Fragment>);
    }
    nodes.push(" ");
  });

  return (
    <Box
      dataVisualRole="hero-text"
      style={{
        color: p.textColor,
        fontFamily: FONT.display,
        display: "flex",
        alignItems: "center",
        padding: "0 8%",
        textShadow: SHADOW.text,
      }}
    >
      <div
        style={{
          fontWeight: WEIGHT.extraBold,
          fontSize: size,
          lineHeight: 1.1,
          letterSpacing: "-0.015em",
        }}
      >
        {nodes}
      </div>
    </Box>
  );
};
