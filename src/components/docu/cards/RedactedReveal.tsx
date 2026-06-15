import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { Reveal } from "../anim/Reveal";
import { Stamp } from "../anim/Stamp";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../common/easing";
import { COLORS, DEFAULT_LIFECYCLE, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";

const docSegment = z.object({ text: z.string(), redacted: z.boolean().optional() });

export const redactedRevealSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  caption: z.string(),
  stamp: z.string(),
  doc: z.array(docSegment),
  accent: zColor(),
  textColor: zColor(),
  mutedColor: zColor(),
});

export type RedactedRevealProps = z.infer<typeof redactedRevealSchema>;

export const redactedRevealDefaults: RedactedRevealProps = {
  num: "04",
  name: "Redacted Reveal",
  meta: "Document Disclosure",
  caption: "Internal Memo — Office of the General Counsel",
  stamp: "Declassified · 04.18.2025",
  doc: [
    { text: "The investigation determined that" },
    { text: "Reinhardt", redacted: true },
    { text: "personally authorized wire transfers totaling" },
    { text: "$1.8B", redacted: true },
    { text: "to" },
    { text: "Aegis Holdings, Cayman", redacted: true },
    { text: "— knowing the funds were client deposits." },
  ],
  accent: COLORS.orange,
  textColor: COLORS.fg,
  mutedColor: COLORS.muted,
};

import { defineMeta } from "../common/meta";

export const redactedRevealMeta = defineMeta({
  tier: "composite",
  category: "evidence",
  purpose: "Redaction bars that wipe away to reveal hidden text.",
  whenToUse: "Stage a leak/declassified reveal or a suppressed fact.",
  scriptCues: ["redacted", "classified", "reveal", "censored", "hidden", "leak", "declassified"],
  composes: ["Box", "Reveal", "Stamp", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/RedactedReveal.tsx",
});

export const RedactedReveal: React.FC<RedactedRevealProps> = (props) => {
  const p = { ...redactedRevealDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);
  const fade = 1 - exit;

  const { h } = useBoxSize();
  const docSize = fitFont(h, 0.08, 64);

  const captionOpacity = useFade(0, 12, exit);

  let wordIndex = 0;
  let barIndex = 0;
  const nodes: React.ReactNode[] = [];

  p.doc.forEach((seg, si) => {
    if (seg.redacted) {
      const start = 72 + barIndex * 12;
      barIndex += 1;
      nodes.push(
        <Reveal
          key={`r-${si}`}
          variant="redact"
          color={COLORS.red}
          startFrame={start}
          durFrames={20}
          easing={EasingPreset.Swipe}
          exit={exit}
        >
          <span style={{ fontFamily: FONT.display, fontWeight: WEIGHT.bold }}>{seg.text}</span>
        </Reveal>,
      );
      nodes.push(" ");
      return;
    }
    seg.text
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .forEach((word) => {
        const start = 6 + wordIndex * 1;
        wordIndex += 1;
        const progress = interpolate(frame, [start, start + 16], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: resolveEasing(EasingPreset.CubicOut),
        });
        nodes.push(
          <span
            key={`w-${si}-${word}-${wordIndex}`}
            style={{
              display: "inline-block",
              opacity: progress * fade,
              transform: `translateY(${(1 - progress) * 20}px)`,
              filter: progress < 0.99 ? `blur(${(1 - progress) * 4}px)` : undefined,
            }}
          >
            {word}
          </span>,
        );
        nodes.push(" ");
      });
  });

  return (
    <Box style={{ color: p.textColor, fontFamily: FONT.body }}>
      <Stamp
        startFrame={12}
        durFrames={10}
        fromScale={1.6}
        fromRotate={-12}
        toRotate={-3}
        fromBlur={0}
        exit={exit}
        data-visual-role="decorative"
        style={{
          position: "absolute",
          top: "4%",
          right: "8%",
          fontFamily: FONT.mono,
          fontSize: TYPE_SCALE.xs,
          fontWeight: WEIGHT.bold,
          letterSpacing: TRACKING.label,
          padding: "12px 22px",
          border: `2.5px solid ${COLORS.red}`,
          color: COLORS.red,
          textTransform: "uppercase",
          width: "fit-content",
          zIndex: 3,
        }}
      >
        {p.stamp}
      </Stamp>

      <div
        data-visual-role="document"
        style={{
          position: "absolute",
          inset: 0,
          padding: "9% 8%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: TYPE_SCALE.xs,
            fontWeight: WEIGHT.medium,
            letterSpacing: TRACKING.label,
            textTransform: "uppercase",
            color: p.mutedColor,
            marginBottom: "3%",
            display: "flex",
            gap: 18,
            alignItems: "center",
            opacity: captionOpacity,
          }}
        >
          <span style={{ width: 56, height: 1, background: p.accent }} />
          {p.caption}
        </div>

        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: WEIGHT.medium,
            fontSize: docSize,
            lineHeight: 1.32,
            letterSpacing: "0.005em",
            color: p.textColor,
          }}
        >
          {nodes}
        </div>
      </div>
    </Box>
  );
};
