import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Slide } from "../Slide";
import { Chrome } from "../Chrome";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../utils/easing";
import { COLORS, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../utils/tokens";

export const lowerThirdSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  kicker: z.string(),
  nameRows: z.array(z.string()),
  title: z.string(),
  cite: z.string(),
  accent: zColor(),
  textColor: zColor(),
  secondaryColor: zColor(),
  mutedColor: zColor(),
});

export type LowerThirdChyronProps = z.infer<typeof lowerThirdSchema>;

export const lowerThirdDefaults: LowerThirdChyronProps = {
  num: "02",
  name: "Lower-Third Chyron",
  meta: "Interview Identifier",
  kicker: "Whistleblower · Episode 03",
  nameRows: ["Dr. Elena", "Vasquez"],
  title: "Former Senior Analyst · U.S. Treasury",
  cite: "Filmed Manhattan · 07 Sept 2024 · Identity confirmed",
  accent: COLORS.orange,
  textColor: COLORS.fg,
  secondaryColor: "rgba(239,233,220,0.72)",
  mutedColor: COLORS.muted,
};

const slideX = (frame: number, start: number): number =>
  interpolate(frame, [start, start + 16], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(EasingPreset.CubicOut),
  });
const fadeIn = (frame: number, start: number): number =>
  interpolate(frame, [start, start + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const LowerThirdChyron: React.FC<LowerThirdChyronProps> = (props) => {
  const p = { ...lowerThirdDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 16 });
  const fade = 1 - exit;

  const barScale =
    interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;

  return (
    <Slide color={p.textColor}>
      <Chrome num={p.num} name={p.name} meta={p.meta} accent={p.accent} />

      <div
        style={{
          position: "absolute",
          left: 120,
          bottom: 140,
          display: "flex",
          alignItems: "flex-end",
          gap: 36,
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: 8,
            height: 220,
            background: p.accent,
            transformOrigin: "bottom",
            transform: `scaleY(${barScale})`,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 22,
              fontWeight: WEIGHT.medium,
              letterSpacing: TRACKING.meta,
              textTransform: "uppercase",
              color: p.accent,
              opacity: fadeIn(frame, 8) * fade,
              transform: `translateX(${slideX(frame, 8)}px)`,
            }}
          >
            {p.kicker}
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: WEIGHT.extraBold,
              fontSize: 128,
              lineHeight: 0.92,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
            }}
          >
            {p.nameRows.map((row, i) => {
              const start = 6 + i * 4;
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
              fontFamily: FONT.display,
              fontWeight: WEIGHT.medium,
              fontSize: 44,
              letterSpacing: "0.01em",
              color: p.secondaryColor,
              marginTop: 14,
              opacity: fadeIn(frame, 22) * fade,
              transform: `translateX(${slideX(frame, 22)}px)`,
            }}
          >
            {p.title}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          bottom: 90,
          fontFamily: FONT.body,
          fontSize: TYPE_SCALE.xs,
          fontWeight: WEIGHT.regular,
          letterSpacing: TRACKING.label,
          textTransform: "uppercase",
          color: p.mutedColor,
          zIndex: 3,
          opacity: fadeIn(frame, 30) * 0.7 * fade,
        }}
      >
        {p.cite}
      </div>
    </Slide>
  );
};
