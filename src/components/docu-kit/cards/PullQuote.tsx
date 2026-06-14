import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Slide } from "../Slide";
import { Chrome } from "../Chrome";
import { SplitText } from "../anim/SplitText";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../utils/easing";
import { COLORS, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../utils/tokens";
import { zTextSegment } from "../utils/schemas";
import type { TextSegment, TextStyle } from "../utils/types";

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

export const PullQuote: React.FC<PullQuoteProps> = (props) => {
  const p = { ...pullQuoteDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 18 });
  const fade = 1 - exit;

  const markProgress = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(EasingPreset.CubicOut),
  });
  const attrOpacity =
    interpolate(frame, [40, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;

  const bodyStyle: TextStyle = {
    fontFamily: FONT.display,
    fontSize: 116,
    fontWeight: WEIGHT.semiBold,
    letterSpacing: "-0.012em",
    lineHeight: 1.05,
    color: p.textColor,
  };

  return (
    <Slide color={p.textColor}>
      <Chrome num={p.num} name={p.name} meta={p.meta} accent={p.accent} />

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 130,
          fontFamily: FONT.serif,
          fontSize: 540,
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
        style={{
          position: "absolute",
          inset: 0,
          padding: "0 220px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 1480, position: "relative", zIndex: 2 }}>
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
            marginTop: 72,
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
    </Slide>
  );
};
