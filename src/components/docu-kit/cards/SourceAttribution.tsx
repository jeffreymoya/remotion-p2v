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

export const sourceAttributionSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  instRows: z.array(z.string()),
  instDate: z.string(),
  badge: z.string(),
  kicker: z.string(),
  head: z.array(zTextSegment),
  citeLabel: z.string(),
  cite: z.string(),
  accent: zColor(),
  textColor: zColor(),
  mutedColor: zColor(),
});

export type SourceAttributionProps = z.infer<typeof sourceAttributionSchema>;

export const sourceAttributionDefaults: SourceAttributionProps = {
  num: "09",
  name: "Source Attribution",
  meta: "Citation Card",
  instRows: ["Bloomberg", "News"],
  instDate: "14 March 2023 · 06:42 ET",
  badge: "Confirmed · Two Sources",
  kicker: "Exclusive · Financial Crime Desk",
  head: [
    { text: "Treasury launches criminal" },
    { text: "probe", emphasis: true },
    { text: "into Helix Capital and three" },
    { text: "unnamed", emphasis: true },
    { text: "co-conspirators." },
  ],
  citeLabel: "Doc 24-CR-0418",
  cite: "U.S. District Court, S.D.N.Y. — Sealed indictment unsealed at the request of the government, accessed via PACER.",
  accent: COLORS.orange,
  textColor: COLORS.fg,
  mutedColor: COLORS.muted,
};

export const SourceAttribution: React.FC<SourceAttributionProps> = (props) => {
  const p = { ...sourceAttributionDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 16 });
  const fade = 1 - exit;

  const dividerScale =
    interpolate(frame, [4, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const dateOpacity =
    interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const badgeOpacity =
    interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const kickerOpacity =
    interpolate(frame, [9, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const citeOpacity =
    interpolate(frame, [50, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;

  const headStyle: TextStyle = {
    fontFamily: FONT.display,
    fontSize: 96,
    fontWeight: WEIGHT.bold,
    letterSpacing: "-0.008em",
    lineHeight: 1.04,
    color: p.textColor,
  };

  return (
    <Slide color={p.textColor}>
      <Chrome num={p.num} name={p.name} meta={p.meta} accent={p.accent} />

      <div
        style={{
          position: "absolute",
          inset: "180px 180px 200px 180px",
          display: "grid",
          gridTemplateColumns: "460px 1px 1fr",
          gap: 80,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: WEIGHT.extraBold,
              fontSize: 76,
              lineHeight: 0.96,
              letterSpacing: "0.005em",
              color: p.accent,
              textTransform: "uppercase",
            }}
          >
            {p.instRows.map((row, i) => {
              const start = 4 + i * 4;
              const ty = interpolate(frame, [start, start + 18], [110, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: resolveEasing(EasingPreset.Smooth),
              });
              return (
                <div key={i} style={{ overflow: "hidden" }}>
                  <div style={{ transform: `translateY(${ty}%)`, opacity: fade }}>{row}</div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: WEIGHT.medium,
              fontSize: 22,
              letterSpacing: TRACKING.kicker,
              textTransform: "uppercase",
              color: p.mutedColor,
              marginTop: 8,
              opacity: dateOpacity,
            }}
          >
            {p.instDate}
          </div>
          <div
            style={{
              marginTop: 36,
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 22px",
              border: `1.5px solid ${p.accent}`,
              fontFamily: FONT.body,
              fontWeight: WEIGHT.bold,
              fontSize: TYPE_SCALE.xs,
              letterSpacing: TRACKING.label,
              textTransform: "uppercase",
              color: p.accent,
              width: "fit-content",
              opacity: badgeOpacity,
            }}
          >
            <span style={{ width: 8, height: 8, background: p.accent, borderRadius: "50%" }} />
            {p.badge}
          </div>
        </div>

        <div style={{ width: 1, height: "100%", background: COLORS.line, transformOrigin: "top", transform: `scaleY(${dividerScale})` }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: WEIGHT.medium,
              fontSize: 22,
              letterSpacing: TRACKING.kicker,
              textTransform: "uppercase",
              color: p.mutedColor,
              display: "flex",
              gap: 18,
              alignItems: "center",
              opacity: kickerOpacity,
            }}
          >
            <span style={{ width: 36, height: 1, background: p.accent }} />
            {p.kicker}
          </div>
          <div style={{ maxWidth: 1180 }}>
            <SplitText
              segments={p.head as TextSegment[]}
              style={headStyle}
              startFrame={18}
              inFrames={16}
              stagger={2}
              easing={EasingPreset.CubicOut}
              transforms={{ y: 20, blur: 4 }}
              emphasisColor={p.accent}
              exit={exit}
            />
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: FONT.body,
              fontWeight: WEIGHT.regular,
              fontSize: TYPE_SCALE.xs,
              letterSpacing: "0.04em",
              color: p.mutedColor,
              fontStyle: "italic",
              maxWidth: 1100,
              opacity: citeOpacity,
            }}
          >
            <span
              style={{
                fontStyle: "normal",
                color: p.accent,
                fontWeight: WEIGHT.bold,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginRight: 14,
              }}
            >
              {p.citeLabel}
            </span>
            {p.cite}
          </div>
        </div>
      </div>
    </Slide>
  );
};
