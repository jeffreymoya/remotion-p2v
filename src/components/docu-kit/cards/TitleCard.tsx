import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Slide } from "../Slide";
import { Chrome } from "../Chrome";
import { SplitText } from "../anim/SplitText";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset } from "../utils/easing";
import { COLORS, FONT, LEADING, TRACKING, TYPE_SCALE, WEIGHT } from "../utils/tokens";
import type { TextStyle } from "../utils/types";

export const titleCardSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  eyebrow: z.string(),
  line1: z.string(),
  line2: z.string(),
  metaItems: z.array(z.string()),
  accent: zColor(),
  textColor: zColor(),
  secondaryColor: zColor(),
  mutedColor: zColor(),
});

export type TitleCardProps = z.infer<typeof titleCardSchema>;

export const titleCardDefaults: TitleCardProps = {
  num: "01",
  name: "Title Card",
  meta: "Episode Opener",
  eyebrow: "An Open Secrets Investigation · Episode 01",
  line1: "The Quiet Collapse",
  line2:
    "How three private banks erased $400 billion in seventy-two hours.",
  metaItems: ["Premieres 11.14.2025", "Dir. Mira Achebe", "Frontline · 90 Min."],
  accent: COLORS.orange,
  textColor: COLORS.fg,
  secondaryColor: "rgba(239,233,220,0.72)",
  mutedColor: COLORS.muted,
};

export const TitleCard: React.FC<TitleCardProps> = (props) => {
  const p = { ...titleCardDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 18 });
  const fade = 1 - exit;

  const eyebrowOpacity =
    interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const metaOpacity =
    interpolate(frame, [40, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const barWidth =
    interpolate(frame, [34, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;

  const line1Style: TextStyle = {
    fontFamily: FONT.display,
    fontSize: TYPE_SCALE["5xl"],
    fontWeight: WEIGHT.extraBold,
    letterSpacing: TRACKING.display,
    lineHeight: 0.96,
    color: p.textColor,
    textTransform: "uppercase",
  };
  const line2Style: TextStyle = {
    fontFamily: FONT.display,
    fontSize: 60,
    fontWeight: WEIGHT.medium,
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
            fontWeight: WEIGHT.medium,
            fontSize: 26,
            letterSpacing: TRACKING.eyebrow,
            textTransform: "uppercase",
            color: p.mutedColor,
            marginBottom: 56,
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            opacity: eyebrowOpacity,
          }}
        >
          <span style={{ width: 10, height: 10, background: p.accent, borderRadius: "50%" }} />
          {p.eyebrow}
        </div>

        <div>
          <SplitText
            segments={[{ text: p.line1 }]}
            style={line1Style}
            startFrame={6}
            inFrames={20}
            stagger={4}
            easing={EasingPreset.Smooth}
            transforms={{ y: 36, blur: 12 }}
            exit={exit}
          />
        </div>
        <div style={{ marginTop: 36, maxWidth: 1320 }}>
          <SplitText
            segments={[{ text: p.line2 }]}
            style={line2Style}
            startFrame={20}
            inFrames={18}
            stagger={3}
            easing={EasingPreset.Smooth}
            transforms={{ y: 24, blur: 8 }}
            exit={exit}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 160,
          height: 1,
          width: `calc((100% - 320px) * ${barWidth})`,
          background: p.accent,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 88,
          left: 160,
          right: 160,
          display: "flex",
          justifyContent: "space-between",
          gap: 32,
          fontFamily: FONT.body,
          fontSize: TYPE_SCALE.xs,
          fontWeight: WEIGHT.medium,
          letterSpacing: TRACKING.meta,
          textTransform: "uppercase",
          color: p.mutedColor,
          opacity: metaOpacity,
        }}
      >
        {p.metaItems.map((item, i) => (
          <div key={i}>{item}</div>
        ))}
      </div>
    </Slide>
  );
};
