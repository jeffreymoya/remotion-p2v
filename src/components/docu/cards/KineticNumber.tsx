import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { SplitText } from "../anim/SplitText";
import { formatCountUp } from "../anim/useCountUp";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset } from "../common/easing";
import { COLORS, DEFAULT_LIFECYCLE, DISPLAY_SIZE, FONT, LEADING, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";
import type { TextStyle } from "../common/types";

export const kineticNumberSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  eyebrow: z.string(),
  currency: z.string(),
  target: z.number(),
  decimals: z.number(),
  unit: z.string(),
  label: z.string(),
  source: z.string(),
  accent: zColor(),
  textColor: zColor(),
  secondaryColor: zColor(),
  mutedColor: zColor(),
});

export type KineticNumberProps = Readonly<z.infer<typeof kineticNumberSchema>>;

export const kineticNumberDefaults: KineticNumberProps = {
  num: "03",
  name: "Kinetic Number",
  meta: "Count-Up Stat",
  eyebrow: "Between Mar 2021 — Jun 2024",
  currency: "$",
  target: 2.4,
  decimals: 1,
  unit: "B",
  label: "vanished from client trust accounts at Helix Capital Partners.",
  source: "Source · SEC Filing 10-K · Internal Audit, Mar 2025",
  accent: COLORS.orange,
  textColor: COLORS.fg,
  secondaryColor: "rgba(239,233,220,0.78)",
  mutedColor: COLORS.muted,
};

import { defineMeta } from "../common/meta";

export const kineticNumberMeta = defineMeta({
  tier: "composite",
  category: "data",
  purpose: "Large animated count-up statistic with label and unit.",
  whenToUse: "Land a single dramatic figure (percentage, money, multiplier).",
  scriptCues: ["number", "statistic", "percent", "figure", "count", "grew", "fell", "billion", "trillion", "%", "x"],
  composes: ["Box", "SplitText", "formatCountUp", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/KineticNumber.tsx",
});

export const KineticNumber: React.FC<KineticNumberProps> = (props) => {
  const p = { ...kineticNumberDefaults, ...props };
  const frame = useCurrentFrame();
  const { h } = useBoxSize();
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);
  const fade = 1 - exit;

  const eyebrowOpacity = useFade(0, 12, exit);
  const ruleWidth = useFade(40, 66, exit);
  const sourceOpacity = useFade(18, 30, exit);

  const numSize = fitFont(h, 0.4, TYPE_SCALE["7xl"]);
  const glyphSize = fitFont(h, 0.22, DISPLAY_SIZE.statGlyph);

  const digits = formatCountUp(frame, {
    target: p.target,
    startFrame: 18,
    durFrames: 54,
    decimals: p.decimals,
  });

  const labelStyle: TextStyle = {
    fontFamily: FONT.display,
    fontSize: fitFont(h, 0.085, DISPLAY_SIZE.statLabel),
    fontWeight: WEIGHT.semiBold,
    letterSpacing: "0.005em",
    lineHeight: LEADING.tight,
    color: p.secondaryColor,
  };

  return (
    <Box
      style={{
        color: p.textColor,
        fontFamily: FONT.body,
        display: "flex",
        flexDirection: "column",
        padding: "6% 8%",
      }}
    >
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: TYPE_SCALE.xs,
            fontWeight: WEIGHT.medium,
            letterSpacing: TRACKING.eyebrow,
            textTransform: "uppercase",
            color: p.accent,
            marginBottom: "2.5%",
            opacity: eyebrowOpacity,
          }}
        >
          {p.eyebrow}
        </div>

        <div
          data-visual-role="hero-text"
          style={{
            fontFamily: FONT.display,
            fontWeight: WEIGHT.black,
            fontSize: numSize,
            lineHeight: 0.86,
            letterSpacing: TRACKING.tight,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            fontVariantNumeric: "tabular-nums",
            opacity: fade,
          }}
        >
          <span style={{ fontSize: glyphSize, fontWeight: WEIGHT.extraBold, transform: "translateY(-0.07em)" }}>
            {p.currency}
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{digits}</span>
          <span style={{ fontSize: glyphSize, fontWeight: WEIGHT.bold, color: p.accent, marginLeft: 12, transform: "translateY(-0.07em)" }}>
            {p.unit}
          </span>
        </div>

        <div style={{ height: 1, width: `${ruleWidth * 100}%`, background: p.textColor, margin: "4% 0 2.5%" }} />

        <div>
          <SplitText
            segments={[{ text: p.label }]}
            style={labelStyle}
            startFrame={54}
            inFrames={16}
            stagger={2}
            easing={EasingPreset.CubicOut}
            transforms={{ y: 20, blur: 4 }}
            exit={exit}
          />
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          fontFamily: FONT.body,
          fontSize: TYPE_SCALE.xs,
          fontWeight: WEIGHT.regular,
          letterSpacing: TRACKING.label,
          textTransform: "uppercase",
          color: p.mutedColor,
          opacity: sourceOpacity,
        }}
      >
        {p.source}
      </div>
    </Box>
  );
};
