import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Slide } from "../Slide";
import { Chrome } from "../Chrome";
import { Reveal } from "../anim/Reveal";
import { Stamp } from "../anim/Stamp";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../utils/easing";
import { COLORS, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../utils/tokens";

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

export const RedactedReveal: React.FC<RedactedRevealProps> = (props) => {
  const p = { ...redactedRevealDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 18 });
  const fade = 1 - exit;

  const captionOpacity =
    interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;

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
    <Slide color={p.textColor}>
      <Chrome num={p.num} name={p.name} meta={p.meta} accent={p.accent} />

      <Stamp
        startFrame={12}
        durFrames={10}
        fromScale={1.6}
        fromRotate={-12}
        toRotate={-3}
        fromBlur={0}
        exit={exit}
        style={{
          position: "absolute",
          top: 130,
          right: 180,
          fontFamily: FONT.mono,
          fontSize: TYPE_SCALE.xs,
          fontWeight: WEIGHT.bold,
          letterSpacing: TRACKING.label,
          padding: "12px 22px",
          border: `2.5px solid ${COLORS.red}`,
          color: COLORS.red,
          textTransform: "uppercase",
          width: "fit-content",
        }}
      >
        {p.stamp}
      </Stamp>

      <div style={{ position: "absolute", inset: 0, padding: "200px 180px 0" }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: TYPE_SCALE.xs,
            fontWeight: WEIGHT.medium,
            letterSpacing: TRACKING.label,
            textTransform: "uppercase",
            color: p.mutedColor,
            marginBottom: 36,
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
            fontSize: 64,
            lineHeight: 1.32,
            letterSpacing: "0.005em",
            color: p.textColor,
            maxWidth: 1560,
          }}
        >
          {nodes}
        </div>
      </div>
    </Slide>
  );
};
