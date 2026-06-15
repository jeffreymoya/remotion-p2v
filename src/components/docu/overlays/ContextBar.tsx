import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { useLifecycle } from "../anim/useLifecycle";
import { Box } from "../common/Box";
import { COLORS, FONT, SHADOW, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";

export const contextBarSchema = z.object({
  cycleItems: z.array(z.string()),
  accent: zColor(),
  background: z.string(),
  textColor: zColor(),
  itemDurationFrames: z.number(),
  height: z.number(),
});

export type ContextBarProps = z.infer<typeof contextBarSchema>;

export const contextBarDefaults: ContextBarProps = {
  cycleItems: [
    "Source · SEC Filing 10-K",
    "Internal Audit · Mar 2025",
    "Senate Banking Committee",
  ],
  accent: COLORS.orange,
  background: "rgba(17,17,17,0.87)",
  textColor: COLORS.fg,
  itemDurationFrames: 90,
  height: 64,
};

import { defineMeta } from "../common/meta";

export const contextBarMeta = defineMeta({
  tier: "composite",
  category: "overlay",
  purpose: "Persistent context/status overlay strip.",
  whenToUse: "Keep a running label, status, or location visible across a beat.",
  scriptCues: ["context", "status", "label", "overlay", "banner", "tag", "location"],
  composes: ["Box", "useLifecycle"],
  canonicalExample: "src/components/docu/overlays/ContextBar.tsx",
});

const ITEM_FADE = 8;

/**
 * Bottom context bar that slides up and cycles through caption items. Ported
 * from `DocuContextBar`: `StaggeredMotion` → `useLifecycle`, the `AnimatedText`
 * cycle → frame-driven index + fade.
 */
export const ContextBar: React.FC<ContextBarProps> = (props) => {
  const p = { ...contextBarDefaults, ...props };
  const frame = useCurrentFrame();
  const { enter } = useLifecycle({ delay: 0, inFrames: 12, holdFrames: 0, outFrames: 0 });

  const n = p.cycleItems.length;
  const item = n > 0 ? p.cycleItems[Math.floor(frame / p.itemDurationFrames) % n] : "";
  const localT = frame % p.itemDurationFrames;
  const itemOpacity = Math.min(
    interpolate(localT, [0, ITEM_FADE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(localT, [p.itemDurationFrames - ITEM_FADE, p.itemDurationFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <Box
      dataVisualRole="metadata"
      style={{
        minHeight: p.height,
        background: p.background,
        borderLeft: `4px solid ${p.accent}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        backdropFilter: "blur(6px)",
        transform: `translateY(${(1 - enter) * 80}px)`,
        opacity: enter,
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: TYPE_SCALE.sm,
          fontWeight: WEIGHT.medium,
          color: p.textColor,
          letterSpacing: TRACKING.wide,
          textShadow: SHADOW.text,
          opacity: itemOpacity,
        }}
      >
        {item}
      </div>
    </Box>
  );
};
