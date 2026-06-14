import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Slide } from "../Slide";
import { Chrome } from "../Chrome";
import { Typewriter, TypeLine } from "../anim/Typewriter";
import { useLifecycle } from "../anim/useLifecycle";
import { COLORS, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../utils/tokens";
import type { TextStyle } from "../utils/types";

const typeRun = z.object({
  text: z.string(),
  color: zColor().optional(),
  bold: z.boolean().optional(),
});
const typeLine = z.object({ runs: z.array(typeRun) });

export const typewriterMemoSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  from: z.string(),
  classification: z.string(),
  lines: z.array(typeLine),
  textColor: zColor(),
});

export type TypewriterMemoProps = z.infer<typeof typewriterMemoSchema>;

export const typewriterMemoDefaults: TypewriterMemoProps = {
  num: "06",
  name: "Typewriter Leak",
  meta: "Document Reveal",
  from: "From: r.kade@helix-cap.com · 02:14 AM",
  classification: "Confidential — Do Not Forward",
  lines: [
    { runs: [{ text: "SUBJECT:  " }, { text: "Wire instructions for Tranche 7.", bold: true }] },
    { runs: [{ text: "Marcus — clear this " }, { text: "before", color: COLORS.red, bold: true }, { text: " the 9 AM audit window." }] },
    { runs: [{ text: "Route through Aegis. Same vehicle as last quarter." }] },
    { runs: [{ text: "If anyone asks, it's an " }, { text: "internal liquidity adjustment.", bold: true }] },
    { runs: [{ text: "Burn this. — R." }] },
  ],
  textColor: COLORS.ink,
};

export const TypewriterMemo: React.FC<TypewriterMemoProps> = (props) => {
  const p = { ...typewriterMemoDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 18 });
  const fade = 1 - exit;

  const headerOpacity =
    interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;

  const bodyStyle: TextStyle = {
    fontFamily: FONT.mono,
    fontSize: 36,
    fontWeight: WEIGHT.regular,
    letterSpacing: "0",
    lineHeight: 1.6,
    color: p.textColor,
  };

  return (
    <Slide color={p.textColor}>
      <Chrome num={p.num} name={p.name} meta={p.meta} theme="light" accent={COLORS.red} />

      <div
        style={{
          position: "absolute",
          top: 150,
          left: 180,
          right: 180,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: 22,
          borderBottom: `2px solid ${p.textColor}`,
          opacity: headerOpacity,
        }}
      >
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 26,
            fontWeight: WEIGHT.bold,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: p.textColor,
          }}
        >
          {p.from}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            fontFamily: FONT.mono,
            fontSize: TYPE_SCALE.xs,
            fontWeight: WEIGHT.bold,
            letterSpacing: TRACKING.label,
            padding: "10px 18px",
            border: `2.5px solid ${COLORS.red}`,
            color: COLORS.red,
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 10, height: 10, background: COLORS.red, borderRadius: "50%" }} />
          {p.classification}
        </div>
      </div>

      <div style={{ position: "absolute", top: 280, left: 180, right: 180 }}>
        <Typewriter
          lines={p.lines as TypeLine[]}
          style={bodyStyle}
          startFrame={18}
          lineDurFrames={40}
          lineGapFrames={48}
          cursor
          cursorColor={p.textColor}
          exit={exit}
        />
      </div>
    </Slide>
  );
};
