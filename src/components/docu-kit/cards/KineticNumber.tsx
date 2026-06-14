import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Slide } from "../Slide";
import { Chrome } from "../Chrome";
import { SplitText } from "../anim/SplitText";
import { formatCountUp } from "../anim/useCountUp";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset } from "../utils/easing";
import { COLORS, FONT, LEADING, TRACKING, TYPE_SCALE, WEIGHT } from "../utils/tokens";
import type { TextStyle } from "../utils/types";

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

export type KineticNumberProps = z.infer<typeof kineticNumberSchema>;

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

export const KineticNumber: React.FC<KineticNumberProps> = (props) => {
  const p = { ...kineticNumberDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 18 });
  const fade = 1 - exit;

  const eyebrowOpacity =
    interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const ruleWidth =
    interpolate(frame, [40, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const sourceOpacity =
    interpolate(frame, [18, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;

  const digits = formatCountUp(frame, {
    target: p.target,
    startFrame: 18,
    durFrames: 54,
    decimals: p.decimals,
  });

  const labelStyle: TextStyle = {
    fontFamily: FONT.display,
    fontSize: 64,
    fontWeight: WEIGHT.semiBold,
    letterSpacing: "0.005em",
    lineHeight: LEADING.tight,
    color: p.secondaryColor,
  };

  return (
    <Slide color={p.textColor}>
      <Chrome num={p.num} name={p.name} meta={p.meta} accent={p.accent} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "0 160px",
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
            letterSpacing: TRACKING.eyebrow,
            textTransform: "uppercase",
            color: p.accent,
            marginBottom: 40,
            opacity: eyebrowOpacity,
          }}
        >
          {p.eyebrow}
        </div>

        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: WEIGHT.black,
            fontSize: TYPE_SCALE["7xl"],
            lineHeight: 0.86,
            letterSpacing: TRACKING.tight,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            fontVariantNumeric: "tabular-nums",
            opacity: fade,
          }}
        >
          <span style={{ fontSize: 220, fontWeight: WEIGHT.extraBold, opacity: 0.85, transform: "translateY(-32px)" }}>
            {p.currency}
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{digits}</span>
          <span style={{ fontSize: 220, fontWeight: WEIGHT.bold, color: p.accent, marginLeft: 12, transform: "translateY(-32px)" }}>
            {p.unit}
          </span>
        </div>

        <div style={{ height: 1, width: `${ruleWidth * 100}%`, background: p.textColor, margin: "64px 0 36px" }} />

        <div style={{ maxWidth: 1300 }}>
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
          position: "absolute",
          bottom: 90,
          left: 160,
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
    </Slide>
  );
};
