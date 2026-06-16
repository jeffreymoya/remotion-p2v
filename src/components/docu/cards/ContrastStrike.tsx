import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { Reveal } from "../anim/Reveal";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../common/easing";
import { COLORS, DEFAULT_LIFECYCLE, FONT, SHADOW, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";

export const contrastStrikeSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  lead: z.string(),
  wrong: z.string(),
  connector: z.string(),
  right: z.string(),
  strikeColor: zColor(),
  accent: zColor(),
  textColor: zColor(),
  mutedColor: zColor(),
});

export type ContrastStrikeProps = z.infer<typeof contrastStrikeSchema>;

export const contrastStrikeDefaults: ContrastStrikeProps = {
  num: "14",
  name: "Contrast Strike",
  meta: "Myth Versus Reality",
  lead: "It isn't",
  wrong: "saving",
  connector: "it's",
  right: "insurance",
  strikeColor: COLORS.red,
  accent: COLORS.orange,
  textColor: COLORS.fg,
  mutedColor: COLORS.muted,
};

import { defineMeta } from "../common/meta";

export const contrastStrikeMeta = defineMeta({
  tier: "composite",
  category: "comparison",
  purpose: "Strikes a wrong or outdated framing and replaces it with the corrected emphasis word.",
  whenToUse: "Emphasise a correction or contrast — 'not X, but Y'.",
  scriptCues: ["contrast", "not", "instead", "versus", "correction", "myth", "reality", "but actually"],
  composes: ["Box", "Reveal", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/ContrastStrike.tsx",
});

export const ContrastStrike: React.FC<ContrastStrikeProps> = (props) => {
  const p = { ...contrastStrikeDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);
  const fade = 1 - exit;

  const { h } = useBoxSize();
  const size = fitFont(h, 0.2, TYPE_SCALE["3xl"]);
  const leadSize = fitFont(h, 0.07, 48);

  const leadOpacity = useFade(2, 16, exit);
  const wrongOpacity = useFade(8, 20, exit);
  const connectorOpacity = useFade(34, 46, exit);
  const rightProgress = interpolate(frame, [40, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(EasingPreset.Spring),
  });

  return (
    <Box
      dataVisualRole="hero-text"
      style={{
        color: p.textColor,
        fontFamily: FONT.display,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 6%",
        textAlign: "center",
        textShadow: SHADOW.text,
      }}
    >
      {p.lead ? (
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: leadSize,
            fontWeight: WEIGHT.medium,
            letterSpacing: TRACKING.wide,
            textTransform: "uppercase",
            color: p.mutedColor,
            marginBottom: "2%",
            opacity: leadOpacity,
          }}
        >
          {p.lead}
        </div>
      ) : null}

      <div
        style={{
          fontWeight: WEIGHT.extraBold,
          fontSize: size,
          lineHeight: 1.0,
          letterSpacing: "-0.02em",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.3em",
        }}
      >
        <span style={{ opacity: wrongOpacity, color: p.mutedColor }}>
          <Reveal variant="strike" color={p.strikeColor} startFrame={20} durFrames={18} exit={exit}>
            {p.wrong}
          </Reveal>
        </span>
        {p.connector ? (
          <span
            style={{
              fontFamily: FONT.body,
              fontSize: leadSize,
              fontWeight: WEIGHT.semiBold,
              textTransform: "lowercase",
              color: p.mutedColor,
              opacity: connectorOpacity,
            }}
          >
            {p.connector}
          </span>
        ) : null}
        <span
          style={{
            color: p.accent,
            opacity: rightProgress * fade,
            transform: `translateY(${(1 - rightProgress) * 24}px) scale(${0.9 + 0.1 * rightProgress})`,
            display: "inline-block",
          }}
        >
          {p.right}
        </span>
      </div>
    </Box>
  );
};
