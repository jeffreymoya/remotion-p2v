import React from "react";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { Typewriter, TypeLine } from "../anim/Typewriter";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import { COLORS, DEFAULT_LIFECYCLE, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";
import type { TextStyle } from "../common/types";

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

import { defineMeta } from "../common/meta";

export const typewriterMemoMeta = defineMeta({
  tier: "composite",
  category: "document",
  purpose: "Typed memo/letter revealed character by character on a document surface.",
  whenToUse: "Show correspondence, notes, or a paper trail being read.",
  scriptCues: ["memo", "letter", "email", "typed", "document", "note", "correspondence"],
  composes: ["Box", "Typewriter", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/TypewriterMemo.tsx",
});

export const TypewriterMemo: React.FC<TypewriterMemoProps> = (props) => {
  const p = { ...typewriterMemoDefaults, ...props };
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);

  const headerOpacity = useFade(4, 18, exit);

  const { h } = useBoxSize();
  const bodySize = fitFont(h, 0.045, 36);

  const bodyStyle: TextStyle = {
    fontFamily: FONT.mono,
    fontSize: bodySize,
    fontWeight: WEIGHT.regular,
    letterSpacing: "0",
    lineHeight: 1.6,
    color: p.textColor,
  };

  return (
    <Box style={{ color: p.textColor, fontFamily: FONT.body, display: "flex", flexDirection: "column", padding: "7% 8%" }}>
      <div
        style={{
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

      <div style={{ marginTop: "5%" }}>
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
    </Box>
  );
};
