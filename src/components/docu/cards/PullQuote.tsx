import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { SplitText } from "../anim/SplitText";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../common/easing";
import { COLORS, DEFAULT_LIFECYCLE, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";
import { zTextSegment } from "../common/schemas";
import type { TextSegment, TextStyle } from "../common/types";

export const pullQuoteSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  mark: z.string(),
  body: z.array(zTextSegment),
  attrName: z.string(),
  attrRole: z.string(),
  accent: zColor(),
  textColor: zColor(),
  mutedColor: zColor(),
});

export type PullQuoteProps = z.infer<typeof pullQuoteSchema>;

export const pullQuoteDefaults: PullQuoteProps = {
  num: "07",
  name: "Pull Quote",
  meta: "Whistleblower",
  mark: "\u201C",
  body: [
    { text: "I knew this would" },
    { text: "happen.", emphasis: true },
    { text: "I just didn't think it would happen" },
    { text: "this fast.", emphasis: true },
  ],
  attrName: "Dr. Elena Vasquez",
  attrRole: "Fmr. Senior Analyst · U.S. Treasury",
  accent: COLORS.orange,
  textColor: COLORS.fg,
  mutedColor: COLORS.muted,
};

import { defineMeta } from "../common/meta";

export const pullQuoteMeta = defineMeta({
  tier: "composite",
  category: "quote",
  purpose: "Large editorial pulled quote with attribution.",
  whenToUse: "Feature a spoken or written statement as a standalone beat.",
  scriptCues: ["quote", "said", "statement", "testimony", "pull quote", "remarked", "\""],
  composes: ["Box", "SplitText", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/PullQuote.tsx",
});

export const PullQuote: React.FC<PullQuoteProps> = (props) => {
  const p = { ...pullQuoteDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);
  const fade = 1 - exit;

  const { h } = useBoxSize();
  const markSize = fitFont(h, 0.5, 540);
  const bodySize = fitFont(h, 0.13, 116);

  const markProgress = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(EasingPreset.CubicOut),
  });
  const attrOpacity = useFade(40, 56, exit);

  const bodyStyle: TextStyle = {
    fontFamily: FONT.display,
    fontSize: bodySize,
    fontWeight: WEIGHT.semiBold,
    letterSpacing: "-0.012em",
    lineHeight: 1.05,
    color: p.textColor,
  };

  return (
    <Box style={{ color: p.textColor, fontFamily: FONT.body }}>
      <div
        data-visual-role="decorative"
        style={{
          position: "absolute",
          left: "4%",
          top: "2%",
          fontFamily: FONT.serif,
          fontSize: markSize,
          lineHeight: 0.8,
          color: p.accent,
          fontWeight: WEIGHT.bold,
          opacity: markProgress * 0.92 * fade,
          transform: `scale(${0.8 + 0.2 * markProgress})`,
        }}
      >
        {p.mark}
      </div>

      <div
        data-visual-role="quote"
        style={{
          position: "absolute",
          inset: 0,
          padding: "0 9%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <SplitText
            segments={p.body as TextSegment[]}
            style={bodyStyle}
            startFrame={18}
            inFrames={18}
            stagger={3}
            easing={EasingPreset.Smooth}
            transforms={{ y: 18, blur: 6 }}
            emphasisColor={p.accent}
            emphasisWeight={WEIGHT.bold}
            exit={exit}
          />
        </div>

        <div
          style={{
            marginTop: "5%",
            display: "flex",
            alignItems: "center",
            gap: 28,
            position: "relative",
            zIndex: 2,
            opacity: attrOpacity,
          }}
        >
          <div style={{ width: 56, height: 1, background: p.accent }} />
          <div>
            <div
              style={{
                fontFamily: FONT.body,
                fontWeight: WEIGHT.bold,
                fontSize: 28,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: p.textColor,
              }}
            >
              {p.attrName}
            </div>
            <div
              style={{
                fontFamily: FONT.body,
                fontWeight: WEIGHT.regular,
                fontSize: TYPE_SCALE.xs,
                letterSpacing: TRACKING.meta,
                textTransform: "uppercase",
                color: p.mutedColor,
              }}
            >
              {p.attrRole}
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
};
